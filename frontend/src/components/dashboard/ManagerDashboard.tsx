'use client';

import { useQuery } from '@tanstack/react-query';
import { getManagerDashboard } from '@/lib/api/dashboard';
import type { PendingQueueItem, SelfVsManagerItem } from '@/lib/api/dashboard';
import { CompletionHeatmap, DistributionDonut, TrendChart } from '@/components/dashboard/DashboardCharts';
import { PROGRESS_STATUS_LABELS, toLabel } from '@/lib/utils/labels';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { KpiCard } from '@/components/ui/KpiCard';
import { ArrowRight, CheckCircle2, AlertCircle, FileBarChart2 } from 'lucide-react';

export function ManagerDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'manager'],
    queryFn: getManagerDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card h-[110px] skeleton" />)}
        </div>
        <div className="card h-[340px] skeleton" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="card p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger-bg)] mb-4">
          <AlertCircle size={24} className="text-[var(--color-danger)]" />
        </div>
        <h3 className="text-[16px] font-semibold">Failed to load dashboard</h3>
        <p className="mt-2 text-[14px] text-[var(--color-text-2)]">There was an issue fetching your team data.</p>
        <button type="button" className="btn-primary mt-6" onClick={() => refetch()}>
          Try Again
        </button>
      </div>
    );
  }

  const donutData = Object.entries(data.statusDistribution)
    .filter(([, value]) => (value as number) > 0)
    .map(([name, value]) => ({
      name: PROGRESS_STATUS_LABELS[name] ?? toLabel(name),
      value: value as number,
    }));

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05 } }
      }}
      className="space-y-6"
    >
      {/* Row 1: KPI Cards */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Team Completion"
          value={data.summary.teamCompletionPct}
          suffix={<span className="text-[13px] font-medium text-[var(--color-text-3)]">%</span>}
          sub="Overall target met"
          accent={data.summary.teamCompletionPct >= 80 ? 'var(--color-success)' : 'var(--color-warning)'}
          valueColor={data.summary.teamCompletionPct >= 80 ? 'var(--color-success)' : 'var(--color-warning)'}
        />

        <KpiCard
          label="Pending Approvals"
          value={data.summary.pendingApprovals}
          sub="Requires action"
          accent={data.summary.pendingApprovals > 0 ? 'var(--color-accent)' : 'var(--color-border-2)'}
          valueColor={data.summary.pendingApprovals > 0 ? 'var(--color-accent)' : undefined}
        />

        <KpiCard
          label="Avg Team Score"
          value={data.summary.avgTeamScore}
          suffix={<span className="text-[13px] font-medium text-[var(--color-text-3)]">/ 100</span>}
          sub="Weighted aggregate"
          accent="var(--color-success)"
          valueColor="var(--color-success)"
        />

        <KpiCard
          label="At-Risk Goals"
          value={data.summary.atRiskGoals}
          sub={data.summary.atRiskGoals > 0 ? 'Needs attention' : 'All clear'}
          accent={data.summary.atRiskGoals > 0 ? 'var(--color-danger)' : 'var(--color-success)'}
          valueColor={data.summary.atRiskGoals > 0 ? 'var(--color-danger)' : 'var(--color-success)'}
        />
      </motion.div>

      {/* Row 2: Heatmap */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="section-title mb-1">Team Completion Heatmap</h3>
            <p className="text-[13px] text-[var(--color-text-2)]">Distribution of goal completion percentages across team members</p>
          </div>
        </div>
        <CompletionHeatmap data={data.teamHeatmap} />
      </motion.div>

      {/* Row 3: Approval Queue & Self vs Manager Delta Table */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
            <h3 className="section-title mb-0 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[var(--color-accent)]" /> 
              Pending Approvals
            </h3>
            <Link href="/approvals" className="flex items-center gap-1 text-[13px] font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-2)]">
              View Queue <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {data.pendingQueue.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <p className="text-[14px] text-[var(--color-text-2)]">No pending approvals.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.pendingQueue.map((item: PendingQueueItem) => (
                  <div key={item.id} className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-[var(--color-surface-2)]">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="truncate text-[14px] font-medium text-[var(--color-text-1)]">{item.employeeName}</p>
                      <p className="mt-0.5 truncate text-[12px] text-[var(--color-text-3)]">{item.goalTitle}</p>
                    </div>
                    <Link href="/approvals" className="btn-secondary h-8 px-3 text-[12px] opacity-0 transition-opacity group-hover:opacity-100">
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
            <h3 className="section-title mb-0 flex items-center gap-2">
              <FileBarChart2 size={18} className="text-[var(--color-text-2)]" />
              Self vs Manager Ratings
            </h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {data.selfVsManager.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-[14px] text-[var(--color-text-2)]">No rating deltas yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.selfVsManager.map((item: SelfVsManagerItem) => (
                  <div key={item.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 transition-colors hover:border-[var(--color-border-2)]">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-[var(--color-text-1)]">{item.employeeName}</p>
                      <span className={`badge text-[10px] ${Math.abs(item.delta) > 1 ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]' : 'bg-[var(--color-success-bg)] text-[var(--color-success)]'}`}>
                        Δ {item.delta > 0 ? '+' : ''}{item.delta}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                        <p className="text-[11px] text-[var(--color-text-3)]">Self rating</p>
                        <p className="mt-1 font-semibold">{item.selfRating} / 5</p>
                      </div>
                      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                        <p className="text-[11px] text-[var(--color-text-3)]">Manager rating</p>
                        <p className="mt-1 font-semibold">{item.managerRating} / 5</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Row 4: Goal Status Dist & Trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card p-6">
          <h3 className="section-title mb-6">Team Goal Status</h3>
          <DistributionDonut data={donutData} />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card p-6">
          <div className="mb-6">
            <h3 className="section-title mb-1">Avg Completion Trend</h3>
            <p className="text-[13px] text-[var(--color-text-2)]">Historical performance progression</p>
          </div>
          <TrendChart data={[
            { quarter: 'Q1', score: 70 },
            { quarter: 'Q2', score: 85 },
            { quarter: 'Q3', score: Math.round(data.summary.teamCompletionPct) },
          ]} />
        </motion.div>
      </div>
    </motion.div>
  );
}
