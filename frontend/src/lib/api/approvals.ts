import { apiFetch } from './client';
import type { Goal } from './goals';

export interface ApprovalRecord {
  id: string;
  goal_id: string;
  manager_id: string;
  status: string;
  comments: string | null;
  edited_target: number | null;
  edited_weightage: number | null;
  version: number;
  created_at: string;
  updated_at: string;
  goal: Goal & {
    employee?: { id: string; name: string; email: string; department: string };
    cycle?: { id: string; name: string };
  };
  manager?: { id: string; name: string };
}

export function listPendingApprovals(params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return apiFetch<{
    approvals: ApprovalRecord[];
    pagination: { page: number; limit: number; total: number };
  }>(`/approvals${qs ? `?${qs}` : ''}`);
}

export function listApprovalHistory(params?: { page?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  const qs = q.toString();
  return apiFetch<{
    approvals: ApprovalRecord[];
    pagination: { page: number; limit: number; total: number };
  }>(`/approvals/history${qs ? `?${qs}` : ''}`);
}

export function getPendingCount() {
  return apiFetch<{ count: number }>('/approvals/pending-count');
}

export function approveGoal(goalId: string, data: { comments?: string; version: number }) {
  return apiFetch<{ goal: Goal }>(`/approvals/${goalId}/approve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function rejectGoal(goalId: string, data: { comments: string; version: number }) {
  return apiFetch<{ goal: Goal }>(`/approvals/${goalId}/reject`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function requestRework(goalId: string, data: { comments: string; version: number }) {
  return apiFetch<{ goal: Goal }>(`/approvals/${goalId}/request-rework`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function editApproval(
  goalId: string,
  data: { edited_target?: number; edited_weightage?: number; version: number }
) {
  return apiFetch<{ goal: Goal }>(`/approvals/${goalId}/edit`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function bulkApproveGoals(data: {
  goal_ids: string[];
  comment?: string;
  confirmed: true;
}) {
  return apiFetch<{ approved: number; failed: { goal_id: string; reason: string }[]; locked: string[] }>(
    '/approvals/bulk-approve',
    { method: 'POST', body: JSON.stringify(data) }
  );
}
