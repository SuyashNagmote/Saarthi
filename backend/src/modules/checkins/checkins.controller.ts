import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../common/utils/api-response.js';
import { requestMeta } from '../../common/utils/request-meta.js';
import {
  createCheckInSchema,
  updateCheckInSchema,
  managerCommentSchema,
  checkinsQuerySchema,
} from './checkins.dto.js';
import * as checkinsService from './checkins.service.js';
import { GoalValidationError } from '../goals/goals.validation.js';

function handleError(res: Response, err: unknown) {
  if (err instanceof GoalValidationError) {
    return sendError(res, err.code, err.message, 400);
  }
  if (err instanceof Error) {
    if (err.message === 'NOT_FOUND') return sendError(res, 'NOT_FOUND', 'Not found', 404);
    if (err.message === 'FORBIDDEN') return sendError(res, 'FORBIDDEN', 'Access denied', 403);
  }
  throw err;
}

export async function list(req: Request, res: Response) {
  try {
    const query = checkinsQuerySchema.parse(req.query);
    const result = await checkinsService.listCheckIns(req.user!, query);
    return sendSuccess(res, result, undefined, 200, result.pagination);
  } catch (err) { return handleError(res, err); }
}

export async function create(req: Request, res: Response) {
  try {
    const body = createCheckInSchema.parse(req.body);
    const { ip, userAgent } = requestMeta(req);
    const result = await checkinsService.createCheckIn(req.user!, body, ip, userAgent);
    return sendSuccess(res, result, 'Check-in submitted', 201);
  } catch (err) { return handleError(res, err); }
}

export async function update(req: Request, res: Response) {
  try {
    const body = updateCheckInSchema.parse(req.body);
    const { ip, userAgent } = requestMeta(req);
    const id = req.params.id as string;
    const checkin = await checkinsService.updateCheckIn(req.user!, id, body, ip, userAgent);
    return sendSuccess(res, { checkin }, 'Check-in updated');
  } catch (err) { return handleError(res, err); }
}

export async function comment(req: Request, res: Response) {
  try {
    const body = managerCommentSchema.parse(req.body);
    const { ip, userAgent } = requestMeta(req);
    const id = req.params.id as string;
    const checkin = await checkinsService.addManagerComment(req.user!, id, body, ip, userAgent);
    return sendSuccess(res, { checkin }, 'Comment added');
  } catch (err) { return handleError(res, err); }
}

export async function windowStatus(_req: Request, res: Response) {
  try {
    const status = checkinsService.getWindowStatus();
    return sendSuccess(res, status);
  } catch (err) { return handleError(res, err); }
}

export async function completionStatus(req: Request, res: Response) {
  try {
    const result = await checkinsService.getCompletionStatus(req.user!);
    return sendSuccess(res, result);
  } catch (err) { return handleError(res, err); }
}
