import { z } from 'zod';

export const createCheckInSchema = z.object({
  goal_id: z.string().uuid(),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4', 'ANNUAL']),
  actual_achievement: z.number(),
  progress_notes: z.string().optional(),
  goal_status: z.enum(['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'COMPLETED', 'MISSED']),
});

export const updateCheckInSchema = z.object({
  actual_achievement: z.number().optional(),
  progress_notes: z.string().optional(),
  goal_status: z.enum(['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'COMPLETED', 'MISSED']).optional(),
});

export const managerCommentSchema = z.object({
  manager_comment: z.string().min(1, 'Comment is required.'),
  recommendation: z.string().optional(),
});

export const checkinsQuerySchema = z.object({
  goal_id: z.string().uuid().optional(),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4', 'ANNUAL']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
