import { apiFetch } from './client';

export interface CheckIn {
  id: string;
  goal_id: string;
  employee_id: string;
  quarter: string;
  actual_achievement: number;
  progress_notes: string | null;
  goal_status: string;
  manager_comment: string | null;
  recommendation: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  goal?: {
    id: string;
    title: string;
    target_value: number;
    goal_type: string;
    deadline: string;
    weightage: number;
    status: string;
  };
  employee?: { id: string; name: string; email: string; department: string };
}

export interface WindowStatus {
  isOpen: boolean;
  windowType: string | null;
  nextOpen: string | null;
  nextOpenLabel: string | null;
}

export function listCheckIns(params?: { goal_id?: string; quarter?: string; page?: number }) {
  const q = new URLSearchParams();
  if (params?.goal_id) q.set('goal_id', params.goal_id);
  if (params?.quarter) q.set('quarter', params.quarter);
  if (params?.page) q.set('page', String(params.page));
  const qs = q.toString();
  return apiFetch<{ checkins: CheckIn[] }>(`/checkins${qs ? `?${qs}` : ''}`);
}

export function createCheckIn(data: {
  goal_id: string;
  quarter: string;
  actual_achievement: number;
  progress_notes?: string;
  goal_status: string;
}) {
  return apiFetch<{
    checkin: CheckIn;
    projected_score: number;
    projected_rating: { rating: number; label: string };
  }>('/checkins', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCheckIn(id: string, data: Record<string, unknown>) {
  return apiFetch<{ checkin: CheckIn }>(`/checkins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function addManagerComment(id: string, data: { manager_comment: string; recommendation?: string }) {
  return apiFetch<{ checkin: CheckIn }>(`/checkins/${id}/comment`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getWindowStatus() {
  return apiFetch<WindowStatus>('/checkins/window-status');
}

export function getCompletionStatus() {
  return apiFetch<{
    employees: { id: string; name: string; email: string; department: string; total_goals: number; checkins_submitted: number; quarter: string | null }[];
    current_quarter: string | null;
  }>('/checkins/completion-status');
}
