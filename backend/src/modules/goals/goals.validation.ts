import type { Goal } from '@prisma/client';
import { GOAL_RULES } from '../../common/constants/goal-rules.js';

export class GoalValidationError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'GoalValidationError';
  }
}

export function validateWeightagePerGoal(weightage: number, title?: string) {
  if (weightage < GOAL_RULES.MIN_WEIGHTAGE) {
    const label = title ? `Goal '${title}' has` : 'Weightage';
    throw new GoalValidationError(
      'MIN_WEIGHTAGE',
      `${label} weightage ${weightage}%. Minimum is ${GOAL_RULES.MIN_WEIGHTAGE}%.`
    );
  }
  if (weightage > GOAL_RULES.MAX_WEIGHTAGE) {
    throw new GoalValidationError(
      'MAX_WEIGHTAGE',
      `Weightage ${weightage}% exceeds maximum of ${GOAL_RULES.MAX_WEIGHTAGE}%.`
    );
  }
}

export function validateDeadlineInCycle(
  deadline: Date,
  cycleEnd: Date,
  cycleName?: string
) {
  if (deadline > cycleEnd) {
    const end = cycleEnd.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    throw new GoalValidationError(
      'DEADLINE_OUT_OF_CYCLE',
      `Deadline must be within the active cycle (ends ${end}).`
    );
  }
}

export function validateGoalCount(count: number) {
  if (count >= GOAL_RULES.MAX_GOALS_PER_CYCLE) {
    throw new GoalValidationError(
      'MAX_GOALS',
      `You have ${GOAL_RULES.MAX_GOALS_PER_CYCLE} goals. Delete one before adding a new goal.`
    );
  }
}

export function validateSheetForSubmit(goals: Goal[]) {
  const active = goals.filter((g) => g.status !== 'CYCLE_CLOSED');
  if (active.length < GOAL_RULES.MIN_GOALS_TO_SUBMIT) {
    throw new GoalValidationError(
      'MIN_GOALS',
      `Submit at least ${GOAL_RULES.MIN_GOALS_TO_SUBMIT} goals before submitting your sheet.`
    );
  }

  const total = active.reduce((s, g) => s + g.weightage, 0);
  if (total !== GOAL_RULES.TOTAL_WEIGHTAGE) {
    const diff = GOAL_RULES.TOTAL_WEIGHTAGE - total;
    const action =
      diff > 0
        ? `Add ${diff}% more before submitting.`
        : `Remove ${Math.abs(diff)}% before submitting.`;
    throw new GoalValidationError(
      'TOTAL_WEIGHTAGE',
      `Total weightage is ${total}%. ${action}`
    );
  }

  const strategic = active
    .filter((g) => g.category.toUpperCase() === 'STRATEGIC')
    .reduce((s, g) => s + g.weightage, 0);
  const minStrategic = GOAL_RULES.CATEGORY_WEIGHTAGE_MIN.STRATEGIC;
  if (strategic < minStrategic) {
    throw new GoalValidationError(
      'STRATEGIC_WEIGHTAGE',
      `Strategic goals must total at least ${minStrategic}%. Currently at ${strategic}%.`
    );
  }
}

export function validateSelfRatingForSubmit(goal: Goal) {
  if (
    goal.self_achievement == null ||
    goal.self_rating == null ||
    !goal.self_notes?.trim()
  ) {
    throw new GoalValidationError(
      'SELF_RATING_REQUIRED',
      'Self achievement, self rating, and self notes are required before submitting.'
    );
  }
}
