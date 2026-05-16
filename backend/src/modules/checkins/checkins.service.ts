import type { Prisma, Quarter } from '@prisma/client';
import { prisma } from '../../common/db/prisma.js';
import { auditLog } from '../../common/services/audit.service.js';
import type { AuthUser } from '../../common/types/express.js';
import { getActiveWindow } from '../../common/utils/quarter-windows.js';
import { calculateScore, mapScoreToRating } from '../../common/utils/score-calculator.js';
import { recalculateGoalScore } from '../../common/services/scoring.service.js';
import { GoalValidationError } from '../goals/goals.validation.js';
import type { z } from 'zod';
import type {
  createCheckInSchema,
  updateCheckInSchema,
  managerCommentSchema,
} from './checkins.dto.js';

type CreateInput = z.infer<typeof createCheckInSchema>;
type UpdateInput = z.infer<typeof updateCheckInSchema>;
type CommentInput = z.infer<typeof managerCommentSchema>;

/* ── helpers ── */

function assertWindowOpen() {
  const window = getActiveWindow();
  if (!window.isOpen) {
    throw new GoalValidationError(
      'WINDOW_CLOSED',
      `Check-in window is closed. Next window opens in ${window.nextOpenLabel ?? 'the next quarter'}.`
    );
  }
  return window;
}

function mapWindowToQuarter(windowName: string): Quarter | null {
  const map: Record<string, Quarter> = {
    Q1_CHECKIN: 'Q1',
    Q2_CHECKIN: 'Q2',
    Q3_CHECKIN: 'Q3',
    Q4_FINAL: 'Q4',
  };
  return map[windowName] ?? null;
}

/* ── List check-ins — Employee own; Manager team ── */

