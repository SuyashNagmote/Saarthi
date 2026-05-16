import type { Goal, GoalStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../../common/db/prisma.js';
import { auditLog } from '../../common/services/audit.service.js';
import type { AuthUser } from '../../common/types/express.js';
import { assertTransition, EDITABLE_STATUSES } from './goal-status.machine.js';
import {
  GoalValidationError,
  validateDeadlineInCycle,
  validateGoalCount,
  validateSelfRatingForSubmit,
  validateSheetForSubmit,
  validateWeightagePerGoal,
} from './goals.validation.js';
import type { createGoalSchema, updateGoalSchema } from './goals.dto.js';
import type { z } from 'zod';
import { sendTeamsApprovalCard } from '../approvals/teams.service.js';
import { getActiveWindow } from '../../common/utils/quarter-windows.js';

type CreateInput = z.infer<typeof createGoalSchema>;
type UpdateInput = z.infer<typeof updateGoalSchema>;

async function getActiveCycle() {
  const cycle = await prisma.goalCycle.findFirst({ where: { is_active: true } });
  if (!cycle) throw new Error('NO_ACTIVE_CYCLE');
  if (cycle.end_date < new Date()) throw new Error('CYCLE_ENDED');
  return cycle;
}

async function getEmployeeManagerId(employeeId: string) {
  const user = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { manager_id: true },
  });
  return user?.manager_id ?? null;
}

function goalScopeWhere(user: AuthUser): Prisma.GoalWhereInput {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'MANAGER') {
    return {
      employee: {
        OR: [{ manager_id: user.id }, { id: user.id }],
      },
    };
  }
  return { employee_id: user.id };
}

async function assertGoalAccess(user: AuthUser, goal: Goal) {
  if (user.role === 'ADMIN') return;
  if (user.role === 'EMPLOYEE' && goal.employee_id !== user.id) {
    throw new Error('FORBIDDEN');
  }
  if (user.role === 'MANAGER') {
    const emp = await prisma.user.findFirst({
      where: { id: goal.employee_id, manager_id: user.id },
    });
    if (!emp && goal.employee_id !== user.id) throw new Error('FORBIDDEN');
  }
}

async function logGoalAudit(
  goalId: string,
  action: string,
  userId: string,
  oldVal: object,
  newVal: object,
  diff: object,
  ip: string,
  userAgent: string
) {
  await auditLog({
    entity_type: 'Goal',
    entity_id: goalId,
    action,
    changed_by: userId,
    old_value: oldVal,
    new_value: newVal,
    diff,
    ip_address: ip,
    user_agent: userAgent,
  });
}

export async function listGoals(
  user: AuthUser,
  query: {
    status?: string;
    cycle_id?: string;
    employee_id?: string;
    page: number;
    limit: number;
  }
) {
  const where: Prisma.GoalWhereInput = {
    ...goalScopeWhere(user),
    ...(query.status ? { status: query.status as GoalStatus } : {}),
    ...(query.cycle_id ? { cycle_id: query.cycle_id } : {}),
  };

  if (query.employee_id) {
    if (user.role === 'EMPLOYEE' && query.employee_id !== user.id) {
      throw new Error('FORBIDDEN');
    }
    if (user.role === 'MANAGER') {
      const ok = await prisma.user.findFirst({
        where: { id: query.employee_id, manager_id: user.id },
      });
      if (!ok && query.employee_id !== user.id) throw new Error('FORBIDDEN');
    }
    where.employee_id = query.employee_id;
  }

  const [goals, total] = await Promise.all([
    prisma.goal.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, email: true, department: true } },
        cycle: { select: { id: true, name: true } },
      },
      orderBy: { updated_at: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.goal.count({ where }),
  ]);

  return { goals, pagination: { page: query.page, limit: query.limit, total } };
}

export async function getGoalById(user: AuthUser, id: string) {
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, name: true, email: true, department: true } },
      cycle: true,
      approvals: { orderBy: { created_at: 'desc' }, take: 5 },
      check_ins: { orderBy: { created_at: 'desc' }, take: 10 },
    },
  });
  if (!goal) throw new Error('NOT_FOUND');
  await assertGoalAccess(user, goal);
  return goal;
}

