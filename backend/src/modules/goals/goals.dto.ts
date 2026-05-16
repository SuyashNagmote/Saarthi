import { z } from 'zod';

export const createGoalSchema = z.object({
  thrust_area: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  uom_type: z.enum(['NUMERIC', 'PERCENTAGE', 'TIMELINE', 'ZERO_BASED']),
  goal_type: z.enum(['MIN_TYPE', 'MAX_TYPE', 'TIMELINE', 'ZERO_BASED']),
  target_value: z.number().positive(),
  weightage: z.number(),
  deadline: z.string().datetime().or(z.string().min(1)),
  category: z.enum(['Strategic', 'Operational', 'Development']),
  self_achievement: z.number().optional(),
  self_rating: z.number().min(1).max(5).optional(),
  self_notes: z.string().optional(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const listGoalsQuerySchema = z.object({
  status: z.string().optional(),
  cycle_id: z.string().uuid().optional(),
  employee_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const checkTitleSchema = z.object({
  title: z.string().min(1),
  exclude_id: z.string().uuid().optional(),
});
