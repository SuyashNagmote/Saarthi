'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, Fragment } from 'react';
import { toast } from 'sonner';
import { TopBar } from '@/components/layout/TopBar';
import { listAuditLogs, type AuditLog } from '@/lib/api/audit';
import { useAuthStore } from '@/lib/stores/auth.store';
import { downloadAuditReport } from '@/lib/api/reports';
import { formatAuditAction, formatDate, formatIpAddress } from '@/lib/utils/labels';

const AUDIT_ACTIONS = [
  '',
  'LOGIN',
  'CREATED',
  'UPDATED',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'REWORK_REQUESTED',
  'MANAGER_EDITED',
  'LOCKED',
  'DELETED',
  'PASSWORD_CHANGED',
  'CYCLE_ACTIVATED',
];

export default function AuditPage() {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['auditLogs', page, entityType, action],
    queryFn: () => listAuditLogs({ page, limit: 15, entity_type: entityType, action }),
    enabled: user?.role === 'ADMIN',
  });

  if (user?.role !== 'ADMIN') {
    return (
      <>
        <TopBar title="Audit Logs" />
        <div className="p-6 text-center text-[var(--color-danger)]">Access Denied</div>
      </>
    );
  }

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <TopBar title="Audit Logs" />
      <div className="flex-1 overflow-auto p-6 flex flex-col h-[calc(100vh-64px)]">
        
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-4">
          <select
            className="input max-w-[200px]"
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          >
            <option value="">All Entities</option>
            <option value="Goal">Goal</option>
            <option value="Approval">Approval</option>
            <option value="CheckIn">CheckIn</option>
            <option value="User">User</option>
            <option value="GoalCycle">GoalCycle</option>
          </select>

          <select
            className="input max-w-[200px]"
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
          >
            {AUDIT_ACTIONS.map((a) => (
              <option key={a || 'all'} value={a}>{a ? formatAuditAction(a) : 'All Actions'}</option>
            ))}
          </select>
          <div className="flex-1" />
          <button
            onClick={async () => {
              setIsExporting(true);
              try { await downloadAuditReport(); }
              catch { toast.error('Failed to export'); }
              finally { setIsExporting(false); }
            }}
            disabled={isExporting}
            className="btn-primary h-10 px-4 text-[13px]"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {/* Table Area */}
        <div className="card overflow-hidden flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-[var(--color-surface-2)] z-10 border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-2)]">Timestamp</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-2)]">Changed By</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-2)]">Action</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-2)]">Entity</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-2)]">IP Address</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-2)] text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)]">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-[var(--color-surface-2)]" />
                      </td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--color-danger)]">
                      Failed to load logs. <button onClick={() => refetch()} className="underline">Retry</button>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--color-text-3)]">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log: AuditLog) => (
                    <Fragment key={log.id}>
                      <tr 
                        className="border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)] cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(log.created_at)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{log.changer.name}</p>
                          <p className="text-[11px] text-[var(--color-text-3)]">{log.changer.role}</p>
                        </td>
                        <td className="px-4 py-3 font-medium">{formatAuditAction(log.action)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-[var(--color-accent-dim)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-accent)]">
                            {log.entity_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-2)]">{formatIpAddress(log.ip_address)}</td>
                        <td className="px-4 py-3 text-right text-[18px] text-[var(--color-text-3)]">
                          {expandedRow === log.id ? '▾' : '▸'}
                        </td>
                      </tr>
                      {expandedRow === log.id && (
                        <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                          <td colSpan={6} className="p-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)] mb-2">Entity ID</p>
                                <p className="font-mono text-[11px]">{log.entity_id}</p>
                                
                                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)] mt-4 mb-2">User Agent</p>
                                <p className="font-mono text-[11px] text-[var(--color-text-2)]">{log.user_agent}</p>
                              </div>
                              <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-3)] mb-2">Changes (Diff)</p>
                                {isAuditDiff(log.diff) && Object.keys(log.diff).length > 0 ? (
                                  <div className="rounded bg-[var(--color-canvas)] p-3 font-mono text-[11px] border border-[var(--color-border)]">
                                    {Object.entries(log.diff).map(([key, val]) => (
                                      <div key={key} className="mb-2 last:mb-0">
                                        <div className="text-[var(--color-text-2)] mb-0.5">{key}:</div>
                                        <div className="text-[var(--color-danger)] ml-2">- {JSON.stringify(val.from)}</div>
                                        <div className="text-[var(--color-success)] ml-2">+ {JSON.stringify(val.to)}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[12px] text-[var(--color-text-3)]">No tracked differences.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
              <span className="text-[13px] text-[var(--color-text-2)]">
                Showing {(page - 1) * pagination.limit + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} entries
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-[var(--color-border)] px-3 py-1 text-[13px] disabled:opacity-50 hover:bg-[var(--color-surface-2)]"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="rounded border border-[var(--color-border)] px-3 py-1 text-[13px] disabled:opacity-50 hover:bg-[var(--color-surface-2)]"
                  disabled={page * pagination.limit >= pagination.total}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function isAuditDiff(value: unknown): value is Record<string, { from: unknown; to: unknown }> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
