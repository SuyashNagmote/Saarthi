import { z } from 'zod';
import { GOAL_RULES } from '../constants/goal-rules';

export const goalFormSchema = z.object({
  thrust_area: z.string().min(1, 'Thrust area is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  uom_type: z.enum(['NUMERIC', 'PERCENTAGE', 'TIMELINE', 'ZERO_BASED']),
  goal_type: z.enum(['MIN_TYPE', 'MAX_TYPE', 'TIMELINE', 'ZERO_BASED']),
  target_value: z.coerce.number().positive('Target must be positive'),
  weightage: z.coerce
    .number()
    .min(GOAL_RULES.MIN_WEIGHTAGE, `Minimum weightage is ${GOAL_RULES.MIN_WEIGHTAGE}%`)
    .max(GOAL_RULES.MAX_WEIGHTAGE, `Maximum weightage is ${GOAL_RULES.MAX_WEIGHTAGE}%`),
  deadline: z.string().min(1, 'Deadline is required'),
  category: z.enum(['Strategic', 'Operational', 'Development']),
  self_achievement: z.coerce.number().optional(),
  self_rating: z.coerce.number().min(1).max(5).optional(),
  self_notes: z.string().optional(),
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;