export async function checkDuplicateTitle(
  user: AuthUser,
  title: string,
  excludeId?: string
) {
  const cycle = await getActiveCycle();
  const existing = await prisma.goal.findFirst({
    where: {
      employee_id: user.id,
      cycle_id: cycle.id,
      title: { equals: title },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  return { duplicate: !!existing };
}

export async function createGoal(
  user: AuthUser,
  input: CreateInput,
  ip: string,
  userAgent: string
) {
  if (user.role !== 'EMPLOYEE') {
    throw new Error('FORBIDDEN');
  }
  const employeeId = user.id;
  const cycle = await getActiveCycle();

  const count = await prisma.goal.count({
    where: { employee_id: employeeId, cycle_id: cycle.id },
  });
  validateGoalCount(count);

  const duplicate = await prisma.goal.findFirst({
    where: {
      employee_id: employeeId,
      cycle_id: cycle.id,
      title: { equals: input.title },
    },
  });
  if (duplicate) {
    throw new GoalValidationError(
      'DUPLICATE_TITLE',
      `A goal titled '${input.title}' already exists in this cycle.`
    );
  }

  validateWeightagePerGoal(input.weightage, input.title);
  const deadline = new Date(input.deadline);
  validateDeadlineInCycle(deadline, cycle.end_date, cycle.name);

  const goal = await prisma.goal.create({
    data: {
      employee_id: employeeId,
      cycle_id: cycle.id,
      thrust_area: input.thrust_area,
      title: input.title,
      description: input.description,
      uom_type: input.uom_type,
      goal_type: input.goal_type,
      target_value: input.target_value,
      weightage: input.weightage,
      deadline,
      category: input.category,
      self_achievement: input.self_achievement,
      self_rating: input.self_rating,
      self_notes: input.self_notes,
      status: 'DRAFT',
    },
  });

  await logGoalAudit(
    goal.id,
    'CREATED',
    user.id,
    {},
    { title: goal.title, status: goal.status },
    { title: { from: null, to: goal.title } },
    ip,
    userAgent
  );

  return goal;
}

export async function updateGoal(
  user: AuthUser,
  id: string,
  input: UpdateInput,
  ip: string,
  userAgent: string
) {
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) throw new Error('NOT_FOUND');
  if (goal.employee_id !== user.id) throw new Error('FORBIDDEN');
  if (goal.is_locked) {
    throw new GoalValidationError('LOCKED', 'Goal is locked after approval.');
  }

  let status = goal.status;
  if (status === 'REWORK_REQUESTED') {
    assertTransition(status, 'DRAFT');
    status = 'DRAFT';
  } else if (!EDITABLE_STATUSES.includes(status) && status !== 'DRAFT') {
    throw new GoalValidationError(
      'NOT_EDITABLE',
      `Cannot edit goal in status ${status}.`
    );
  }

  const cycle = await prisma.goalCycle.findUnique({ where: { id: goal.cycle_id } });
  if (!cycle) throw new Error('NO_ACTIVE_CYCLE');

  if (input.title && input.title !== goal.title) {
    const dup = await prisma.goal.findFirst({
      where: {
        employee_id: user.id,
        cycle_id: goal.cycle_id,
        title: { equals: input.title },
        NOT: { id },
      },
    });
    if (dup) {
      throw new GoalValidationError(
        'DUPLICATE_TITLE',
        `A goal titled '${input.title}' already exists in this cycle.`
      );
    }
  }

  const weightage = input.weightage ?? goal.weightage;
  validateWeightagePerGoal(weightage, input.title ?? goal.title);

  const deadline = input.deadline ? new Date(input.deadline) : goal.deadline;
  validateDeadlineInCycle(deadline, cycle.end_date);

  if (goal.is_shared && goal.primary_owner_id !== user.id) {
    if (input.title !== undefined && input.title !== goal.title) {
      throw new GoalValidationError('FORBIDDEN', 'Cannot edit title of a shared goal.');
    }
    if (input.target_value !== undefined && input.target_value !== goal.target_value) {
      throw new GoalValidationError('FORBIDDEN', 'Cannot edit target of a shared goal.');
    }
  }

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      ...(input.thrust_area !== undefined && { thrust_area: input.thrust_area }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.uom_type !== undefined && { uom_type: input.uom_type }),
      ...(input.goal_type !== undefined && { goal_type: input.goal_type }),
      ...(input.target_value !== undefined && { target_value: input.target_value }),
      ...(input.weightage !== undefined && { weightage: input.weightage }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.self_achievement !== undefined && {
        self_achievement: input.self_achievement,
      }),
      ...(input.self_rating !== undefined && { self_rating: input.self_rating }),
      ...(input.self_notes !== undefined && { self_notes: input.self_notes }),
      deadline,
      status,
    },
  });

  // Cascade updates to shared child goals per §6.6
  if (goal.is_shared) {
    await prisma.goal.updateMany({
      where: { parent_goal_id: goal.id },
      data: {
        ...(input.target_value !== undefined && { target_value: input.target_value }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.uom_type !== undefined && { uom_type: input.uom_type }),
      },
    });
  }

  const diff: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(input) as (keyof UpdateInput)[]) {
    const val = input[key];
    if (val !== undefined && String(goal[key as keyof Goal]) !== String(val)) {
      diff[key] = { from: goal[key as keyof Goal], to: val };
    }
  }
  if (status !== goal.status) {
    diff.status = { from: goal.status, to: status };
  }

  await logGoalAudit(
    id,
    'UPDATED',
    user.id,
    { status: goal.status },
    { status: updated.status },
    diff,
    ip,
    userAgent
  );

  return updated;
}

