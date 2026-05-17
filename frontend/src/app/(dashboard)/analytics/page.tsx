'use client';

import { useQuery } from '@tanstack/react-query';
import { TopBar } from '@/components/layout/TopBar';
import { DataTable } from '@/components/common/DataTable';
import { DistributionDonut, TrendChart } from '@/components/dashboard/DashboardCharts';
import { AlertCircle } from 'lucide-react';
import { getAnalyticsHeatmap, getAnalyticsDistribution, getAnalyticsQoq } from '@/lib/api/analytics';

export default function AnalyticsPage() {
  const { data: heatmapData, isLoading: isLoadingHeatmap } = useQuery({ queryKey: ['analytics', 'heatmap'], queryFn: getAnalyticsHeatmap });
  const { data: distData, isLoading: isLoadingDist, isError, refetch } = useQuery({ queryKey: ['analytics', 'distribution'], queryFn: getAnalyticsDistribution });
  const { data: qoqData, isLoading: isLoadingQoq } = useQuery({ queryKey: ['analytics', 'qoq'], queryFn: getAnalyticsQoq });

  const isLoading = isLoadingHeatmap || isLoadingDist || isLoadingQoq;

  const typeData = (distData?.uom_type || []).map((d: { name: string; count: number }) => ({
    name: d.name,
    value: d.count,
  }));

  const heatmapRows = heatmapData || [];

  return (
    <>
      <TopBar title="Analytics" />
      <div className="space-y-6 p-6">
        {isLoading && (
          <>
            <div className="card h-80 skeleton" />
            <div className="card h-72 skeleton" />
          </>
        )}

        {isError && (
          <div className="card p-10 text-center">
            <AlertCircle className="mx-auto mb-3 text-[var(--color-danger)]" size={28} />
            <p className="text-[14px] text-[var(--color-text-2)]">Failed to load analytics.</p>
            <button type="button" className="btn-primary mt-4" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
              <section className="card p-6">
                <h2 className="section-title">Department Completion Rate</h2>
                <div className="mt-4">
                  {heatmapRows.map((row: { department: string; completion_rate: number }) => (
                    <div key={row.department} className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{row.department}</span>
                        <span>{Math.round(row.completion_rate)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[var(--color-surface-2)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-accent)]"
                          style={{
                            width: `${Math.max(row.completion_rate, row.completion_rate === 0 ? 2 : 0)}%`,
                            opacity: row.completion_rate === 0 ? 0.35 : 1,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="card p-6">
                <h2 className="section-title">Goal Distribution</h2>
                <DistributionDonut data={typeData} />
              </section>
            </div>

            <section className="card p-6">
              <h2 className="section-title mb-4">Quarter-on-Quarter Trend</h2>
              <TrendChart
                data={(qoqData || []).map((row) => ({
                  quarter: row.quarter,
                  score: Math.round(row.average_achievement),
                }))}
              />
            </section>
          </>
        )}
      </div>
    </>
  );
}
