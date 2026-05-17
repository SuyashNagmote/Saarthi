'use client';

import { useQuery } from '@tanstack/react-query';
import { TopBar } from '@/components/layout/TopBar';
import { DataTable } from '@/components/common/DataTable';
import { listCycles, type GoalCycle } from '@/lib/api/cycles';
import { CalendarDays } from 'lucide-react';
import { CYCLE_STATUS_LABELS, toLabel } from '@/lib/utils/labels';
import { SkeletonList } from '@/components/common/SkeletonBlock';

// Safe date formatter — never shows "Invalid Date"
function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not set';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Not set';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export default function AdminCyclesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cycles'],
    queryFn: listCycles,
  });
  const cycles = data?.cycles ?? [];

  return (
    <>
      <TopBar title="Admin Cycles" />
      <div className="space-y-6 p-6">
        <div className="flex justify-end">
          <button type="button" className="btn-primary" disabled title="Cycle management is configured via seed for this demo">
            New cycle
          </button>
        </div>
        <div className="kpi-card max-w-sm">
          <p className="kpi-label">Performance Cycles</p>
          <p className="kpi-value">{cycles.length}</p>
          <p className="kpi-sub">Active performance cycles</p>
        </div>

        {isLoading && <SkeletonList count={4} height="h-14" />}

        {isError && (
          <div className="card p-10 text-center">
            <p className="text-[14px] text-[var(--color-danger)]">Failed to load cycles.</p>
            <button type="button" className="btn-primary mt-4" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <DataTable<GoalCycle>
            data={cycles}
            getRowKey={(row) => row.id}
            empty={
              <div className="card mx-auto max-w-md p-8 text-center">
                <CalendarDays className="mx-auto mb-3 text-[var(--color-text-3)]" size={28} />
                <p className="font-medium">No cycles configured</p>
              </div>
            }
            columns={[
              { key: 'name', header: 'Name', cell: (row) => <span className="font-medium">{row.name}</span> },
              { key: 'quarter', header: 'Quarter', cell: (row) => row.quarter },
              { key: 'window', header: 'Cycle Window', cell: (row) => `${formatDate(row.start_date)} - ${formatDate(row.end_date)}` },
              { key: 'submission', header: 'Submission', cell: (row) => `${formatDate(row.goal_submission_start)} - ${formatDate(row.goal_submission_end)}` },
              { key: 'status', header: 'Status', cell: (row) => CYCLE_STATUS_LABELS[row.status] ?? toLabel(row.status) },
              { key: 'active', header: 'Active', cell: (row) => (row.is_active ? 'Yes' : 'No') },
              {
                key: 'actions',
                header: 'Actions',
                cell: () => (
                  <div className="flex gap-2">
                    <button type="button" className="btn-ghost h-8 px-2 text-[12px]" disabled>Edit</button>
                    <button type="button" className="btn-ghost h-8 px-2 text-[12px]" disabled>Deactivate</button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
