import type { GoalStatus } from '@prisma/client';

const TRANSITIONS: Record<GoalStatus, GoalStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['PENDING_APPROVAL'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'REWORK_REQUESTED'],
  APPROVED: ['LOCKED'],
  REJECTED: [],
  REWORK_REQUESTED: ['DRAFT'],
  LOCKED: ['APPROVED'],
  CYCLE_CLOSED: [],
};

export function canTransition(from: GoalStatus, to: GoalStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: GoalStatus, to: GoalStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`INVALID_TRANSITION:${from}:${to}`);
  }
}

export const EDITABLE_STATUSES: GoalStatus[] = ['DRAFT', 'REWORK_REQUESTED'];
