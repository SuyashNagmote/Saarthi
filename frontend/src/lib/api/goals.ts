import { apiFetch } from './client';

export interface Goal {
  id: string;
  employee_id?: string;
  title: string;
  thrust_area: string;
  description: string;
  uom_type: string;
  goal_type: string;
  target_value: number;
  weightage: number;
  deadline: string;
  category: string;
  status: string;
  is_locked: boolean;
  is_shared: boolean;
  primary_owner_id?: string | null;
  self_achievement: number | null;
  self_rating: number | null;
  self_notes: string | null;
  computed_score: number | null;
  ai_risk_flag: string | null;
  ai_risk_reason: string | null;
  employee?: { id: string; name: string; email: string; department: string };
  cycle?: { id: string; name: string };
}

export interface WeightageSummary {
  goals: { id: string; title: string; weightage: number; category: string; status: string }[];
  total: number;
  remaining: number;
  strategic: number;
}

export function listGoals(params?: { status?: string; page?: number }) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  const qs = q.toString();
  return apiFetch<{ goals: Goal[] }>(`/goals${qs ? `?${qs}` : ''}`);
}

export function getGoal(id: string) {
  return apiFetch<{ goal: Goal & { approvals?: unknown[]; check_ins?: unknown[] } }>(
    `/goals/${id}`
  );
}

export function getWeightageSummary() {
  return apiFetch<WeightageSummary>('/goals/weightage-summary');
}

export function checkTitle(title: string, excludeId?: string) {
  const q = new URLSearchParams({ title });
  if (excludeId) q.set('exclude_id', excludeId);
  return apiFetch<{ duplicate: boolean }>(`/goals/check-title?${q}`);
}

export function createGoal(body: Record<string, unknown>) {
  return apiFetch<{ goal: Goal }>('/goals', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateGoal(id: string, body: Record<string, unknown>) {
  return apiFetch<{ goal: Goal }>(`/goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteGoal(id: string) {
  return apiFetch<{ deleted: boolean }>(`/goals/${id}`, { method: 'DELETE' });
}

export function submitGoal(id: string) {
  return apiFetch<{ goal: Goal; notification_sent: boolean }>(`/goals/${id}/submit`, {
    method: 'POST',
  });
}

export function bulkSubmitGoals() {
  return apiFetch<{ submitted: number; goals: Goal[] }>('/goals/bulk-submit', {
    method: 'POST',
  });
}

export interface AuditEntry {
  id: string;
  action: string;
  created_at: string;
  diff: Record<string, { from: unknown; to: unknown }>;
  changer: { name: string; email: string; role: string };
}

export function getGoalTimeline(goalId: string) {
  return apiFetch<{ timeline: AuditEntry[] }>(`/audit/Goal/${goalId}`);
}
