import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { GoalValidationError } from '../../modules/goals/goals.validation.js';
import { sendError } from '../utils/api-response.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof GoalValidationError) {
    return sendError(res, err.code, err.message, 400);
  }

  if (err instanceof ZodError) {
    return sendError(
      res,
      'VALIDATION_ERROR',
      'Validation failed',
      400,
      err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }))
    );
  }

  if (err instanceof Error && err.message === 'UNAUTHORIZED') {
    return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
  }

  if (err instanceof Error && err.message === 'FORBIDDEN') {
    return sendError(res, 'FORBIDDEN', 'You do not have permission', 403);
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error(err);
    return sendError(
      res,
      'DATABASE_UNAVAILABLE',
      'Database is not available. Run: npm run db:migrate && npm run db:seed',
      503,
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(err);
    return sendError(res, 'DATABASE_ERROR', 'Database operation failed', 500);
  }

  console.error(err);
  const message =
    process.env.NODE_ENV === 'development' && err instanceof Error
      ? err.message
      : 'An unexpected error occurred';
  return sendError(res, 'INTERNAL_ERROR', message, 500);
}
