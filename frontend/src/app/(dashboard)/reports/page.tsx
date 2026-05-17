'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { TopBar } from '@/components/layout/TopBar';
import { DataTable } from '@/components/common/DataTable';
import { SkeletonList } from '@/components/common/SkeletonBlock';
import { listCycles } from '@/lib/api/cycles';
import { downloadAuditReport, downloadReport, fetchReportPreview } from '@/lib/api/reports';
import { useAuthStore } from '@/lib/stores/auth.store';
import { GOAL_STATUS_LABELS, formatScoreDisplay, toLabel } from '@/lib/utils/labels';
import { FileBarChart, Download } from 'lucide-react';

const EXPORT_HINTS: Record<string, string> = {
  csv: 'All goals, scores, and status for the selected cycle',
  xlsx: 'Same data with formatted tables and pivot-ready sheets',
  audit: 'All goal change logs with timestamps and actors',
};

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const [cycleId, setCycleId] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);
  const [recentExports, setRecentExports] = useState<{ name: string; at: string }[]>([]);

  const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
    queryKey: ['cycles'],
    queryFn: listCycles,
  });

  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['report-preview', cycleId],
    queryFn: () => fetchReportPreview(cycleId || undefined),
    enabled: isAdmin,
  });

  const cycles = cyclesData?.cycles ?? [];
  const preview = previewData?.preview ?? [];

  async function handleExport(format: 'csv' | 'xlsx') {
    if (!isAdmin) {
      toast.error('Contact your admin to request export access.');
      return;
    }
    setExporting(format);
    try {
      await downloadReport(format, cycleId || undefined);
      toast.success('Export complete — download started.');
      setRecentExports((prev) => [
        { name: `Organization ${format.toUpperCase()}`, at: new Date().toLocaleString() },
        ...prev.slice(0, 4),
      ]);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  }

  async function handleAuditExport() {
    if (!isAdmin) {
      toast.error('Only administrators can export audit logs.');
      return;
    }
    setExporting('audit');
    try {
      await downloadAuditReport();
      toast.success('Audit export complete — download started.');
      setRecentExports((prev) => [
        { name: 'Audit CSV', at: new Date().toLocaleString() },
        ...prev.slice(0, 4),
      ]);
    } catch {
      toast.error('Audit export failed.');
    } finally {
      setExporting(null);
    }
  }

  return (
    <>
      <TopBar title="Reports" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="kpi-card">
            <p className="kpi-label">Performance cycles</p>
            <p className="kpi-value">{cycles.length}</p>
            <p className="kpi-sub">Available for export</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Export formats</p>
            <p className="kpi-value text-[22px]">CSV · XLSX</p>
            <p className="kpi-sub">Audit report included</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Access level</p>
            <p className="kpi-value text-[22px]">{isAdmin ? 'Full access' : 'View only'}</p>
            <p className="kpi-sub">{isAdmin ? 'All exports enabled' : 'Contact your admin'}</p>
          </div>
        </div>

        <section className="card p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileBarChart size={20} className="text-[var(--color-accent)]" />
              <div>
                <h2 className="section-title mb-0">Organization export</h2>
                <p className="text-[13px] text-[var(--color-text-2)]">Planned target vs. actual achievement</p>
              </div>
            </div>
            <div>
              <label className="label mb-1 block" htmlFor="cycle-select">Cycle</label>
              <select
                id="cycle-select"
                className="input min-w-[220px]"
                value={cycleId}
                onChange={(e) => setCycleId(e.target.value)}
                disabled={cyclesLoading}
              >
                <option value="">All active data</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ExportAction
              label="Export CSV"
              hint={EXPORT_HINTS.csv!}
              disabled={!isAdmin || exporting !== null}
              loading={exporting === 'csv'}
              onClick={() => handleExport('csv')}
            />
            <ExportAction
              label="Export Excel"
              hint={EXPORT_HINTS.xlsx!}
              disabled={!isAdmin || exporting !== null}
              loading={exporting === 'xlsx'}
              primary
              onClick={() => handleExport('xlsx')}
            />
            <ExportAction
              label="Audit CSV"
              hint={EXPORT_HINTS.audit!}
              disabled={!isAdmin || exporting !== null}
              loading={exporting === 'audit'}
              onClick={handleAuditExport}
            />
          </div>
        </section>

        {isAdmin && (
          <section className="card p-6">
            <h2 className="section-title">Export preview</h2>
            <p className="mb-4 text-[13px] text-[var(--color-text-2)]">Sample rows from the selected export</p>
            {previewLoading ? (
              <SkeletonList count={3} height="h-12" />
            ) : (
              <DataTable
                data={preview}
                getRowKey={(row) => `${row.employee}-${row.goal}`}
                empty={
                  <p className="py-8 text-center text-[14px] text-[var(--color-text-2)]">No goals match this cycle.</p>
                }
                columns={[
                  { key: 'employee', header: 'Employee', cell: (r) => <span className="font-medium">{r.employee}</span> },
                  { key: 'goal', header: 'Goal', cell: (r) => r.goal },
                  { key: 'target', header: 'Target', cell: (r) => String(r.target) },
                  { key: 'actual', header: 'Actual', cell: (r) => (r.actual != null ? String(r.actual) : '—') },
                  { key: 'score', header: 'Score', cell: (r) => formatScoreDisplay(r.score) },
                  { key: 'status', header: 'Status', cell: (r) => GOAL_STATUS_LABELS[r.status] ?? toLabel(r.status) },
                ]}
              />
            )}
          </section>
        )}

        {recentExports.length > 0 && (
          <section className="card p-6">
            <h2 className="section-title">Recent exports</h2>
            <ul className="divide-y divide-[var(--color-border)]">
              {recentExports.map((ex, i) => (
                <li key={i} className="flex justify-between py-3 text-[14px]">
                  <span className="font-medium">{ex.name}</span>
                  <span className="text-[var(--color-text-2)]">{ex.at}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function ExportAction({
  label,
  hint,
  disabled,
  loading,
  primary,
  onClick,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  loading: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className={primary ? 'btn-primary inline-flex items-center gap-2' : 'btn-ghost inline-flex items-center gap-2'}
        disabled={disabled}
        title={hint}
        onClick={onClick}
      >
        <Download size={16} />
        {loading ? 'Exporting…' : label}
      </button>
      <span className="max-w-[200px] text-[11px] text-[var(--color-text-3)]">{hint}</span>
    </div>
  );
}