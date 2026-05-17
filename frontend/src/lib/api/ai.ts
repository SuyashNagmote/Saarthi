import { apiFetch } from './client';

export interface GenerateGoalRequest {
  title: string;
  department: string;
  designation: string;
  cycle_name: string;
  existing_goals: { title: string; weightage: number; }[];
}

export interface GenerateGoalResponse {
  description: string;
  uom_type: string;
  goal_type: string;
  target_value: number;
  target_display: string;
  weightage_suggestion: number;
  thrust_area: string;
  category: 'Strategic' | 'Operational' | 'Development';
  rationale: string;
}

export async function generateGoalAI(data: GenerateGoalRequest) {
  return apiFetch<GenerateGoalResponse>('/ai/generate-goal', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface ParseCheckinRequest {
  nl_input: string;
  goal: {
    title: string;
    target_value: number;
    uom_type: string;
    goal_type: string;
    deadline: string;
  };
}

export interface ParseCheckinResponse {
  actual_achievement: number | null;
  achievement_display: string;
  goal_status: 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'COMPLETED' | 'MISSED';
  self_rating: number | null;
  progress_notes: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export async function parseCheckinAI(data: ParseCheckinRequest) {
  return apiFetch<ParseCheckinResponse>('/ai/parse-checkin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