export async function deleteGoal(
  user: AuthUser,
  id: string,
  ip: string,
  userAgent: string
) {
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) throw new Error('NOT_FOUND');
  if (goal.employee_id !== user.id) throw new Error('FORBIDDEN');
  if (goal.status !== 'DRAFT') {
    throw new GoalValidationError('NOT_DELETABLE', 'Only draft goals can be deleted.');
  }

  await prisma.goal.delete({ where: { id } });
  await logGoalAudit(
    id,
    'DELETED',
    user.id,
    { title: goal.title },
    {},
    { deleted: { from: false, to: true } },
    ip,
    userAgent
  );
}

async function transitionToPendingApproval(
  goal: Goal,
  userId: string,
  ip: string,
  userAgent: string
) {
  assertTransition(goal.status, 'SUBMITTED');
  let updated = await prisma.goal.update({
    where: { id: goal.id },
    data: { status: 'SUBMITTED' },
  });
  assertTransition('SUBMITTED', 'PENDING_APPROVAL');
  updated = await prisma.goal.update({
    where: { id: goal.id },
    data: { status: 'PENDING_APPROVAL' },
  });

  const managerId = await getEmployeeManagerId(goal.employee_id);
  if (managerId) {
    const existing = await prisma.approval.findFirst({
      where: { goal_id: goal.id, manager_id: managerId },
      orderBy: { created_at: 'desc' },
    });
    if (existing?.status === 'REWORK_REQUESTED' || existing?.status === 'PENDING') {
      await prisma.approval.update({
        where: { id: existing.id },
        data: { status: 'PENDING', version: existing.version + 1 },
      });
    } else {
      await prisma.approval.create({
        data: {
          goal_id: goal.id,
          manager_id: managerId,
          status: 'PENDING',
        },
      });
    }

    await prisma.notification.create({
      data: {
        user_id: managerId,
        type: 'GOAL_SUBMITTED',
        title: 'Goals submitted for review',
        message: `New goal "${goal.title}" submitted for your approval.`,
        action_url: '/approvals',
      },
    });

    // Post to MS Teams Webhook
    sendTeamsApprovalCard(goal.id, managerId).catch(console.error);
  }

  await logGoalAudit(
    goal.id,
    'SUBMITTED',
    userId,
    { status: goal.status },
    { status: 'PENDING_APPROVAL' },
    { status: { from: goal.status, to: 'PENDING_APPROVAL' } },
    ip,
    userAgent
  );

  return updated;
}

export async function submitGoal(
  user: AuthUser,
  id: string,
  ip: string,
  userAgent: string
) {
  const activeWindow = getActiveWindow();
  if (!activeWindow.isOpen || activeWindow.window !== 'GOAL_SETTING') {
    throw new GoalValidationError(
      'WINDOW_CLOSED',
      activeWindow.nextOpenLabel
        ? `Goal submission opens ${activeWindow.nextOpenLabel}.`
        : 'Goal submission window is closed.'
    );
  }

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) throw new Error('NOT_FOUND');
  if (goal.employee_id !== user.id) throw new Error('FORBIDDEN');
  if (goal.status !== 'DRAFT') {
    throw new GoalValidationError(
      'INVALID_STATUS',
      'Only draft goals can be submitted.'
    );
  }

  const cycle = await prisma.goalCycle.findUnique({ where: { id: goal.cycle_id } });
  if (!cycle || cycle.end_date < new Date()) {
    throw new GoalValidationError(
      'CYCLE_ENDED',
      `Active cycle ended on ${cycle?.end_date.toLocaleDateString() ?? 'unknown'}.`
    );
  }

  validateSelfRatingForSubmit(goal);

  const allGoals = await prisma.goal.findMany({
    where: {
      employee_id: user.id,
      cycle_id: goal.cycle_id,
      status: { not: 'CYCLE_CLOSED' },
    },
  });
  validateSheetForSubmit(allGoals);

  const updated = await transitionToPendingApproval(goal, user.id, ip, userAgent);
  return { goal: updated, notification_sent: true };
}

