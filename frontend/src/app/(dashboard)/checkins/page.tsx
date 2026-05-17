'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { WindowBanner } from '@/components/common/WindowBanner';
import { useAuthStore } from '@/lib/stores/auth.store';
import { listGoals, type Goal } from '@/lib/api/goals';
import { listCheckIns, addManagerComment, getWindowStatus, getCompletionStatus, type CheckIn } from '@/lib/api/checkins';
import { CheckInForm } from '@/components/forms/CheckInForm';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { ProgressStatusBadge } from '@/components/common/ProgressStatusBadge';
import { formatDate, formatTarget, toLabel } from '@/lib/utils/labels';
import { SkeletonList } from '@/components/common/SkeletonBlock';

type CheckInGoal = Goal & { existing?: CheckIn | null };

export default function CheckInsPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [selectedGoal, setSelectedGoal] = useState<CheckInGoal | null>(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [commentText, setCommentText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'mine' | 'team'>('mine');

  useEscapeKey(!!selectedGoal, () => setSelectedGoal(null));
  useEscapeKey(!!selectedCheckIn, () => setSelectedCheckIn(null));

  // Fetch window status to know if we can check in
  const { data: windowStatus } = useQuery({
    queryKey: ['window-status'],
    queryFn: getWindowStatus,
  });

  // Fetch goals (if employee, to list goals to check in for)
  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals', 'LOCKED'],
    queryFn: () => listGoals({ status: 'LOCKED' }),
    enabled: user?.role === 'EMPLOYEE' || user?.role === 'MANAGER',
  });

  // Fetch check-ins
  const { data: checkinsData, isLoading: checkinsLoading } = useQuery({
    queryKey: ['checkins', tab],
    queryFn: () => listCheckIns(), // The backend handles filtering by user role and team
  });

  // Fetch team completion status (if manager)
  const { data: completionData } = useQuery({
    queryKey: ['completion-status'],
    queryFn: getCompletionStatus,
    enabled: user?.role === 'MANAGER' || user?.role === 'ADMIN',
  });

  const checkins = checkinsData?.checkins ?? [];
  const myGoals = goalsData?.goals ?? [];
  const quarter = windowStatus?.windowType ? windowStatus.windowType.split('_')[0] : 'Q1';
  const isCheckInWindow =
    !!windowStatus?.isOpen &&
    windowStatus.windowType !== 'GOAL_SETTING';

  async function handleManagerComment(checkInId: string) {
    if (!commentText.trim()) return;
    setError(null);
    setMessage(null);
    try {
      await addManagerComment(checkInId, { manager_comment: commentText });
      toast.success('Manager comment saved.');
      setSelectedCheckIn(null);
      setCommentText('');
      qc.invalidateQueries({ queryKey: ['checkins'] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to add comment';
      setError(msg);
      toast.error(msg);
    }
  }

  function handleCheckInSuccess() {
    setSelectedGoal(null);
    toast.success('Check-in submitted.');
    qc.invalidateQueries({ queryKey: ['checkins'] });
  }

  // Helper to find if a check-in already exists for a goal in the current quarter
  function getExistingCheckIn(goalId: string) {
    if (!windowStatus?.isOpen) return null;
    return checkins.find(c => c.goal_id === goalId && c.quarter === quarter && c.employee_id === user?.id);
  }

  return (
    <>
      <TopBar title="Quarterly Check-ins" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="p-6 pb-2">
          <WindowBanner />
        </div>

        <div className="flex-1 overflow-auto p-6 pt-2">
          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <div className="mb-6 flex gap-2">
              <button
                type="button"
                onClick={() => setTab('mine')}
                className={`pill${tab === 'mine' ? ' active' : ''}`}
              >
                My Check-ins
              </button>
              <button
                type="button"
                onClick={() => setTab('team')}
                className={`pill${tab === 'team' ? ' active' : ''}`}
              >
                Team Check-ins
              </button>
            </div>
          )}

          {message && <p className="mb-4 text-[14px] text-[var(--color-success)]">{message}</p>}
          {error && <p className="mb-4 text-[14px] text-[var(--color-danger)]">{error}</p>}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Left/Main Column: Goals & Check-ins List */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Employee View: Active Goals needing Check-in */}
              {tab === 'mine' && isCheckInWindow && (
                <div className="card p-5">
                  <h3 className="text-[16px] font-semibold mb-4">Goals pending check-in ({quarter})</h3>
                  {goalsLoading ? (
                    <SkeletonList count={2} height="h-16" />
                  ) : myGoals.length === 0 ? (
                    <p className="text-[14px] text-[var(--color-text-2)]">No approved goals found to check in.</p>
                  ) : (
                    <div className="space-y-3">
                      {myGoals.map((goal) => {
                        const existing = getExistingCheckIn(goal.id);
                        return (
                          <div key={goal.id} className="rounded-lg border border-[var(--color-border)] p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-[14px]">{goal.title}</p>
                              <p className="text-[13px] text-[var(--color-text-2)]">Target: {formatTarget(goal.target_value, goal.uom_type)}</p>
                            </div>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => setSelectedGoal({ ...goal, existing })}
                            >
                              {existing ? 'Update' : 'Check-in'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Check-ins History List */}
              <div className="card p-5">
                <h3 className="text-[16px] font-semibold mb-4">
                  {tab === 'mine' ? 'My Check-in History' : 'Team Check-ins'}
                </h3>
                {checkinsLoading ? (
                  <div className="h-20 animate-pulse rounded bg-[var(--color-surface-2)]" />
                ) : checkins.filter(c => tab === 'team' ? c.employee_id !== user?.id : c.employee_id === user?.id).length === 0 ? (
                  <p className="text-[14px] text-[var(--color-text-2)]">No check-ins found.</p>
                ) : (
                  <div className="space-y-4">
                    {checkins
                      .filter(c => tab === 'team' ? c.employee_id !== user?.id : c.employee_id === user?.id)
                      .map((c) => (
                      <div key={c.id} className="rounded-lg border border-[var(--color-border)] p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            {tab === 'team' && <p className="text-[13px] font-semibold text-[var(--color-text-1)]">{c.employee?.name}</p>}
                            <p className="font-medium text-[14px]">{c.goal?.title}</p>
                            <p className="text-[12px] text-[var(--color-text-2)]">{c.quarter} Check-in • Achieved: {c.actual_achievement} / {c.goal?.target_value}</p>
                          </div>
                          <ProgressStatusBadge status={c.goal_status} />
                        </div>
                        {c.progress_notes && (
                          <p className="text-[13px] text-[var(--color-text-2)] bg-[var(--color-surface-2)] p-2 rounded mb-3">
                            &ldquo;{c.progress_notes}&rdquo;
                          </p>
                        )}
                        
                        {/* Manager Comment Section */}
                        {c.manager_comment ? (
                          <div className="mt-3 rounded border-l-2 border-[#3B82F6] bg-[rgba(59,130,246,0.08)] p-3">
                            <p className="text-[11px] font-semibold text-[#3B82F6] uppercase tracking-wide">Manager comment</p>
                            <p className="mt-1 text-[13px]">{c.manager_comment}</p>
                          </div>
                        ) : tab === 'team' && (
                          <button
                            type="button"
                            className="text-[13px] font-medium text-[var(--color-accent)] hover:underline mt-2"
                            onClick={() => setSelectedCheckIn(c)}
                          >
                            + Add Comment
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Context panels */}
            <div>
              {/* Manager Comment Panel */}
              {selectedCheckIn && (
                <div role="dialog" aria-modal="false" className="card p-5 mb-6 sticky top-6 border-[var(--color-accent)] shadow-md">
                  <h3 className="text-[16px] font-semibold mb-4">Add Manager Comment</h3>
                  <p className="text-[13px] font-medium mb-1">{selectedCheckIn.employee?.name}</p>
                  <p className="text-[12px] text-[var(--color-text-2)] mb-4">{selectedCheckIn.goal?.title}</p>
                  
                  <textarea
                    className="input h-24 w-full resize-none py-2 mb-3"
                    placeholder="Provide feedback..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" className="btn-primary bg-[var(--color-surface-2)] text-[var(--color-text-1)] hover:bg-[var(--color-border)]" onClick={() => setSelectedCheckIn(null)}>Cancel</button>
                    <button type="button" className="btn-primary" onClick={() => handleManagerComment(selectedCheckIn.id)}>Save Comment</button>
                  </div>
                </div>
              )}

              {/* Manager Status Widget */}
              {tab === 'team' && completionData && (
                <div className="card p-5">
                  <h3 className="text-[15px] font-semibold mb-4">Team Completion ({quarter})</h3>
                  <div className="space-y-3">
                    {completionData.employees.map((emp) => {
                      const completed = emp.checkins_submitted >= emp.total_goals && emp.total_goals > 0;
                      return (
                        <div key={emp.id} className="flex items-center justify-between">
                          <span className="text-[13px]">{emp.name}</span>
                          <span className="text-[12px] font-medium" style={{ color: completed ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {emp.total_goals === 0 ? 'No goals' : `${emp.checkins_submitted} / ${emp.total_goals}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedGoal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="card max-h-[90vh] w-full max-w-xl overflow-auto p-5 border-[var(--color-accent)] shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[16px] font-semibold">
                  {selectedGoal.existing ? 'Update Check-in' : 'Submit Check-in'}
                </h3>
                <p className="mt-1 text-[13px] font-medium">{selectedGoal.title}</p>
                <p className="text-[12px] text-[var(--color-text-2)]">
                  Target: {formatTarget(selectedGoal.target_value, selectedGoal.uom_type)} | Deadline: {formatDate(selectedGoal.deadline)}
                </p>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)]"
                onClick={() => setSelectedGoal(null)}
                aria-label="Close check-in"
              >
                <X size={16} />
              </button>
            </div>
            <CheckInForm
              goalId={selectedGoal.id}
              title={selectedGoal.title}
              uomType={selectedGoal.uom_type}
              goalType={selectedGoal.goal_type}
              targetValue={selectedGoal.target_value}
              deadline={selectedGoal.deadline}
              quarter={quarter}
              existingCheckIn={selectedGoal.existing ?? undefined}
              onSuccess={handleCheckInSuccess}
              onCancel={() => setSelectedGoal(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