export async function listCheckIns(
  user: AuthUser,
  query: { goal_id?: string; quarter?: string; page: number; limit: number }
) {
  const where: Prisma.CheckInWhereInput = {};

  if (user.role === 'EMPLOYEE') {
    where.employee_id = user.id;
  } else if (user.role === 'MANAGER') {
    where.employee = { OR: [{ manager_id: user.id }, { id: user.id }] };
  }
  // ADMIN sees all

  if (query.goal_id) where.goal_id = query.goal_id;
  if (query.quarter) where.quarter = query.quarter as Quarter;

  const [checkins, total] = await Promise.all([
    prisma.checkIn.findMany({
      where,
      include: {
        goal: { select: { id: true, title: true, target_value: true, goal_type: true, deadline: true, weightage: true, status: true } },
        employee: { select: { id: true, name: true, email: true, department: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.checkIn.count({ where }),
  ]);

  return { checkins, pagination: { page: query.page, limit: query.limit, total } };
}

/* ── Create check-in — window must be open ── */

export async function createCheckIn(
  user: AuthUser,
  input: CreateInput,
  ip: string,
  userAgent: string
) {
  if (user.role !== 'EMPLOYEE') {
    throw new Error('FORBIDDEN');
  }

  const activeWindow = assertWindowOpen();

  // Validate goal belongs to employee and is approved/locked
  const goal = await prisma.goal.findUnique({ where: { id: input.goal_id } });
  if (!goal) throw new Error('NOT_FOUND');
  if (goal.employee_id !== user.id) throw new Error('FORBIDDEN');
  if (!['APPROVED', 'LOCKED'].includes(goal.status)) {
    throw new GoalValidationError(
      'INVALID_STATUS',
      `Cannot submit check-in for a goal in status ${goal.status}. Goal must be approved.`
    );
  }

  // Prevent duplicate check-in for same goal+quarter
  const existing = await prisma.checkIn.findFirst({
    where: { goal_id: input.goal_id, quarter: input.quarter, employee_id: user.id },
  });
  if (existing) {
    throw new GoalValidationError(
      'DUPLICATE_CHECKIN',
      `Check-in for ${input.quarter} already exists for this goal. Use update instead.`
    );
  }

  const checkin = await prisma.checkIn.create({
    data: {
      goal_id: input.goal_id,
      employee_id: user.id,
      quarter: input.quarter,
      actual_achievement: input.actual_achievement,
      progress_notes: input.progress_notes,
      goal_status: input.goal_status,
    },
  });

  // Compute score inline (dev mode — no Bull queue per §6.3)
  const computed = calculateScore(goal, input.actual_achievement);
  const weighted = (computed * goal.weightage) / 100;
  const { rating, label } = mapScoreToRating(computed);

  await prisma.goal.update({
    where: { id: goal.id },
    data: {
      actual_achievement: input.actual_achievement,
    },
  });

  await recalculateGoalScore(goal.id);

  // Cascade to shared goals
  let parentId = null;
  if (goal.parent_goal_id) parentId = goal.parent_goal_id;
  else if (goal.is_shared) parentId = goal.id;

  if (parentId) {
    const linkedGoals = await prisma.goal.findMany({
      where: {
        OR: [{ id: parentId }, { parent_goal_id: parentId }],
        NOT: { id: goal.id }
      }
    });

    for (const lg of linkedGoals) {
      await prisma.goal.update({
        where: { id: lg.id },
        data: { actual_achievement: input.actual_achievement }
      });
      await recalculateGoalScore(lg.id);
      await auditLog({
        entity_type: 'Goal',
        entity_id: lg.id,
        action: 'CASCADED_ACHIEVEMENT',
        changed_by: 'system/cascade',
        old_value: { actual_achievement: lg.actual_achievement },
        new_value: { actual_achievement: input.actual_achievement },
        diff: { actual_achievement: { from: lg.actual_achievement, to: input.actual_achievement } },
        ip_address: ip,
        user_agent: userAgent,
      });
    }
  }

  await auditLog({
    entity_type: 'CheckIn',
    entity_id: checkin.id,
    action: 'CHECKIN_CREATED',
    changed_by: user.id,
    old_value: {},
    new_value: { quarter: input.quarter, actual_achievement: input.actual_achievement, goal_status: input.goal_status },
    diff: { actual_achievement: { from: null, to: input.actual_achievement } },
    ip_address: ip,
    user_agent: userAgent,
  });

  // Return projected score per §5 response spec
  return {
    checkin,
    projected_score: Math.round(computed * 100) / 100,
    projected_rating: { rating, label },
  };
}

/* ── Update check-in — window must be open ── */

export async function updateCheckIn(
  user: AuthUser,
  id: string,
  input: UpdateInput,
  ip: string,
  userAgent: string
) {
  assertWindowOpen();

  const checkin = await prisma.checkIn.findUnique({
    where: { id },
    include: { goal: true },
  });
  if (!checkin) throw new Error('NOT_FOUND');
  if (checkin.employee_id !== user.id) throw new Error('FORBIDDEN');

  const updated = await prisma.checkIn.update({
    where: { id },
    data: {
      ...(input.actual_achievement !== undefined && { actual_achievement: input.actual_achievement }),
      ...(input.progress_notes !== undefined && { progress_notes: input.progress_notes }),
      ...(input.goal_status !== undefined && { goal_status: input.goal_status }),
    },
  });

  // Recompute score if achievement changed
  if (input.actual_achievement !== undefined) {
    await prisma.goal.update({
      where: { id: checkin.goal_id },
      data: {
        actual_achievement: input.actual_achievement,
      },
    });
    await recalculateGoalScore(checkin.goal_id);

    // Cascade to shared goals
    let parentId = null;
    if (checkin.goal.parent_goal_id) parentId = checkin.goal.parent_goal_id;
    else if (checkin.goal.is_shared) parentId = checkin.goal.id;

    if (parentId) {
      const linkedGoals = await prisma.goal.findMany({
        where: {
          OR: [{ id: parentId }, { parent_goal_id: parentId }],
          NOT: { id: checkin.goal.id }
        }
      });

      for (const lg of linkedGoals) {
        await prisma.goal.update({
          where: { id: lg.id },
          data: { actual_achievement: input.actual_achievement }
        });
        await recalculateGoalScore(lg.id);
        await auditLog({
          entity_type: 'Goal',
          entity_id: lg.id,
          action: 'CASCADED_ACHIEVEMENT',
          changed_by: 'system/cascade',
          old_value: { actual_achievement: lg.actual_achievement },
          new_value: { actual_achievement: input.actual_achievement },
          diff: { actual_achievement: { from: lg.actual_achievement, to: input.actual_achievement } },
          ip_address: ip,
          user_agent: userAgent,
        });
      }
    }
  }

  await auditLog({
    entity_type: 'CheckIn',
    entity_id: id,
    action: 'CHECKIN_UPDATED',
    changed_by: user.id,
    old_value: { actual_achievement: checkin.actual_achievement },
    new_value: { actual_achievement: updated.actual_achievement },
    diff: input.actual_achievement !== undefined
      ? { actual_achievement: { from: checkin.actual_achievement, to: input.actual_achievement } }
      : {},
    ip_address: ip,
    user_agent: userAgent,
  });

  return updated;
}

/* ── Manager comment + recommendation ── */

export async function addManagerComment(
  user: AuthUser,
  id: string,
  input: CommentInput,
  ip: string,
  userAgent: string
) {
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }

  const checkin = await prisma.checkIn.findUnique({ where: { id } });
  if (!checkin) throw new Error('NOT_FOUND');

  // Verify manager of the employee
  if (user.role === 'MANAGER') {
    const emp = await prisma.user.findFirst({
      where: { id: checkin.employee_id, manager_id: user.id },
    });
    if (!emp) throw new Error('FORBIDDEN');
  }

  const updated = await prisma.checkIn.update({
    where: { id },
    data: {
      manager_comment: input.manager_comment,
      recommendation: input.recommendation,
      reviewed_by: user.id,
      reviewed_at: new Date(),
    },
  });

  await auditLog({
    entity_type: 'CheckIn',
    entity_id: id,
    action: 'MANAGER_COMMENT',
    changed_by: user.id,
    old_value: { manager_comment: checkin.manager_comment },
    new_value: { manager_comment: input.manager_comment },
    diff: { manager_comment: { from: checkin.manager_comment, to: input.manager_comment } },
    ip_address: ip,
    user_agent: userAgent,
  });

  return updated;
}

/* ── Window status — per §6.4 ── */

export function getWindowStatus() {
  const w = getActiveWindow();
  return {
    isOpen: w.isOpen,
    windowType: w.window,
    nextOpen: w.nextOpen?.toISOString() ?? null,
    nextOpenLabel: w.nextOpenLabel,
  };
}

/* ── Completion status — Manager: who has/hasn't submitted ── */

export async function getCompletionStatus(user: AuthUser) {
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }

  const reports = await prisma.user.findMany({
    where: user.role === 'ADMIN' ? { is_active: true, role: 'EMPLOYEE' } : { manager_id: user.id, is_active: true },
    select: { id: true, name: true, email: true, department: true },
  });

  const w = getActiveWindow();
  const quarter = w.window ? mapWindowToQuarter(w.window) : null;

  const result = await Promise.all(
    reports.map(async (emp) => {
      const goals = await prisma.goal.count({
        where: { employee_id: emp.id, status: { in: ['APPROVED', 'LOCKED'] } },
      });
      const checkins = quarter
        ? await prisma.checkIn.count({
            where: { employee_id: emp.id, quarter },
          })
        : 0;
      return { ...emp, total_goals: goals, checkins_submitted: checkins, quarter };
    })
  );

  return { employees: result, current_quarter: quarter };
}
