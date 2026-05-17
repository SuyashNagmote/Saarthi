'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { TopBar } from '@/components/layout/TopBar';
import { GoalCard } from '@/components/common/GoalCard';
import { EmptyState } from '@/components/common/EmptyState';
import { bulkSubmitGoals, getWeightageSummary, listGoals } from '@/lib/api/goals';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useState } from 'react';
import { Target } from 'lucide-react';
import { SkeletonList } from '@/components/common/SkeletonBlock';
import { GOAL_RULES } from '@/lib/constants/goal-rules';

export default function GoalsPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['goals', filter],
    queryFn: () => listGoals(filter ? { status: filter } : undefined),
  });

  const goals = data?.goals ?? [];
  const canCreate = user?.role === 'EMPLOYEE';

  const { data: weightSummary } = useQuery({
    queryKey: ['goals', 'weightage-summary'],
    queryFn: getWeightageSummary,
    enabled: canCreate,
  });
  const draftCount = goals.filter((g) => g.status === 'DRAFT').length;

  async function handleBulkSubmit() {
    try {
      const result = await bulkSubmitGoals();
      toast.success(`Submitted ${result.submitted} goal(s) for approval.`);
      qc.invalidateQueries({ queryKey: ['goals'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submit failed');
    }
  }

  const STATUS_FILTERS = [
    { value: '', label: 'All' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
    { value: 'LOCKED', label: 'Locked' },
    { value: 'REWORK_REQUESTED', label: 'Needs Rework' },
  ];

  return (
    <>
      <TopBar
        title="Goals"
        subtitle={
          canCreate && weightSummary
            ? `${goals.length} of ${GOAL_RULES.MAX_GOALS_PER_CYCLE} goals · ${weightSummary.total}% / 100% allocated`
            : undefined
        }
      />
      <div className="p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value || 'all'}
                type="button"
                onClick={() => setFilter(s.value)}
                className={`pill${filter === s.value ? ' active' : ''}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {canCreate && draftCount > 0 && (
              <button type="button" className="btn-ghost" onClick={handleBulkSubmit}>
                Submit all drafts
              </button>
            )}
            {canCreate && (
              <Link href="/goals/create" className="btn-primary inline-flex items-center">
                Add goal
              </Link>
            )}
          </div>
        </div>

        {isLoading && <SkeletonList count={4} height="h-24" />}

        {isError && (
          <div className="card p-8 text-center">
            <p className="text-[14px] text-[var(--color-danger)]">Failed to load goals.</p>
            <button type="button" className="btn-primary mt-4" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && goals.length === 0 && (
          <div className="card mx-auto max-w-md">
            <EmptyState
              icon={<Target size={24} className="text-[var(--color-text-3)]" />}
              title="No goals yet"
              description="Set your first goal for this cycle."
              actionLabel={canCreate ? 'Add goal' : undefined}
              actionHref={canCreate ? '/goals/create' : undefined}
            />
          </div>
        )}

        <div className="space-y-3">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      </div>
    </>
  );
}


