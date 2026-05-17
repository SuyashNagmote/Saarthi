import { apiFetch } from './client';

export interface EmployeeGoalSummary {
  id: string;
  title: string;
  target: number;
  actual: number;
  status: string;
  deadline: string;
}

export interface EmployeeActivity {
  id: string;
  action: string;
  date: string;
}

export interface EmployeeDashboardData {
  scoreCard: {
    totalScore: number;
    rating: string;
    completedGoals: number;
    upcomingDeadlines: number;
  };
  goals: EmployeeGoalSummary[];
  recentActivity: EmployeeActivity[];
}

export interface TeamHeatmapPoint {
  id: string;
  name: string;
  score: number;
  checkins: number;
  goals: number;
  completionPct?: number;
}

export interface PendingQueueItem {
  id: string;
  goalId: string;
  employeeName: string;
  goalTitle: string;
  submittedAt: string;
}

export interface SelfVsManagerItem {
  id: string;
  employeeName: string;
  selfRating: number;
  managerRating: number;
  delta: number;
}

export interface ManagerDashboardData {
  summary: {
    teamCompletionPct: number;
    pendingApprovals: number;
    avgTeamScore: number;
    atRiskGoals: number;
  };
  teamHeatmap: TeamHeatmapPoint[];
  pendingQueue: PendingQueueItem[];
  selfVsManager: SelfVsManagerItem[];
  statusDistribution: Record<string, number>;
}

export interface AttritionRiskPoint {
  id: string;
  name: string;
  department: string;
  designation: string;
  performanceScore: number;
  riskScore: number;
  riskLevel: string;
  riskReason: string;
}

export interface DepartmentHeatmapPoint {
  department: string;
  totalEmployees: number;
}

export interface AuditActivity {
  id: string;
  action: string;
  entity: string;
  date: string;
}

export interface AdminDashboardData {
  summary: {
    orgCompletionPct: number;
    activeCycleStatus: string;
    goalsLocked: number;
    pendingEscalations: number;
  };
  departmentHeatmap: DepartmentHeatmapPoint[];
  goalTypeDistribution: Record<string, number>;
  attritionHeatmap: AttritionRiskPoint[];
  recentAudit: AuditActivity[];
}

export function getEmployeeDashboard() {
  return apiFetch<EmployeeDashboardData>('/dashboard/employee');
}

export function getManagerDashboard() {
  return apiFetch<ManagerDashboardData>('/dashboard/manager');
}

export function getAdminDashboard() {
  return apiFetch<AdminDashboardData>('/dashboard/admin');
}
