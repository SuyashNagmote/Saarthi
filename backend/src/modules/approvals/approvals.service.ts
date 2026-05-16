import type { Prisma } from '@prisma/client';
import { prisma } from '../../common/db/prisma.js';
import { auditLog } from '../../common/services/audit.service.js';
import { recalculateGoalScore } from '../../common/services/scoring.service.js';
import { EmailService } from '../../common/services/email.service.js';
import type { AuthUser } from '../../common/types/express.js';
import { assertTransition } from '../goals/goal-status.machine.js';
import { GoalValidationError, validateWeightagePerGoal } from '../goals/goals.validation.js';
import type { z } from 'zod';
import type {
  approveSchema,
  rejectSchema,
  requestReworkSchema,
  editApprovalSchema,
  bulkApproveSchema,
} from './approvals.dto.js';

type ApproveInput = z.infer<typeof approveSchema>;
type RejectInput = z.infer<typeof rejectSchema>;
type ReworkInput = z.infer<typeof requestReworkSchema>;
type EditInput = z.infer<typeof editApprovalSchema>;
type BulkApproveInput = z.infer<typeof bulkApproveSchema>;

/* ── helpers ── */

function assertManager(user: AuthUser) {
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }
}

async function assertManagerOfGoal(user: AuthUser, goalEmployeeId: string) {
  if (user.role === 'ADMIN') return;
  const emp = await prisma.user.findFirst({
    where: { id: goalEmployeeId, manager_id: user.id },
  });
  if (!emp) throw new Error('FORBIDDEN');
}

async function getGoalWithApproval(goalId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      employee: { select: { id: true, name: true, email: true, department: true, manager_id: true } },
      cycle: { select: { id: true, name: true } },
    },
  });
  if (!goal) throw new Error('NOT_FOUND');

  const approval = await prisma.approval.findFirst({
    where: { goal_id: goalId },
    orderBy: { created_at: 'desc' },
  });

  return { goal, approval };
}

function assertVersionMatch(currentVersion: number, providedVersion: number) {
  if (currentVersion !== providedVersion) {
    throw new GoalValidationError(
      'CONFLICT',
      'This goal was modified while you were reviewing. Please reload.'
    );
  }
}

