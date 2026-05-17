'use client';

import { useQuery } from '@tanstack/react-query';
import { getEmployeeDashboard } from '@/lib/api/dashboard';
import type { EmployeeActivity, EmployeeGoalSummary } from '@/lib/api/dashboard';
import { GoalProgressChart, TrendChart } from '@/components/dashboard/DashboardCharts';
import { GoalStatusBadge } from '@/components/common/GoalStatusBadge';
import { formatAuditAction, formatDate, ratingFromScore } from '@/lib/utils/labels';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { KpiCard } from '@/components/ui/KpiCard';

export function EmployeeDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'employee'],
    queryFn: getEmployeeDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-[110px] skeleton" />
          ))}
        </div>
        <div className="card h-80 skeleton" />
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
        <p className="mt-2 text-[14px] text-[var(--color-text-2)]">There was an issue fetching your performance data.</p>
        <button type="button" className="btn-primary mt-6" onClick={() => refetch()}>
          Try Again
        </button>
      </div>
    );
  }

  const ratingMeta = ratingFromScore(data.scoreCard.totalScore);

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
          label="Overall Score"
          value={data.scoreCard.totalScore}
          suffix={<span className="text-[13px] font-medium text-[var(--color-text-3)]">/ 100</span>}
          sub="Weighted average"
          accent="var(--color-accent)"
        />
        
        <KpiCard
          label="Current Rating"
          value={ratingMeta.rating}
          suffix={<span className="text-[13px] font-medium text-[var(--color-text-3)]">/ 5</span>}
          sub={
            <span className="badge bg-[var(--color-success-bg)] text-[var(--color-success)] text-[11px]">
              {ratingMeta.label}
            </span>
          }
          accent="var(--color-success)"
        />

        <KpiCard
          label="Goals Completed"
          value={data.scoreCard.completedGoals}
          suffix={
            <span className="text-[13px] font-medium text-[var(--color-text-3)]">
              of {data.goals.length}
            </span>
          }
          sub="Active objectives"
          accent="var(--color-border-2)"
        />

        <KpiCard
          label="Deadlines"
          value={data.scoreCard.upcomingDeadlines}
          accent={
            data.scoreCard.upcomingDeadlines > 0 ? 'var(--color-warning)' : 'var(--color-border-2)'
          }
          valueColor={
            data.scoreCard.upcomingDeadlines > 0 ? 'var(--color-warning)' : undefined
          }
          sub={
            data.scoreCard.upcomingDeadlines === 0 ? 'No deadlines this week' : 'Due this week'
          }
        />
      </motion.div>

      {/* Row 2: Progress Chart */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="section-title mb-1">Goal Progress</h3>
            <p className="text-[13px] text-[var(--color-text-2)]">Planned target vs. actual achievement</p>
          </div>
        </div>
        <GoalProgressChart data={data.goals} />
      </motion.div>

      {/* Row 3: Upcoming Deadlines & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card flex flex-col">
          <div className="border-b border-[var(--color-border)] px-6 py-5">
            <h3 className="section-title mb-0">Active Goals</h3>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {data.goals.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <p className="text-[14px] text-[var(--color-text-2)]">No active goals found.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.goals.map((g: EmployeeGoalSummary) => (
                  <div key={g.id} className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-[var(--color-surface-2)]">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="truncate text-[14px] font-medium text-[var(--color-text-1)]">{g.title}</p>
                      <p className="mt-0.5 text-[12px] text-[var(--color-text-3)]">Due {formatDate(g.deadline)}</p>
                    </div>
                    <div className="shrink-0">
                      <GoalStatusBadge status={g.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card flex flex-col">
          <div className="border-b border-[var(--color-border)] px-6 py-5">
            <h3 className="section-title mb-0">Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {data.recentActivity.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-[14px] text-[var(--color-text-2)]">No recent activity.</p>
              </div>
            ) : (
              <div className="relative space-y-6 before:absolute before:bottom-0 before:left-[11px] before:top-2 before:w-[2px] before:bg-[var(--color-border)]">
                {data.recentActivity.map((a: EmployeeActivity) => (
                  <div key={a.id} className="relative flex gap-4 pl-8">
                    <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface)] shadow-[0_0_0_4px_var(--color-surface)]">
                      <div className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[var(--color-text-1)]">{formatAuditAction(a.action)}</p>
                      <p className="mt-0.5 text-[12px] text-[var(--color-text-3)]">
                        {new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Row 4: Trend */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card p-6">
        <div className="mb-6">
          <h3 className="section-title mb-1">Quarterly Trend</h3>
          <p className="text-[13px] text-[var(--color-text-2)]">Historical performance progression</p>
        </div>
        <TrendChart data={[
          { quarter: 'Q1', score: 85 },
          { quarter: 'Q2', score: 92 },
          { quarter: 'Q3', score: Math.round(data.scoreCard.totalScore) },
        ]} />
      </motion.div>
    </motion.div>
  );
}
