import { prisma } from '../../common/db/prisma.js';
import type { AuthUser } from '../../common/types/express.js';
import { getActiveWindow } from '../../common/utils/quarter-windows.js';

export async function getEmployeeDashboard(user: AuthUser) {
  if (user.role !== 'EMPLOYEE' && user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }

  const [goals, checkins, audit] = await Promise.all([
    prisma.goal.findMany({ where: { employee_id: user.id } }),
    prisma.checkIn.findMany({ where: { employee_id: user.id }, orderBy: { created_at: 'desc' } }),
    prisma.auditLog.findMany({ 
      where: { entity_type: 'Goal', changed_by: user.id }, 
      orderBy: { created_at: 'desc' }, 
      take: 5 
    }),
  ]);

  const activeGoals = goals.filter(g => g.status !== 'CYCLE_CLOSED');
  
  let totalWeightedScore = 0;
  for (const g of activeGoals) {
    if (g.computed_score) totalWeightedScore += (g.computed_score * g.weightage) / 100;
  }

  const completedGoals = activeGoals.filter(g => g.status === 'LOCKED' && g.actual_achievement !== null && g.actual_achievement >= g.target_value).length;
  
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = activeGoals.filter(g => new Date(g.deadline) > now && new Date(g.deadline) <= nextWeek).length;

  return {
    scoreCard: {
      totalScore: totalWeightedScore,
      rating: totalWeightedScore >= 90 ? 'Exceeds Expectations' : totalWeightedScore >= 70 ? 'Meets Expectations' : 'Needs Improvement',
      completedGoals,
      upcomingDeadlines,
    },
    goals: activeGoals.map(g => ({
      id: g.id,
      title: g.title,
      target: g.target_value,
      actual: g.actual_achievement ?? 0,
      status: g.status,
      deadline: g.deadline,
    })),
    recentActivity: audit.map(a => ({
      id: a.id,
      action: a.action,
      date: a.created_at,
    })),
  };
}

