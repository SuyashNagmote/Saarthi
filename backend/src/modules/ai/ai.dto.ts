import { z } from 'zod';

export const generateGoalSchema = z.object({
  title: z.string().min(3),
  department: z.string(),
  designation: z.string(),
  cycle_name: z.string(),
  existing_goals: z.array(z.object({
    title: z.string(),
    weightage: z.number(),
  })).default([]),
});

export const parseCheckinSchema = z.object({
  nl_input: z.string().min(10),
  goal: z.object({
    title: z.string(),
    target_value: z.number(),
    uom_type: z.string(),
    goal_type: z.string(),
    deadline: z.string(),
  }),
});
