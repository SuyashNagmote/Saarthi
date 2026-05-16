import type { RiskLevel } from '@prisma/client';

export interface AttritionInput {
  goals: {
    self_rating: number | null;
    final_rating: number | null;
    computed_score: number | null;
    status: string;
  }[];
  checkIns: {
    created_at: Date;
    quarter: string;
  }[];
  reworkCount: number;
  missingCheckins: number;
}

export function calculateAttritionRiskScore(input: AttritionInput): number {
  let score = 0;

  const deltas = input.goals
    .filter((g) => g.self_rating != null && g.final_rating != null)
    .map((g) => (g.self_rating ?? 0) - (g.final_rating ?? 0));
  const avgDelta =
    deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
  if (avgDelta > 2) score += 30;
  else if (avgDelta > 1) score += 15;

  const scores = input.goals
    .map((g) => g.computed_score)
    .filter((s): s is number => s != null);
  if (scores.length >= 2) {
    const trend = scores[scores.length - 1]! - scores[0]!;
    if (trend < -10) score += 25;
    else if (trend < -5) score += 12;
  }

  score += input.reworkCount * 10;
  score += input.missingCheckins * 12;

  return Math.min(score, 100);
}

export function mapScoreToRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'CRITICAL';
  if (score >= 45) return 'HIGH';
  if (score >= 20) return 'MEDIUM';
  return 'LOW';
}
