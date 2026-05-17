'use client';

import { TopBar } from '@/components/layout/TopBar';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ProgressRing } from '@/components/common/ProgressRing';
import { useManagerDashboard } from '@/lib/hooks/useDashboard';
import { clampPct } from '@/lib/utils/labels';
import { AlertCircle, Users } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  score: number;
  checkins: number;
  goals: number;
  completionPct?: number;
}

export default function TeamPage() {
  const { data, isLoading, isError, refetch } = useManagerDashboard();
  const members = (data?.teamHeatmap ?? []) as TeamMember[];

  return (
    <>
      <TopBar title="Team" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="kpi-card">
            <p className="kpi-label">Team Members</p>
            <p className="kpi-value">{members.length}</p>
            <p className="kpi-sub">Active direct reports</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Avg Score</p>
            <p className="kpi-value">{Math.round(data?.summary?.avgTeamScore ?? 0)}</p>
            <p className="kpi-sub">Weighted score</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">At Risk</p>
            <p className={`kpi-value ${(data?.summary?.atRiskGoals ?? 0) > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
              {data?.summary?.atRiskGoals ?? 0}
            </p>
            <p className="kpi-sub">{(data?.summary?.atRiskGoals ?? 0) > 0 ? 'Goals needing attention' : 'All clear'}</p>
          </div>
        </div>

        {isLoading && <div className="card h-72 skeleton" />}

        {isError && (
          <div className="card p-10 text-center">
            <AlertCircle className="mx-auto mb-3 text-[var(--color-danger)]" size={28} />
            <p className="text-[14px] text-[var(--color-text-2)]">Failed to load team data.</p>
            <button type="button" className="btn-primary mt-4" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <DataTable
            data={members}
            getRowKey={(row) => row.id}
            empty={
              <div className="card mx-auto max-w-md">
                <EmptyState
                  icon={<Users size={24} />}
                  title="No team members"
                  description="Direct reports will appear here once they are assigned."
                />
              </div>
            }
            columns={[
              { key: 'name', header: 'Employee', cell: (row) => <span className="font-medium">{row.name}</span> },
              {
                key: 'score',
                header: 'Score',
                cell: (row) => (
                  <div className="flex items-center gap-3">
                    <ProgressRing value={row.score > 0 ? Math.round(row.score) : 0} size={38} />
                    <span>{row.score > 0 ? Math.round(row.score) : '—'}</span>
                  </div>
                ),
              },
              { key: 'goals', header: 'Goals', cell: (row) => row.goals },
              { key: 'checkins', header: 'Check-ins', cell: (row) => row.checkins },
              {
                key: 'completion',
                header: 'Completion',
                cell: (row) => {
                  const pct =
                    row.completionPct ??
                    (row.goals > 0 ? clampPct(Math.round((row.checkins / row.goals) * 100)) : 0);
                  return row.goals === 0 ? 'No goals' : `${pct}%`;
                },
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
