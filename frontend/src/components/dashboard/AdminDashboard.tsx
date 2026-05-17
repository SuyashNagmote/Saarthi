'use client';

import { useQuery } from '@tanstack/react-query';
import { getAdminDashboard } from '@/lib/api/dashboard';
import type { AuditActivity, DepartmentHeatmapPoint } from '@/lib/api/dashboard';
import { DistributionDonut, AttritionScatterChart } from '@/components/dashboard/DashboardCharts';
import { formatAuditAction, GOAL_TYPE_LABELS } from '@/lib/utils/labels';
import Link from 'next/link';
import { downloadReport } from '@/lib/api/reports';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, Download, Shield, AlertCircle, Building2, Activity } from 'lucide-react';

export function AdminDashboard() {
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: getAdminDashboard,
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
        <p className="mt-2 text-[14px] text-[var(--color-text-2)]">There was an issue fetching org data.</p>
        <button type="button" className="btn-primary mt-6" onClick={() => refetch()}>
          Try Again
        </button>
      </div>
    );
  }

  const typeData = Object.entries(data.goalTypeDistribution).map(([name, value]) => ({
    name: GOAL_TYPE_LABELS[name] ?? name,
    value: value as number,
  }));

  async function handleExport(format: 'csv' | 'xlsx') {
    setIsExporting(true);
    try {
      await downloadReport(format);
      toast.success('Report downloaded successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to download report');
    } finally {
      setIsExporting(false);
    }
  }

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
      {/* Page Header Actions */}
      <div className="flex justify-end gap-3">
        <button 
          onClick={() => handleExport('csv')} 
          disabled={isExporting}
          className="btn-secondary flex items-center gap-2"
        >
          <Download size={16} />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
        <button 
          onClick={() => handleExport('xlsx')} 
          disabled={isExporting}
          className="btn-primary flex items-center gap-2"
        >
          <Download size={16} />
          {isExporting ? 'Exporting...' : 'Export Excel'}
        </button>
      </div>

      {/* Row 1: KPI Cards */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="kpi-card" style={{ borderTop: 'none', borderLeft: '3px solid var(--color-success)' }}>
          <p className="kpi-label">Org Completion</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="kpi-value text-[var(--color-success)]">{data.summary.orgCompletionPct}</span>
            <span className="text-[13px] font-medium text-[var(--color-text-3)]">%</span>
          </div>
          <p className="kpi-sub mt-1">Company wide</p>
        </div>

        <div className="kpi-card" style={{ borderTop: 'none', borderLeft: '3px solid var(--color-accent)' }}>
          <p className="kpi-label">Active Cycle</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="kpi-value text-[var(--color-accent)] text-[22px]">Annual</span>
          </div>
          <p className="kpi-sub mt-1">{data.summary.activeCycleStatus}</p>
        </div>

        <div className="kpi-card" style={{ borderTop: 'none', borderLeft: '3px solid var(--color-border-2)' }}>
          <p className="kpi-label">Goals Locked</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="kpi-value text-[var(--color-text-1)]">{data.summary.goalsLocked}</span>
          </div>
          <p className="kpi-sub mt-1">Fully approved</p>
        </div>

        <div className="kpi-card" style={{ borderTop: 'none', borderLeft: `3px solid ${data.summary.pendingEscalations > 0 ? 'var(--color-danger)' : 'var(--color-border-2)'}` }}>
          <p className="kpi-label">Escalations</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`kpi-value ${data.summary.pendingEscalations > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-1)]'}`}>
              {data.summary.pendingEscalations}
            </span>
          </div>
          <p className="kpi-sub mt-1">{data.summary.pendingEscalations > 0 ? 'Requires intervention' : 'None active'}</p>
        </div>
      </motion.div>

      {/* Row 2: Attrition Risk Heatmap (AI intelligence) */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card p-6 border-[var(--color-accent)] border-[2px] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Activity size={150} />
        </div>
        <div className="mb-6 flex items-center justify-between relative z-10">
          <div>
            <h3 className="section-title mb-1 flex items-center gap-2 text-[var(--color-accent)]">
              <Activity size={18} /> Attrition Risk Intelligence
            </h3>
            <p className="text-[13px] text-[var(--color-text-2)]">Predictive heatmap based on performance scores and check-in sentiment.</p>
          </div>
        </div>
        <div className="relative z-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2">
          <AttritionScatterChart data={data.attritionHeatmap} />
        </div>
      </motion.div>

      {/* Row 3: Department Heatmap */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="section-title mb-1 flex items-center gap-2"><Building2 size={18} className="text-[var(--color-text-2)]" /> Department Size Overview</h3>
            <p className="text-[13px] text-[var(--color-text-2)]">Distribution of workforce across departments</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.departmentHeatmap.map((dept: DepartmentHeatmapPoint) => (
            <div key={dept.department} className="rounded-xl border border-[var(--color-border)] p-5 bg-[var(--color-surface-2)] transition-colors hover:border-[var(--color-border-2)]">
              <p className="text-[14px] font-semibold text-[var(--color-text-1)]">{dept.department}</p>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="text-[28px] font-bold tracking-tight text-[var(--color-accent)]">{dept.totalEmployees}</span> 
                <span className="text-[13px] font-medium text-[var(--color-text-3)]">staff</span>
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Row 3: Goal Type Distribution & Audit */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card p-6">
          <h3 className="section-title mb-6">Goal Type Distribution</h3>
          <DistributionDonut data={typeData} />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
            <h3 className="section-title mb-0 flex items-center gap-2">
              <Shield size={18} className="text-[var(--color-text-2)]" />
              Recent Audit Activity
            </h3>
            <Link href="/audit" className="flex items-center gap-1 text-[13px] font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-2)]">
              View Trail <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {data.recentAudit.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-[14px] text-[var(--color-text-2)]">No audit activity.</p>
              </div>
            ) : (
              <div className="relative space-y-6 before:absolute before:bottom-0 before:left-[11px] before:top-2 before:w-[2px] before:bg-[var(--color-border)]">
                {data.recentAudit.map((a: AuditActivity) => (
                  <div key={a.id} className="relative flex gap-4 pl-8">
                    <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface)] shadow-[0_0_0_4px_var(--color-surface)]">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-dim)] text-[10px] font-bold text-[var(--color-accent)]">
                        {a.entity.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[var(--color-text-1)]">{formatAuditAction(a.action)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge bg-[var(--color-surface-2)] text-[var(--color-text-2)]">{a.entity}</span>
                        <span className="text-[12px] text-[var(--color-text-3)]">{new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
