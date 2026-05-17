import { apiFetch } from './client';

export interface GoalCycle {
  id: string;
  name: string;
  quarter: string;
  start_date: string;
  end_date: string;
  goal_submission_start: string;
  goal_submission_end: string;
  self_rating_start: string;
  self_rating_end: string;
  manager_rating_start: string;
  manager_rating_end: string;
  is_active: boolean;
  status: string;
}

export function listCycles() {
  return apiFetch<{ cycles: GoalCycle[] }>('/cycles');
}

export function getActiveCycle() {
  return apiFetch<{ cycle: GoalCycle | null }>('/cycles/active');
}
