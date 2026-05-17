import { apiDownload, apiFetch } from './client';

export interface ReportPreviewRow {
  employee: string;
  department: string;
  goal: string;
  target: number;
  actual: number | null;
  score: number | null;
  weightage: number;
  status: string;
  cycle: string;
  quarter: string;
}

export async function fetchReportPreview(cycleId?: string) {
  const q = cycleId ? `?cycle_id=${cycleId}` : '';
  return apiFetch<{ preview: ReportPreviewRow[] }>(`/reports/preview${q}`);
}

export async function downloadReport(format: 'csv' | 'xlsx', cycleId?: string, department?: string) {
  const q = new URLSearchParams();
  q.set('format', format);
  if (cycleId) q.set('cycle_id', cycleId);
  if (department) q.set('department', department);

  const qs = q.toString();
  const blob = await apiDownload(`/reports/export?${qs}`);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `saarthi-export-${Date.now()}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadAuditReport() {
  const blob = await apiDownload('/reports/audit-export');
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `saarthi-audit-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