export async function bulkSubmitGoals(
  user: AuthUser,
  ip: string,
  userAgent: string
) {
  const activeWindow = getActiveWindow();
  if (!activeWindow.isOpen || activeWindow.window !== 'GOAL_SETTING') {
    throw new GoalValidationError(
      'WINDOW_CLOSED',
      activeWindow.nextOpenLabel
        ? `Goal submission opens ${activeWindow.nextOpenLabel}.`
        : 'Goal submission window is closed.'
    );
  }

  const cycle = await getActiveCycle();
  const drafts = await prisma.goal.findMany({
    where: {
      employee_id: user.id,
      cycle_id: cycle.id,
      status: 'DRAFT',
    },
  });

  if (drafts.length === 0) {
    throw new GoalValidationError('NO_DRAFTS', 'No draft goals to submit.');
  }

  const allGoals = await prisma.goal.findMany({
    where: {
      employee_id: user.id,
      cycle_id: cycle.id,
      status: { notIn: ['CYCLE_CLOSED'] },
    },
  });
  validateSheetForSubmit(allGoals);

  for (const g of drafts) {
    validateSelfRatingForSubmit(g);
  }

  const results = [];
  for (const g of drafts) {
    const updated = await transitionToPendingApproval(g, user.id, ip, userAgent);
    results.push(updated);
  }

  return { submitted: results.length, goals: results };
}

export async function getWeightageSummary(user: AuthUser, cycleId?: string) {
  const cycle =
    cycleId != null
      ? await prisma.goalCycle.findUnique({ where: { id: cycleId } })
      : await getActiveCycle();
  if (!cycle) throw new Error('NO_ACTIVE_CYCLE');

  const goals = await prisma.goal.findMany({
    where: {
      employee_id: user.id,
      cycle_id: cycle.id,
      status: { not: 'CYCLE_CLOSED' },
    },
    select: { id: true, title: true, weightage: true, category: true, status: true },
  });

  const total = goals.reduce((s, g) => s + g.weightage, 0);
  const remaining = 100 - total;
  const strategic = goals
    .filter((g) => g.category === 'Strategic')
    .reduce((s, g) => s + g.weightage, 0);

  return { goals, total, remaining, strategic };
}

export async function unlockGoal(user: AuthUser, id: string, reason: string, ip: string, userAgent: string) {
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) throw new Error('NOT_FOUND');
  if (!goal.is_locked || goal.status !== 'LOCKED') {
    throw new Error('Only locked goals can be unlocked');
  }

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      status: 'APPROVED',
      is_locked: false,
      lock_reason: reason
    }
  });

  await auditLog({
    entity_type: 'Goal',
    entity_id: id,
    action: 'UNLOCKED',
    changed_by: user.id,
    old_value: { status: 'LOCKED', is_locked: true },
    new_value: { status: 'APPROVED', is_locked: false, lock_reason: reason },
    diff: {
      status: { from: 'LOCKED', to: 'APPROVED' },
      is_locked: { from: true, to: false },
      lock_reason: { from: null, to: reason }
    },
    ip_address: ip,
    user_agent: userAgent
  });

  return { goal: updated };
}

export async function pushSharedGoal(
  user: AuthUser,
  goalId: string,
  ip: string,
  userAgent: string
) {
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.employee_id !== user.id) throw new Error('NOT_FOUND');

  // Find all direct reports
  const team = await prisma.user.findMany({
    where: { manager_id: user.id },
  });

  if (team.length === 0) return { pushed: 0 };

  // Mark parent as shared
  await prisma.goal.update({
    where: { id: goal.id },
    data: { is_shared: true, primary_owner_id: goal.employee_id },
  });

  let pushed = 0;
  for (const report of team) {
    // Check if child goal already exists
    const existing = await prisma.goal.findFirst({
      where: { employee_id: report.id, parent_goal_id: goal.id },
    });
    if (!existing) {
      await prisma.goal.create({
        data: {
          employee_id: report.id,
          cycle_id: goal.cycle_id,
          parent_goal_id: goal.id,
          is_shared: true,
          primary_owner_id: goal.employee_id,
          thrust_area: goal.thrust_area,
          title: goal.title,
          description: goal.description,
          uom_type: goal.uom_type,
          goal_type: goal.goal_type,
          target_value: goal.target_value,
          weightage: goal.weightage,
          deadline: goal.deadline,
          category: goal.category,
          status: 'DRAFT',
        },
      });
      pushed++;
    }
  }

  return { pushed };
}
