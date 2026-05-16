import { z } from 'zod';

export const approveSchema = z.object({
  comments: z.string().optional(),
  version: z.number().int().positive(),
});

export const rejectSchema = z.object({
  comments: z.string().min(1, 'Comment is required when rejecting a goal.'),
  version: z.number().int().positive(),
});

export const requestReworkSchema = z.object({
  comments: z.string().min(1, 'Comment is required when requesting rework.'),
  version: z.number().int().positive(),
});

export const editApprovalSchema = z.object({
  edited_target: z.number().positive().optional(),
  edited_weightage: z.number().min(10).max(50).optional(),
  version: z.number().int().positive(),
});

export const bulkApproveSchema = z.object({
  goal_ids: z.array(z.string().uuid()).min(1),
  comment: z.string().optional(),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm bulk approval by setting confirmed: true.' }),
  }),
});

export const approvalsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