export async function getManagerDashboard(user: AuthUser) {
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }

  const reports = await prisma.user.findMany({
    where: { manager_id: user.id, is_active: true },
    select: { id: true, name: true, department: true }
  });

  const reportIds = reports.map(r => r.id);

  const [goals, approvals, checkins] = await Promise.all([
    prisma.goal.findMany({ where: { employee_id: { in: reportIds } } }),
    prisma.approval.findMany({ 
      where: { manager_id: user.id, status: 'PENDING' },
      include: { goal: { include: { employee: true } } },
      take: 5,
      orderBy: { created_at: 'asc' }
    }),
    prisma.checkIn.findMany({ where: { employee_id: { in: reportIds } } })
  ]);

  let teamTotalScore = 0;
  let scoredGoalsCount = 0;
  let atRiskGoals = 0;
  const statusDist: Record<string, number> = { ON_TRACK: 0, AT_RISK: 0, MISSED: 0, COMPLETED: 0, NOT_STARTED: 0 };

  const teamHeatmap = reports.map(r => {
    const rGoals = goals.filter(g => g.employee_id === r.id);
    const rCheckins = checkins.filter(c => c.employee_id === r.id);
    let rScore = 0;
    rGoals.forEach(g => {
      if (g.computed_score) {
        rScore += (g.computed_score * g.weightage) / 100;
        scoredGoalsCount++;
        teamTotalScore += (g.computed_score * g.weightage) / 100;
      }
    });

    const goalsWithCheckin = new Set(rCheckins.map((c) => c.goal_id)).size;
    const lockedGoals = rGoals.filter((g) => g.status === 'LOCKED' || g.status === 'APPROVED').length;
    const completionPct =
      rGoals.length > 0
        ? Math.min(100, Math.round((goalsWithCheckin / rGoals.length) * 100))
        : 0;

    rCheckins.forEach(c => {
      if (c.goal_status === 'AT_RISK') atRiskGoals++;
      if (statusDist[c.goal_status] !== undefined) {
        statusDist[c.goal_status] = (statusDist[c.goal_status] ?? 0) + 1;
      }
    });

    return {
      id: r.id,
      name: r.name,
      score: Math.round(rScore),
      checkins: goalsWithCheckin,
      goals: rGoals.length,
      lockedGoals,
      completionPct,
    };
  });

  // Self vs Manager delta — goals with both self and manager ratings
  const selfVsManager = reports
    .map((r) => {
      const rGoals = goals.filter(
        (g) =>
          g.employee_id === r.id &&
          g.self_rating != null &&
          g.final_rating != null
      );
      if (rGoals.length === 0) return null;
      const avgSelf =
        rGoals.reduce((s, g) => s + (g.self_rating ?? 0), 0) / rGoals.length;
      const avgMgr =
        rGoals.reduce((s, g) => s + (g.final_rating ?? 0), 0) / rGoals.length;
      return {
        id: r.id,
        employeeName: r.name,
        selfRating: Math.round(avgSelf * 10) / 10,
        managerRating: Math.round(avgMgr * 10) / 10,
        delta: Math.round((avgSelf - avgMgr) * 10) / 10,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  return {
    summary: {
      teamCompletionPct:
        teamHeatmap.length > 0
          ? Math.round(
              teamHeatmap.reduce((s, h) => s + h.completionPct, 0) / teamHeatmap.length
            )
          : 0,
      pendingApprovals: approvals.length,
      avgTeamScore: scoredGoalsCount > 0 ? (teamTotalScore / teamHeatmap.length) : 0,
      atRiskGoals
    },
    teamHeatmap,
    pendingQueue: approvals.map(a => ({
      id: a.id,
      goalId: a.goal_id,
      employeeName: a.goal.employee.name,
      goalTitle: a.goal.title,
      submittedAt: a.created_at
    })),
    selfVsManager,
    statusDistribution: statusDist
  };
}

export async function getAdminDashboard(user: AuthUser) {
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }

  const [users, goals, checkins, cycles, audit] = await Promise.all([
    prisma.user.findMany({ where: { is_active: true } }),
    prisma.goal.findMany(),
    prisma.checkIn.findMany(),
    prisma.goalCycle.findMany({ where: { is_active: true } }),
    prisma.auditLog.findMany({ orderBy: { created_at: 'desc' }, take: 10 })
  ]);

  const activeCycle = cycles[0];
  const lockedGoals = goals.filter(g => g.is_locked).length;

  const deptMap: Record<string, { total: number, checkins: number }> = {};
  
  // Attrition Risk Heatmap Calculation
  const attritionHeatmap = users.map(u => {
    if (!deptMap[u.department]) deptMap[u.department] = { total: 0, checkins: 0 };
    deptMap[u.department]!.total++;

    const uGoals = goals.filter(g => g.employee_id === u.id);
    const uCheckins = checkins.filter(c => c.employee_id === u.id);
    
    // Performance Score (X-axis)
    let performanceScore = 0;
    let scoredGoalsCount = 0;
    uGoals.forEach(g => {
      if (g.computed_score) {
        performanceScore += (g.computed_score * g.weightage) / 100;
        scoredGoalsCount++;
      }
    });
    performanceScore = scoredGoalsCount > 0 ? Math.round(performanceScore) : 0;

    const riskScore = u.attrition_score ?? 0;
    const riskLevel = u.attrition_risk ?? 'LOW';

    const avgDelta =
      uGoals.filter((g) => g.self_rating != null && g.final_rating != null).length > 0
        ? uGoals
            .filter((g) => g.self_rating != null && g.final_rating != null)
            .reduce((s, g) => s + ((g.self_rating ?? 0) - (g.final_rating ?? 0)), 0) /
          uGoals.filter((g) => g.self_rating != null && g.final_rating != null).length
        : 0;

    const reasons: string[] = [];
    if (avgDelta > 1) reasons.push(`Self-rating ${avgDelta.toFixed(1)} pts above manager for 2+ quarters`);
    if (performanceScore > 0 && performanceScore < 70) reasons.push('Performance below 70 in current cycle');
    const missedCount = uCheckins.filter(
      (c) => c.goal_status === 'MISSED' || c.goal_status === 'AT_RISK'
    ).length;
    if (missedCount > 0) reasons.push(`${missedCount} check-in(s) at risk or missed`);
    if (reasons.length === 0) reasons.push('Stable performance');

    return {
      id: u.id,
      name: u.name,
      department: u.department,
      designation: u.designation,
      performanceScore: Math.round(performanceScore),
      riskScore: Math.round(riskScore),
      riskLevel,
      riskReason: reasons.join(' + ')
    };
  });

  // Goal type dist
  const typeDist: Record<string, number> = {};
  goals.forEach(g => {
    typeDist[g.goal_type] = (typeDist[g.goal_type] || 0) + 1;
  });

  return {
    summary: {
      orgCompletionPct: 85, // Mocked
      activeCycleStatus: activeCycle?.name ?? 'No Active Cycle',
      goalsLocked: lockedGoals,
      pendingEscalations: attritionHeatmap.filter(a => a.riskLevel === 'CRITICAL').length
    },
    departmentHeatmap: Object.entries(deptMap).map(([dept, data]) => ({
      department: dept,
      totalEmployees: data.total
    })),
    goalTypeDistribution: typeDist,
    attritionHeatmap, // Added for UI scatter plot
    recentAudit: audit.map(a => ({
      id: a.id,
      action: a.action,
      entity: a.entity_type,
      date: a.created_at
    }))
  };
}
