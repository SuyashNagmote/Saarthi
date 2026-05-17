'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoalStatusBadge } from '@/components/common/GoalStatusBadge';
import { getGoalTimeline, type AuditEntry } from '@/lib/api/goals';
import type { ApprovalRecord } from '@/lib/api/approvals';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { Pencil } from 'lucide-react';

interface Props {
  approval: ApprovalRecord;
  onAction: (
    action: 'approve' | 'reject' | 'rework',
    goalId: string,
    version: number,
    comments: string
  ) => void;
  onEdit: (
    goalId: string,
    version: number,
    data: { edited_target?: number; edited_weightage?: number }
  ) => void;
  onClose: () => void;
}

export function ApprovalSidePanel({ approval, onAction, onEdit, onClose }: Props) {
  const goal = approval.goal;
  const [activeTab, setActiveTab] = useState<'detail' | 'history'>('detail');
  const [comments, setComments] = useState('');
  const [editingTarget, setEditingTarget] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [targetVal, setTargetVal] = useState(String(goal?.target_value ?? 0));
  const [weightVal, setWeightVal] = useState(String(goal?.weightage ?? 0));

  useEscapeKey(true, onClose);

  const { data: timeline } = useQuery({
    queryKey: ['goal-timeline', goal?.id],
    queryFn: () => getGoalTimeline(goal?.id ?? ''),
    enabled: activeTab === 'history' && !!goal?.id,
  });

  function handleTargetSave() {
    const num = parseFloat(targetVal);
    if (!isNaN(num) && num > 0) {
      onEdit(goal.id, approval.version, { edited_target: num });
    }
    setEditingTarget(false);
  }

  function handleWeightSave() {
    const num = parseFloat(weightVal);
    if (!isNaN(num) && num >= 10 && num <= 50) {
      onEdit(goal.id, approval.version, { edited_weightage: num });
    }
    setEditingWeight(false);
  }

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label="Goal review"
      className="flex w-[420px] shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <h3 className="text-[15px] font-semibold">Goal Review</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)]"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        {(['detail', 'history'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className="flex-1 py-3 text-center text-[13px] font-medium capitalize"
            style={{
              borderBottom: activeTab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === t ? 'var(--color-accent)' : 'var(--color-text-2)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5">
        {activeTab === 'detail' && goal && (
          <div className="space-y-4">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)]">Employee</p>
              <p className="mt-1 text-[14px] font-medium">{goal.employee?.name}</p>
              <p className="text-[13px] text-[var(--color-text-2)]">{goal.employee?.department}</p>
            </div>

            <div>
              <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)]">Goal Title</p>
              <p className="mt-1 text-[14px] font-medium">{goal.title}</p>
            </div>

            <div>
              <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)]">Description</p>
              <p className="mt-1 text-[14px] text-[var(--color-text-2)]">{goal.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)]">Status</p>
                <div className="mt-1">
                  <GoalStatusBadge status={goal.status} />
                </div>
              </div>
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)]">Category</p>
                <p className="mt-1 text-[14px]">{goal.category}</p>
              </div>
            </div>

            {/* Inline-editable target — per §7.5 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)]">
                  Target Value
                </p>
                {editingTarget ? (
                  <div className="mt-1 flex gap-1">
                    <input
                      className="input h-8 w-full text-[13px]"
                      value={targetVal}
                      onChange={(e) => setTargetVal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTargetSave()}
                      autoFocus
                    />
                    <button type="button" onClick={handleTargetSave} className="text-[var(--color-success)] text-[13px]">✓</button>
                    <button type="button" onClick={() => setEditingTarget(false)} className="text-[var(--color-danger)] text-[13px]">✕</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="group mt-1 flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-[14px] font-medium hover:bg-[var(--color-accent-dim)] transition-colors"
                    onClick={() => { setTargetVal(String(goal.target_value)); setEditingTarget(true); }}
                    title="Click to edit"
                  >
                    {goal.target_value.toLocaleString()}
                    <Pencil size={11} className="opacity-0 group-hover:opacity-50 transition-opacity text-[var(--color-text-3)]" />
                  </button>
                )}
              </div>
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)]">
                  Weightage
                </p>
                {editingWeight ? (
                  <div className="mt-1 flex gap-1">
                    <input
                      className="input h-8 w-full text-[13px]"
                      value={weightVal}
                      onChange={(e) => setWeightVal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleWeightSave()}
                      autoFocus
                    />
                    <button type="button" onClick={handleWeightSave} className="text-[var(--color-success)] text-[13px]">✓</button>
                    <button type="button" onClick={() => setEditingWeight(false)} className="text-[var(--color-danger)] text-[13px]">✕</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="group mt-1 flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-[14px] font-medium hover:bg-[var(--color-accent-dim)] transition-colors"
                    onClick={() => { setWeightVal(String(goal.weightage)); setEditingWeight(true); }}
                    title="Click to edit"
                  >
                    {goal.weightage}%
                    <Pencil size={11} className="opacity-0 group-hover:opacity-50 transition-opacity text-[var(--color-text-3)]" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)]">Self Rating</p>
                <p className="mt-1 text-[14px]">{goal.self_rating ?? '—'}/5</p>
              </div>
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)]">Self Achievement</p>
                <p className="mt-1 text-[14px]">{goal.self_achievement ?? '—'}</p>
              </div>
            </div>

            {goal.self_notes && (
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)]">Self Notes</p>
                <p className="mt-1 rounded-md bg-[var(--color-surface-2)] p-3 text-[13px] text-[var(--color-text-2)]">
                  {goal.self_notes}
                </p>
              </div>
            )}

            {/* Previous approval comments */}
            {approval.comments && (
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)]">
                  Previous Comment
                </p>
                <p className="mt-1 rounded-md bg-[var(--color-warning-bg)] p-3 text-[13px]">
                  {approval.comments}
                </p>
              </div>
            )}

            {/* Comment box + action buttons */}
            {goal.status === 'PENDING_APPROVAL' && (
              <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
                <div>
                  <div className="mb-1 flex justify-between items-center">
                    <label className="text-[13px] font-medium text-[var(--color-text-2)]">Comment</label>
                    <span className="text-[11px] text-[var(--color-text-3)]">{comments.length}/500</span>
                  </div>
                  <textarea
                    className="input h-20 w-full resize-none py-2"
                    placeholder="Add a comment..."
                    maxLength={500}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary flex-1"
                    onClick={() => onAction('approve', goal.id, approval.version, comments)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-md border border-[var(--color-warning)] px-4 py-2 text-[13px] font-medium text-[var(--color-warning)] hover:bg-[var(--color-warning-bg)]"
                    onClick={() => onAction('rework', goal.id, approval.version, comments)}
                    disabled={!comments.trim()}
                  >
                    Rework
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-md border border-[var(--color-danger)] px-4 py-2 text-[13px] font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
                    onClick={() => onAction('reject', goal.id, approval.version, comments)}
                    disabled={!comments.trim()}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History tab — previous approval rounds per §7.5 */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {timeline?.timeline && timeline.timeline.length > 0 ? (
              timeline.timeline.map((entry: AuditEntry) => (
                <div key={entry.id} className="rounded-lg border border-[var(--color-border)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">{entry.action}</span>
                    <span className="text-[12px] text-[var(--color-text-3)]">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--color-text-2)]">
                    by {entry.changer?.name}
                  </p>
                  {entry.diff && Object.keys(entry.diff).length > 0 && (
                    <div className="mt-2 rounded bg-[var(--color-surface-2)] p-2 text-[12px] font-mono">
                      {Object.entries(entry.diff).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-[var(--color-text-3)]">{k}:</span>{' '}
                          <span className="text-[var(--color-danger)]">{String(v.from)}</span>
                          {' → '}
                          <span className="text-[var(--color-success)]">{String(v.to)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-[14px] text-[var(--color-text-3)]">
                No history found for this goal.
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