async function logApprovalAudit(
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

/* ── Pending queue — Manager ── */

export async function listPendingApprovals(
  user: AuthUser,
  query: { page: number; limit: number }
) {
  assertManager(user);

  const where: Prisma.ApprovalWhereInput =
    user.role === 'ADMIN'
      ? { status: 'PENDING' }
      : { manager_id: user.id, status: 'PENDING' };

  const [approvals, total] = await Promise.all([
    prisma.approval.findMany({
      where,
      include: {
        goal: {
          include: {
            employee: { select: { id: true, name: true, email: true, department: true } },
            cycle: { select: { id: true, name: true } },
          },
        },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.approval.count({ where }),
  ]);

  return { approvals, pagination: { page: query.page, limit: query.limit, total } };
}

/* ── History — Manager past approvals ── */

export async function listApprovalHistory(
  user: AuthUser,
  query: { page: number; limit: number }
) {
  assertManager(user);

  const where: Prisma.ApprovalWhereInput =
    user.role === 'ADMIN'
      ? { status: { not: 'PENDING' } }
      : { manager_id: user.id, status: { not: 'PENDING' } };

  const [approvals, total] = await Promise.all([
    prisma.approval.findMany({
      where,
      include: {
        goal: {
          include: {
            employee: { select: { id: true, name: true, email: true, department: true } },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.approval.count({ where }),
  ]);

  return { approvals, pagination: { page: query.page, limit: query.limit, total } };
}

/* ── Approve — PENDING_APPROVAL → APPROVED → LOCKED ── */

export async function approveGoal(
  user: AuthUser,
  goalId: string,
  input: ApproveInput,
  ip: string,
  userAgent: string
) {
  assertManager(user);
  const { goal, approval } = await getGoalWithApproval(goalId);
  await assertManagerOfGoal(user, goal.employee_id);

  if (goal.status !== 'PENDING_APPROVAL') {
    throw new GoalValidationError(
      'INVALID_STATUS',
      `Cannot approve a goal in status ${goal.status}.`
    );
  }
  if (!approval) throw new Error('NOT_FOUND');
  assertVersionMatch(approval.version, input.version);

  // Status machine: PENDING_APPROVAL → APPROVED
  assertTransition(goal.status, 'APPROVED');

  // Update approval record
  await prisma.approval.update({
    where: { id: approval.id },
    data: {
      status: 'APPROVED',
      comments: input.comments ?? approval.comments,
      version: approval.version + 1,
    },
  });

  // Update goal → APPROVED
  await prisma.goal.update({
    where: { id: goalId },
    data: { status: 'APPROVED' },
  });

  // Status machine: APPROVED → LOCKED (auto-lock post-approval)
  assertTransition('APPROVED', 'LOCKED');
  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: {
      status: 'LOCKED',
      is_locked: true,
      lock_reason: 'Approved and locked',
    },
  });

  // Notify employee
  await prisma.notification.create({
    data: {
      user_id: goal.employee_id,
      type: 'GOAL_APPROVED',
      title: 'Goal approved',
      message: `Your goal "${goal.title}" has been approved by ${user.name}.`,
      action_url: `/goals/${goalId}`,
    },
  });

  await EmailService.notifyGoalApproved(goal.employee.email, goal.title);

  await logApprovalAudit(
    goalId,
    'APPROVED',
    user.id,
    { status: 'PENDING_APPROVAL' },
    { status: 'LOCKED' },
    { status: { from: 'PENDING_APPROVAL', to: 'LOCKED' } },
    ip,
    userAgent
  );

  return updated;
}

/* ── Reject — PENDING_APPROVAL → REJECTED ── */

export async function rejectGoal(
  user: AuthUser,
  goalId: string,
  input: RejectInput,
  ip: string,
  userAgent: string
) {
  assertManager(user);
  const { goal, approval } = await getGoalWithApproval(goalId);
  await assertManagerOfGoal(user, goal.employee_id);

  if (goal.status !== 'PENDING_APPROVAL') {
    throw new GoalValidationError(
      'INVALID_STATUS',
      `Cannot reject a goal in status ${goal.status}.`
    );
  }
  if (!approval) throw new Error('NOT_FOUND');
  assertVersionMatch(approval.version, input.version);

  assertTransition(goal.status, 'REJECTED');

  await prisma.approval.update({
    where: { id: approval.id },
    data: {
      status: 'REJECTED',
      comments: input.comments,
      version: approval.version + 1,
    },
  });

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: { status: 'REJECTED' },
  });

  // Notify employee
  await prisma.notification.create({
    data: {
      user_id: goal.employee_id,
      type: 'GOAL_REJECTED',
      title: 'Goal rejected',
      message: `Your goal "${goal.title}" was rejected. Reason: ${input.comments}`,
      action_url: `/goals/${goalId}`,
    },
  });

  await EmailService.notifyGoalRejected(goal.employee.email, goal.title, input.comments ?? '');

  await logApprovalAudit(
    goalId,
    'REJECTED',
    user.id,
    { status: 'PENDING_APPROVAL' },
    { status: 'REJECTED', comments: input.comments },
    { status: { from: 'PENDING_APPROVAL', to: 'REJECTED' } },
    ip,
    userAgent
  );

  return updated;
}

/* ── Request rework — PENDING_APPROVAL → REWORK_REQUESTED ── */

export async function requestRework(
  user: AuthUser,
  goalId: string,
  input: ReworkInput,
  ip: string,
  userAgent: string
) {
  assertManager(user);
  const { goal, approval } = await getGoalWithApproval(goalId);
  await assertManagerOfGoal(user, goal.employee_id);

  if (goal.status !== 'PENDING_APPROVAL') {
    throw new GoalValidationError(
      'INVALID_STATUS',
      `Cannot request rework for a goal in status ${goal.status}.`
    );
  }
  if (!approval) throw new Error('NOT_FOUND');
  assertVersionMatch(approval.version, input.version);

  assertTransition(goal.status, 'REWORK_REQUESTED');

  await prisma.approval.update({
    where: { id: approval.id },
    data: {
      status: 'REWORK_REQUESTED',
      comments: input.comments,
      version: approval.version + 1,
    },
  });

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: { status: 'REWORK_REQUESTED' },
  });

  // Notify employee
  await prisma.notification.create({
    data: {
      user_id: goal.employee_id,
      type: 'GOAL_REWORK_REQUESTED',
      title: 'Rework requested',
      message: `Your goal "${goal.title}" needs changes: ${input.comments}`,
      action_url: `/goals/${goalId}`,
    },
  });

  await EmailService.notifyGoalRejected(goal.employee.email, goal.title, input.comments ?? '');

  await logApprovalAudit(
    goalId,
    'REWORK_REQUESTED',
    user.id,
    { status: 'PENDING_APPROVAL' },
    { status: 'REWORK_REQUESTED', comments: input.comments },
    { status: { from: 'PENDING_APPROVAL', to: 'REWORK_REQUESTED' } },
    ip,
    userAgent
  );

  return updated;
}

/* ── Inline edit target / weightage — optimistic locking ── */

export async function editApproval(
  user: AuthUser,
  goalId: string,
  input: EditInput,
  ip: string,
  userAgent: string
) {
  assertManager(user);
  const { goal, approval } = await getGoalWithApproval(goalId);
  await assertManagerOfGoal(user, goal.employee_id);

  if (goal.status !== 'PENDING_APPROVAL') {
    throw new GoalValidationError(
      'INVALID_STATUS',
      `Cannot edit a goal in status ${goal.status}.`
    );
  }
  if (!approval) throw new Error('NOT_FOUND');
  assertVersionMatch(approval.version, input.version);

  // Validate new weightage if provided
  if (input.edited_weightage !== undefined) {
    validateWeightagePerGoal(input.edited_weightage, goal.title);
  }

  const oldTarget = goal.target_value;
  const oldWeightage = goal.weightage;

  // Update approval record with edits
  await prisma.approval.update({
    where: { id: approval.id },
    data: {
      ...(input.edited_target !== undefined && { edited_target: input.edited_target }),
      ...(input.edited_weightage !== undefined && { edited_weightage: input.edited_weightage }),
      version: approval.version + 1,
    },
  });

  // Also update the goal itself with the manager's edits
  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: {
      ...(input.edited_target !== undefined && { target_value: input.edited_target }),
      ...(input.edited_weightage !== undefined && { weightage: input.edited_weightage }),
    },
  });

  // If the goal already had an actual_achievement (unlikely during initial approval, but possible on rework/unlock), recompute score
  if (updated.actual_achievement !== null) {
    await recalculateGoalScore(goalId);
  }

  const diff: Record<string, { from: unknown; to: unknown }> = {};
  if (input.edited_target !== undefined && input.edited_target !== oldTarget) {
    diff.target_value = { from: oldTarget, to: input.edited_target };
  }
  if (input.edited_weightage !== undefined && input.edited_weightage !== oldWeightage) {
    diff.weightage = { from: oldWeightage, to: input.edited_weightage };
  }

  await logApprovalAudit(
    goalId,
    'MANAGER_EDITED',
    user.id,
    { target_value: oldTarget, weightage: oldWeightage },
    { target_value: updated.target_value, weightage: updated.weightage },
    diff,
    ip,
    userAgent
  );

  return updated;
}

/* ── Bulk approve — requires confirmed: true ── */

export async function bulkApproveGoals(
  user: AuthUser,
  input: BulkApproveInput,
  ip: string,
  userAgent: string
) {
  assertManager(user);

  const approved: string[] = [];
  const failed: { goal_id: string; reason: string }[] = [];
  const locked: string[] = [];

  for (const goalId of input.goal_ids) {
    try {
      const { goal, approval } = await getGoalWithApproval(goalId);
      await assertManagerOfGoal(user, goal.employee_id);

      if (goal.status !== 'PENDING_APPROVAL' || !approval) {
        failed.push({ goal_id: goalId, reason: `Invalid status: ${goal.status}` });
        continue;
      }

      assertTransition(goal.status, 'APPROVED');

      await prisma.approval.update({
        where: { id: approval.id },
        data: {
          status: 'APPROVED',
          comments: input.comment ?? 'Bulk approved',
          version: approval.version + 1,
        },
      });

      await prisma.goal.update({
        where: { id: goalId },
        data: { status: 'APPROVED' },
      });

      assertTransition('APPROVED', 'LOCKED');
      await prisma.goal.update({
        where: { id: goalId },
        data: {
          status: 'LOCKED',
          is_locked: true,
          lock_reason: 'Approved and locked',
        },
      });

      locked.push(goalId);
      approved.push(goalId);

      await prisma.notification.create({
        data: {
          user_id: goal.employee_id,
          type: 'GOAL_APPROVED',
          title: 'Goal approved',
          message: `Your goal "${goal.title}" has been approved by ${user.name}.`,
          action_url: `/goals/${goalId}`,
        },
      });

      await logApprovalAudit(
        goalId,
        'APPROVED',
        user.id,
        { status: 'PENDING_APPROVAL' },
        { status: 'LOCKED' },
        { status: { from: 'PENDING_APPROVAL', to: 'LOCKED' } },
        ip,
        userAgent
      );
    } catch (e) {
      failed.push({
        goal_id: goalId,
        reason: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  return { approved: approved.length, failed, locked };
}

/* ── Pending count — for sidebar badge ── */

export async function getPendingCount(user: AuthUser) {
  assertManager(user);
  const count = await prisma.approval.count({
    where:
      user.role === 'ADMIN'
        ? { status: 'PENDING' }
        : { manager_id: user.id, status: 'PENDING' },
  });
  return { count };
}
