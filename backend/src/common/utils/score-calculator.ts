import type { GoalType } from '@prisma/client';

export interface ScoreGoalInput {
  goal_type: GoalType;
  target_value: number;
  deadline: Date;
}

export function calculateScore(goal: ScoreGoalInput, achievement: number): number {
  switch (goal.goal_type) {
    case 'MIN_TYPE':
      return Math.min((achievement / goal.target_value) * 100, 150);
    case 'MAX_TYPE':
      if (achievement === 0) return 150;
      return Math.min((goal.target_value / achievement) * 100, 150);
    case 'TIMELINE': {
      const daysEarly =
        (new Date(goal.deadline).getTime() - Date.now()) / 86400000;
      if (daysEarly >= 7) return 120;
      if (daysEarly >= 0) return 100;
      if (daysEarly >= -7) return 80;
      if (daysEarly >= -14) return 60;
      return 40;
    }
    case 'ZERO_BASED':
      return achievement === 0 ? 100 : 0;
    default:
      return 0;
  }
}

export function calculateWeightedScore(
  goals: { computed_score: number | null; weightage: number }[]
): number {
  return goals.reduce(
    (sum, g) => sum + ((g.computed_score ?? 0) * g.weightage) / 100,
    0
  );
}

export function mapScoreToRating(score: number): { rating: number; label: string } {
  if (score >= 110) return { rating: 5, label: 'Exceptional' };
  if (score >= 90) return { rating: 4, label: 'Exceeds Expectations' };
  if (score >= 70) return { rating: 3, label: 'Meets Expectations' };
  if (score >= 50) return { rating: 2, label: 'Needs Improvement' };
  return { rating: 1, label: 'Unsatisfactory' };
}
