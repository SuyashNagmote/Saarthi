import { prisma } from '../db/prisma.js';
import { calculateScore, mapScoreToRating } from '../utils/score-calculator.js';

export async function recalculateGoalScore(goalId: string): Promise<void> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: {
      id: true,
      goal_type: true,
      target_value: true,
      deadline: true,
      weightage: true,
      actual_achievement: true,
    },
  });

  if (!goal || goal.actual_achievement == null) {
    return;
  }

  const computed = calculateScore(goal, goal.actual_achievement);
  const weighted = (computed * goal.weightage) / 100;
  const { rating } = mapScoreToRating(computed);

  await prisma.goal.update({
    where: { id: goalId },
    data: {
      computed_score: computed,
      weighted_score: weighted,
      final_rating: rating,
    },
  });
}

export async function recalculateEmployeeCycleScore(
  employeeId: string,
  cycleId: string
): Promise<{ totalWeightedScore: number; rating: number; label: string }> {
  const goals = await prisma.goal.findMany({
    where: {
      employee_id: employeeId,
      cycle_id: cycleId,
      status: { in: ['APPROVED', 'LOCKED'] },
    },
    select: {
      id: true,
      computed_score: true,
      weightage: true,
    },
  });

  let totalWeightedScore = 0;
  for (const goal of goals) {
    const score = goal.computed_score ?? 0;
    totalWeightedScore += (score * goal.weightage) / 100;
  }

  const { rating, label } = mapScoreToRating(totalWeightedScore);

  // We could store this in a UserCycleScore table if one existed,
  // but since it's dynamically calculated, we just return it.
  return {
    totalWeightedScore,
    rating,
    label,
  };
}
