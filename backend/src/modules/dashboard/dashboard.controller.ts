import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../common/utils/api-response.js';
import * as dashboardService from './dashboard.service.js';

function handleError(res: Response, err: unknown) {
  if (err instanceof Error) {
    if (err.message === 'FORBIDDEN') return sendError(res, 'FORBIDDEN', 'Access denied', 403);
  }
  return sendError(res, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
}

export async function employeeDashboard(req: Request, res: Response) {
  try {
    const data = await dashboardService.getEmployeeDashboard(req.user!);
    return sendSuccess(res, data);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function managerDashboard(req: Request, res: Response) {
  try {
    const data = await dashboardService.getManagerDashboard(req.user!);
    return sendSuccess(res, data);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function adminDashboard(req: Request, res: Response) {
  try {
    const data = await dashboardService.getAdminDashboard(req.user!);
    return sendSuccess(res, data);
  } catch (err) {
    return handleError(res, err);
  }
}
