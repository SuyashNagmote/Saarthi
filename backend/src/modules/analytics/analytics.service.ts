import { prisma } from '../../common/db/prisma.js';
import type { AuthUser } from '../../common/types/express.js';

function getScopeFilter(user: AuthUser) {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'MANAGER') return { employee: { OR: [{ manager_id: user.id }, { id: user.id }] } };
  return { employee_id: user.id };
}

export async function getQoqTrend(user: AuthUser) {
  const scope = getScopeFilter(user);
  
  const checkins = await prisma.checkIn.groupBy({
    by: ['quarter'],
    _avg: { actual_achievement: true },
    where: scope,
    orderBy: { quarter: 'asc' }
  });

  return checkins.map(c => ({
    quarter: c.quarter,
    average_achievement: c._avg.actual_achievement || 0
  }));
}

export async function getHeatmap(user: AuthUser) {
  const scope = getScopeFilter(user);

  const goals = await prisma.goal.findMany({
    where: scope,
    include: {
      employee: { select: { department: true, manager_id: true } },
      cycle: { select: { name: true } }
    }
  });

  const departmentStats: Record<string, { total: number; completed: number }> = {};

  for (const g of goals) {
    const dept = g.employee.department || 'Unknown';
    if (!departmentStats[dept]) departmentStats[dept] = { total: 0, completed: 0 };
    departmentStats[dept].total++;
    // Use actual_achievement or status to determine "completion"
    if (g.status === 'CYCLE_CLOSED' || g.actual_achievement && g.actual_achievement >= g.target_value) {
      departmentStats[dept].completed++;
    }
  }

  return Object.keys(departmentStats).map(dept => {
    const stat = departmentStats[dept];
    return {
      department: dept,
      completion_rate: stat && stat.total > 0 
        ? (stat.completed / stat.total) * 100 
        : 0
    };
  });
}

export async function getDistribution(user: AuthUser) {
  const scope = getScopeFilter(user);

  const goals = await prisma.goal.findMany({ where: scope });

  const thrustArea: Record<string, number> = {};
  const uomType: Record<string, number> = {};
  const status: Record<string, number> = {};

  for (const g of goals) {
    thrustArea[g.thrust_area] = (thrustArea[g.thrust_area] || 0) + 1;
    uomType[g.uom_type] = (uomType[g.uom_type] || 0) + 1;
    status[g.status] = (status[g.status] || 0) + 1;
  }

  const UOM_LABELS: Record<string, string> = {
    NUMERIC: 'Number-based',
    PERCENTAGE: 'Percentage-based',
    TIMELINE: 'Timeline-based',
    ZERO_BASED: 'Zero-based',
  };

  return {
    thrust_area: Object.entries(thrustArea).map(([name, count]) => ({ name, count })),
    uom_type: Object.entries(uomType).map(([name, count]) => ({
      name: UOM_LABELS[name] ?? name,
      count,
    })),
    status: Object.entries(status).map(([name, count]) => ({ name, count })),
  };
}
