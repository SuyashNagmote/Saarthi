import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../common/utils/api-response.js';
import * as analyticsService from './analytics.service.js';

export async function getQoqTrend(req: Request, res: Response) {
  try {
    const data = await analyticsService.getQoqTrend(req.user!);
    sendSuccess(res, data);
  } catch (error: any) {
    sendError(res, 'INTERNAL_ERROR', error.message);
  }
}

export async function getHeatmap(req: Request, res: Response) {
  try {
    const data = await analyticsService.getHeatmap(req.user!);
    sendSuccess(res, data);
  } catch (error: any) {
    sendError(res, 'INTERNAL_ERROR', error.message);
  }
}

export async function getDistribution(req: Request, res: Response) {
  try {
    const data = await analyticsService.getDistribution(req.user!);
    sendSuccess(res, data);
  } catch (error: any) {
    sendError(res, 'INTERNAL_ERROR', error.message);
  }
}
