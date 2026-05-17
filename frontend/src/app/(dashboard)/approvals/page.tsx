'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { TopBar } from '@/components/layout/TopBar';
import { GoalStatusBadge } from '@/components/common/GoalStatusBadge';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import {
  listPendingApprovals,
  listApprovalHistory,
  approveGoal,
  rejectGoal,
  requestRework,
  editApproval,
  bulkApproveGoals,
  type ApprovalRecord,
} from '@/lib/api/approvals';
import { ApprovalSidePanel } from '@/components/forms/ApprovalSidePanel';
import { formatDate } from '@/lib/utils/labels';

export default function ApprovalsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<ApprovalRecord | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [conflictGoal, setConflictGoal] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');

  useEscapeKey(bulkConfirmOpen, () => {
    setBulkConfirmOpen(false);
    setBulkText('');
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['approvals', tab],
    queryFn: () => (tab === 'history' ? listApprovalHistory() : listPendingApprovals()),
  });

  const approvals = data?.approvals ?? [];

  function toggleCheck(goalId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  }

  function toggleAll() {
    if (checked.size === approvals.length) setChecked(new Set());
    else setChecked(new Set(approvals.map((a) => a.goal_id)));
  }

  async function handleAction(
    action: 'approve' | 'reject' | 'rework',
    goalId: string,
    version: number,
    comments: string
  ) {
    setError(null);
    setMessage(null);
    try {
      if (action === 'approve') {
        await approveGoal(goalId, { comments, version });
        toast.success('Goal approved and locked.');
      } else if (action === 'reject') {
        await rejectGoal(goalId, { comments, version });
        toast.success('Goal rejected.');
      } else {
        await requestRework(goalId, { comments, version });
        toast.success('Rework requested.');
      }
      setSelected(null);
      qc.invalidateQueries({ queryKey: ['approvals'] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Action failed';
      if (msg.includes('modified while you were reviewing')) {
        setConflictGoal(goalId);
      } else {
        setError(msg);
      }
    }
  }

  async function handleEdit(
    goalId: string,
    version: number,
    data: { edited_target?: number; edited_weightage?: number }
  ) {
    setError(null);
    try {
      await editApproval(goalId, { ...data, version });
      toast.success('Goal target/weightage updated.');
      qc.invalidateQueries({ queryKey: ['approvals'] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Edit failed';
      if (msg.includes('modified while you were reviewing')) {
        setConflictGoal(goalId);
      } else {
        setError(msg);
      }
    }
  }

  async function handleBulkApprove() {
    if (bulkText !== 'APPROVE') return;
    setError(null);
    setMessage(null);
    try {
      const result = await bulkApproveGoals({
        goal_ids: Array.from(checked),
        confirmed: true,
      });
      toast.success(`${result.approved} goal(s) approved.`);
      setChecked(new Set());
      setBulkConfirmOpen(false);
      setBulkText('');
      qc.invalidateQueries({ queryKey: ['approvals'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk approve failed');
    }
  }

  function handleConflictReload() {
    setConflictGoal(null);
    setSelected(null);
    qc.invalidateQueries({ queryKey: ['approvals'] });
  }

  useEscapeKey(!!conflictGoal, handleConflictReload);

  return (
    <>
      <TopBar title={tab === 'pending' ? `Approvals (${approvals.length} pending)` : 'Approvals — History'} />
      <div className="flex flex-1 overflow-hidden">
        {/* Main table area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('pending')}
                className={`pill${tab === 'pending' ? ' active' : ''}`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setTab('history')}
                className={`pill${tab === 'history' ? ' active' : ''}`}
              >
                History
              </button>
            </div>
            {checked.size > 0 && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setBulkConfirmOpen(true)}
              >
                Approve selected ({checked.size})
              </button>
            )}
          </div>

          {message && (
            <div className="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-[13px] font-medium" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-[13px] font-medium" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {error}
            </div>
          )}

          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-14 animate-pulse bg-[var(--color-surface-2)]" />
              ))}
            </div>
          )}

          {isError && (
            <div className="card p-8 text-center">
              <p className="text-[14px] text-[var(--color-danger)]">Failed to fetch approvals.</p>
              <button type="button" className="btn-primary mt-4" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && approvals.length === 0 && (
            <div className="card mx-auto max-w-md p-12 text-center">
              <h2 className="text-[18px] font-medium">No pending approvals</h2>
              <p className="mt-2 text-[14px] text-[var(--color-text-2)]">
                All goals have been reviewed. Check back later.
              </p>
            </div>
          )}

          {!isLoading && !isError && approvals.length > 0 && (
            <div className="card overflow-hidden">
              <table className="w-full table-fixed text-left text-[14px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                    {tab === 'pending' && (
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={checked.size === approvals.length && approvals.length > 0}
                          onChange={toggleAll}
                        />
                      </th>
                    )}
                    <th className="w-[200px] px-4 py-3 font-medium text-[var(--color-text-2)]">Employee</th>
                    <th className="w-[220px] px-4 py-3 font-medium text-[var(--color-text-2)]">Goal Title</th>
                    <th className="w-[120px] px-4 py-3 font-medium text-[var(--color-text-2)]">Submitted</th>
                    <th className="w-[120px] px-4 py-3 font-medium text-[var(--color-text-2)]">Deadline</th>
                    <th className="w-[100px] px-4 py-3 font-medium text-[var(--color-text-2)]">Weightage</th>
                    <th className="w-[130px] px-4 py-3 font-medium text-[var(--color-text-2)]">Status</th>
                    {tab === 'pending' && (
                      <th className="w-[160px] px-4 py-3 font-medium text-[var(--color-text-2)]">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((a) => (
                    <tr
                      key={a.id}
                      className="cursor-pointer border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)]"
                      style={{
                        background: selected?.id === a.id ? 'var(--color-accent-dim)' : undefined,
                      }}
                      onClick={() => setSelected(a)}
                    >
                      {tab === 'pending' && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked.has(a.goal_id)}
                            onChange={() => toggleCheck(a.goal_id)}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium">{a.goal?.employee?.name ?? '—'}</td>
                      <td className="px-4 py-3">{a.goal?.title ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--color-text-2)]">{formatDate(a.created_at)}</td>
                      <td className="px-4 py-3 text-[var(--color-text-2)]">
                        {a.goal?.deadline ? formatDate(a.goal.deadline) : '—'}
                      </td>
                      <td className="px-4 py-3">{a.goal?.weightage ?? 0}%</td>
                      <td className="px-4 py-3">
                        <GoalStatusBadge status={a.goal?.status ?? a.status} />
                      </td>
                      {tab === 'pending' && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn-secondary h-8 px-2 text-[12px]"
                              onClick={() => setSelected(a)}
                            >
                              Review
                            </button>
                            <button
                              type="button"
                              className="h-8 rounded-md border border-[var(--color-success)] px-2 text-[12px] text-[var(--color-success)] hover:bg-[var(--color-success-bg)]"
                              onClick={() => handleAction('approve', a.goal_id, a.version, '')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="h-8 rounded-md border border-[var(--color-danger)] px-2 text-[12px] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
                              onClick={() => {
                                setSelected(a);
                              }}
                            >
                              Rework
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side panel (NOT modal) per §7.5 */}
        {selected && (
          <ApprovalSidePanel
            approval={selected}
            onAction={handleAction}
            onEdit={handleEdit}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {/* Bulk confirm dialog — typed "APPROVE" per §7.5 */}
      {bulkConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div role="dialog" aria-modal="true" className="card mx-4 w-full max-w-md p-6">
            <h3 className="text-[16px] font-semibold">Confirm Bulk Approval</h3>
            <p className="mt-2 text-[14px] text-[var(--color-text-2)]">
              You are about to approve {checked.size} goal(s). Type <strong>APPROVE</strong> to confirm.
            </p>
            <input
              className="input mt-4"
              placeholder='Type "APPROVE"'
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                className="rounded-md border border-[var(--color-border)] px-4 py-2 text-[14px]"
                onClick={() => { setBulkConfirmOpen(false); setBulkText(''); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={bulkText !== 'APPROVE'}
                onClick={handleBulkApprove}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 409 Conflict modal — non-dismissible per §6.8 */}
      {conflictGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card mx-4 w-full max-w-md p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-warning-bg)]">
              <span className="text-[20px]">⚠️</span>
            </div>
            <h3 className="text-[16px] font-semibold">Conflict Detected</h3>
            <p className="mt-2 text-[14px] text-[var(--color-text-2)]">
              This goal was modified while you were reviewing. Please reload to see the latest version.
            </p>
            <button
              type="button"
              className="btn-primary mt-6"
              onClick={handleConflictReload}
            >
              Reload Goal
            </button>
          </div>
        </div>
      )}
    </>
  );
}
