import type { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  status = 200,
  pagination?: { page: number; limit: number; total: number }
) {
  return res.status(status).json({
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(pagination ? { pagination } : {}),
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  status = 400,
  details?: unknown[]
) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}
