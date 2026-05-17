'use client';

import { TopBar } from '@/components/layout/TopBar';
import { DataTable } from '@/components/common/DataTable';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { useAdminDashboard } from '@/lib/hooks/useDashboard';
import { AlertCircle, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

interface UserRiskRow {
  id: string;
  name: string;
  department: string;
  designation: string;
  performanceScore: number;
  riskLevel: string;
  riskReason: string;
}

export default function AdminUsersPage() {
  const { data, isLoading, isError, refetch } = useAdminDashboard();
  const rows = (data?.attritionHeatmap ?? []) as UserRiskRow[];
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const departments = useMemo(
    () => [...new Set(rows.map((r) => r.department))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = !deptFilter || r.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [rows, search, deptFilter]);

  return (
    <>
      <TopBar title="People & Risk" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="kpi-card">
            <p className="kpi-label">Total People</p>
            <p className="kpi-value">{rows.length}</p>
            <p className="kpi-sub">Across all departments</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Departments</p>
            <p className="kpi-value">{data?.departmentHeatmap?.length ?? 0}</p>
            <p className="kpi-sub">Active reporting units</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Critical Risk</p>
            <p className="kpi-value text-[var(--color-danger)]">
              {rows.filter((row) => row.riskLevel === 'CRITICAL').length}
            </p>
            <p className="kpi-sub">Needs immediate attention</p>
          </div>
        </div>

        {isLoading && <div className="card h-80 skeleton" />}

        {isError && (
          <div className="card p-10 text-center">
            <AlertCircle className="mx-auto mb-3 text-[var(--color-danger)]" size={28} />
            <p className="text-[14px] text-[var(--color-text-2)]">Failed to load users.</p>
            <button type="button" className="btn-primary mt-4" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
          <div className="flex flex-wrap gap-3">
            <input
              className="input max-w-xs"
              placeholder="Search by name or department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input max-w-[200px]" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <DataTable
            data={filtered}
            getRowKey={(row) => row.id}
            empty={
              <div className="card mx-auto max-w-md">
                <div className="p-8 text-center">
                  <Users className="mx-auto mb-3 text-[var(--color-text-3)]" size={28} />
                  <p className="font-medium">No users found</p>
                </div>
              </div>
            }
            columns={[
              { key: 'name', header: 'Name', cell: (row) => <span className="font-medium">{row.name}</span> },
              { key: 'department', header: 'Department', cell: (row) => row.department },
              { key: 'designation', header: 'Designation', cell: (row) => row.designation },
              { key: 'score', header: 'Performance', cell: (row) => <ScoreBadge score={row.performanceScore} /> },
              {
                key: 'risk',
                header: 'Risk',
                cell: (row) => {
                  const level =
                    row.performanceScore > 0 && row.performanceScore < 70 && row.riskLevel === 'LOW'
                      ? row.performanceScore < 60
                        ? 'HIGH'
                        : 'MEDIUM'
                      : row.riskLevel;
                  const color =
                    level === 'CRITICAL' || level === 'HIGH'
                      ? 'var(--color-danger)'
                      : level === 'MEDIUM'
                        ? 'var(--color-warning)'
                        : 'var(--color-success)';
                  return (
                    <span className="badge" style={{ color, background: `${color}22` }}>
                      {level}
                    </span>
                  );
                },
              },
              { key: 'reason', header: 'Reason', cell: (row) => row.riskReason },
            ]}
          />
          </>
        )}
      </div>
    </>
  );
}
