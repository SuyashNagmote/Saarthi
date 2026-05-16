import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const azureLoginSchema = z.object({
  azure_token: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().min(1),
  designation: z.string().min(1),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional(),
  manager_id: z.string().optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});
