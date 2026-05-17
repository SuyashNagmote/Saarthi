'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { GoalStatusBadge } from '@/components/common/GoalStatusBadge';
import {
  deleteGoal,
  getGoal,
  getGoalTimeline,
  submitGoal,
} from '@/lib/api/goals';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useState } from 'react';
import {
  GOAL_TYPE_LABELS,
  UOM_LABELS,
  formatDate,
  formatScoreDisplay,
  formatTarget,
  toLabel,
} from '@/lib/utils/labels';
import { SkeletonBlock } from '@/components/common/SkeletonBlock';

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['goal', id],
    queryFn: () => getGoal(id),
  });

  const { data: timelineData } = useQuery({
    queryKey: ['goal-timeline', id],
    queryFn: () => getGoalTimeline(id),
  });

  const goal = data?.goal;
  const isOwner = Boolean(
    user && goal?.employee?.id === user.id
  );
  const canEdit =
    isOwner &&
    (goal?.status === 'DRAFT' || goal?.status === 'REWORK_REQUESTED');

  async function handleSubmit() {
    setError(null);
    try {
      await submitGoal(id);
      toast.success('Goal submitted for approval.');
      refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Submit failed';
      setError(msg);
      toast.error(msg);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this draft goal?')) return;
    await deleteGoal(id);
    toast.success('Goal deleted.');
    router.push('/goals');
  }

  if (isLoading) {
    return (
      <>
        <TopBar title="Goal" />
        <div className="p-6">
          <SkeletonBlock className="card h-48" />
        </div>
      </>
    );
  }

  if (!goal) {
    return (
      <>
        <TopBar title="Goal" />
        <div className="p-6">
          <p className="text-[var(--color-danger)]">Goal not found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={goal.title} />
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <GoalStatusBadge status={goal.status} />
                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em]">{goal.title}</h2>
                <p className="mt-1 text-[14px] text-[var(--color-text-2)]">{goal.thrust_area}</p>
              </div>
              {goal.computed_score != null && (
                <span className="font-mono text-[40px] text-[var(--color-text-1)]">
                  {formatScoreDisplay(goal.computed_score)}
                </span>
              )}
            </div>

            <p className="mt-4 text-[14px] text-[var(--color-text-2)]">{goal.description}</p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <Item label="Target" value={formatTarget(goal.target_value, goal.uom_type)} />
              <Item label="Weightage" value={`${goal.weightage}%`} />
              <Item label="Thrust area" value={goal.thrust_area} />
              <Item label="Category" value={goal.category} />
              <Item label="Deadline" value={formatDate(goal.deadline)} />
              <Item label="Unit of measure" value={UOM_LABELS[goal.uom_type] ?? toLabel(goal.uom_type)} />
              <Item label="Score formula" value={GOAL_TYPE_LABELS[goal.goal_type] ?? toLabel(goal.goal_type)} />
            </dl>

            {goal.ai_risk_reason && (
              <div
                className="mt-4 rounded-lg border p-3 text-[14px]"
                style={{
                  borderColor: 'var(--color-danger)',
                  background: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                }}
              >
                {goal.ai_risk_reason}
              </div>
            )}

            {error && <p className="mt-4 text-[14px] text-[var(--color-danger)]">{error}</p>}

            <div className="mt-6 flex flex-wrap gap-2">
              {canEdit && (
                <Link href={`/goals/${id}/edit`} className="btn-primary inline-flex">
                  Edit
                </Link>
              )}
              {goal.status === 'DRAFT' && isOwner && (
                <button type="button" className="btn-primary" onClick={handleSubmit}>
                  Submit for approval
                </button>
              )}
              {goal.status === 'DRAFT' && isOwner && (
                <button
                  type="button"
                  className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[14px] text-red-600"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}
              <Link
                href="/goals"
                className="inline-flex items-center rounded-md border border-[var(--color-border-2)] px-4 py-2 text-[14px]"
              >
                Back
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-[15px] font-medium">History</h3>
            <ul className="mt-4 space-y-4">
              {(timelineData?.timeline ?? []).map((entry) => (
                <li key={entry.id} className="border-l-2 border-[var(--color-border)] pl-4">
                  <p className="text-[14px] font-medium">
                    {entry.changer.name}{' '}
                    <span className="font-normal text-[var(--color-text-2)]">{toLabel(entry.action)}</span>
                  </p>
                  <p className="text-[13px] text-[var(--color-text-3)]">
                    {formatDate(entry.created_at)}
                  </p>
                  {entry.diff && typeof entry.diff === 'object' && Object.keys(entry.diff).length > 0 && (
                    <div className="mt-2 rounded bg-[var(--color-surface-2)] p-2 text-[12px] font-mono">
                      {Object.entries(entry.diff as Record<string, { from: unknown; to: unknown }>).map(([k, v]) => (
                        <div key={k} className="mb-1 last:mb-0">
                          <span className="text-[var(--color-text-3)]">{k}:</span>{' '}
                          <span className="text-[var(--color-danger)]">{JSON.stringify(v.from)}</span>
                          {' → '}
                          <span className="text-[var(--color-success)]">{JSON.stringify(v.to)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-3)] mb-4">Goal Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-3)]">Employee</p>
                <p className="mt-0.5 text-[13px] font-medium">{goal.employee?.name ?? '—'}</p>
                <p className="text-[12px] text-[var(--color-text-2)]">{goal.employee?.department ?? ''}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-3)]">Cycle</p>
                <p className="mt-0.5 text-[13px] font-medium">{goal.cycle?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-3)]">Self Rating</p>
                <p className="mt-0.5 text-[13px] font-medium">{goal.self_rating != null ? `${goal.self_rating} / 5` : '—'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-3)]">Self Achievement</p>
                <p className="mt-0.5 text-[13px] font-medium">{goal.self_achievement != null ? goal.self_achievement : '—'}</p>
              </div>
              {goal.self_notes && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-3)]">Self Notes</p>
                  <p className="mt-0.5 text-[13px] text-[var(--color-text-2)] leading-relaxed">{goal.self_notes}</p>
                </div>
              )}
            </div>
          </div>
          {goal.ai_risk_flag && (
            <div className="card p-5" style={{ borderColor: goal.ai_risk_flag === 'HIGH' ? 'var(--color-danger)' : 'var(--color-warning)', borderWidth: '1px' }}>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-3)] mb-2">AI Risk</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                style={{
                  background: goal.ai_risk_flag === 'HIGH' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                  color: goal.ai_risk_flag === 'HIGH' ? 'var(--color-danger)' : 'var(--color-warning)',
                }}
              >
                {goal.ai_risk_flag} RISK
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-[var(--color-text-3)]">{label}</dt>
      <dd className="font-mono text-[14px] text-[var(--color-text-1)]">{value}</dd>
    </div>
  );
}
