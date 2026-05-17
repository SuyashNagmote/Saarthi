import { apiFetch } from './client';

export async function getAnalyticsQoq() {
  return apiFetch<{ quarter: string; average_achievement: number }[]>('/analytics/qoq');
}

export async function getAnalyticsHeatmap() {
  return apiFetch<{ department: string; completion_rate: number }[]>('/analytics/heatmap');
}

export async function getAnalyticsDistribution() {
  return apiFetch<{
    thrust_area: { name: string; count: number }[];
    uom_type: { name: string; count: number }[];
    status: { name: string; count: number }[];
  }>('/analytics/distribution');
}
