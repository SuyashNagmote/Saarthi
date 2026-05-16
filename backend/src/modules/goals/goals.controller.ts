import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../common/utils/api-response.js';
import { requestMeta } from '../../common/utils/request-meta.js';
import {
  checkTitleSchema,
  createGoalSchema,
  listGoalsQuerySchema,
  updateGoalSchema,
} from './goals.dto.js';
import * as goalsService from './goals.service.js';
import { GoalValidationError } from './goals.validation.js';

function handleGoalError(res: Response, err: unknown) {
  if (err instanceof GoalValidationError) {
    return sendError(res, err.code, err.message, 400);
  }
  if (err instanceof Error) {
    if (err.message === 'NOT_FOUND') {
      return sendError(res, 'NOT_FOUND', 'Goal not found', 404);
    }
    if (err.message === 'FORBIDDEN') {
      return sendError(res, 'FORBIDDEN', 'You do not have access to this goal', 403);
    }
    if (err.message === 'NO_ACTIVE_CYCLE') {
      return sendError(res, 'NO_ACTIVE_CYCLE', 'No active goal cycle configured', 400);
    }
    if (err.message === 'CYCLE_ENDED') {
      return sendError(res, 'CYCLE_ENDED', 'The active cycle has ended', 400);
    }
  }
  throw err;
}

export async function list(req: Request, res: Response) {
  try {
    const query = listGoalsQuerySchema.parse(req.query);
    const result = await goalsService.listGoals(req.user!, query);
    return sendSuccess(res, result, undefined, 200, result.pagination);
  } catch (err) {
    return handleGoalError(res, err);
  }
}

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0]! : id!;
}

export async function getById(req: Request, res: Response) {
  try {
    const goal = await goalsService.getGoalById(req.user!, paramId(req));
    return sendSuccess(res, { goal });
  } catch (err) {
    return handleGoalError(res, err);
  }
}

export async function checkTitle(req: Request, res: Response) {
  try {
    const q = checkTitleSchema.parse(req.query);
    const result = await goalsService.checkDuplicateTitle(
      req.user!,
      q.title,
      q.exclude_id
    );
    return sendSuccess(res, result);
  } catch (err) {
    return handleGoalError(res, err);
  }
}

export async function weightageSummary(req: Request, res: Response) {
  try {
    const cycleId = req.query.cycle_id as string | undefined;
    const summary = await goalsService.getWeightageSummary(req.user!, cycleId);
    return sendSuccess(res, summary);
  } catch (err) {
    return handleGoalError(res, err);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const body = createGoalSchema.parse(req.body);
    const { ip, userAgent } = requestMeta(req);
    const goal = await goalsService.createGoal(req.user!, body, ip, userAgent);
    return sendSuccess(res, { goal }, 'Goal created', 201);
  } catch (err) {
    return handleGoalError(res, err);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const body = updateGoalSchema.parse(req.body);
    const { ip, userAgent } = requestMeta(req);
    const goal = await goalsService.updateGoal(
      req.user!,
      paramId(req),
      body,
      ip,
      userAgent
    );
    return sendSuccess(res, { goal });
  } catch (err) {
    return handleGoalError(res, err);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { ip, userAgent } = requestMeta(req);
    await goalsService.deleteGoal(req.user!, paramId(req), ip, userAgent);
    return sendSuccess(res, { deleted: true });
  } catch (err) {
    return handleGoalError(res, err);
  }
}

export async function submit(req: Request, res: Response) {
  try {
    const { ip, userAgent } = requestMeta(req);
    const result = await goalsService.submitGoal(
      req.user!,
      paramId(req),
      ip,
      userAgent
    );
    return sendSuccess(res, result, 'Goal submitted');
  } catch (err) {
    return handleGoalError(res, err);
  }
}

export async function bulkSubmit(req: Request, res: Response) {
  try {
    const { ip, userAgent } = requestMeta(req);
    const result = await goalsService.bulkSubmitGoals(req.user!, ip, userAgent);
    return sendSuccess(res, result, 'All draft goals submitted');
  } catch (err) {
    return handleGoalError(res, err);
  }
}

export async function unlock(req: Request, res: Response) {
  try {
    const { ip, userAgent } = requestMeta(req);
    const reason = req.body.reason;
    if (!reason) {
      return res.status(400).json({ success: false, error: { message: 'reason is required' } });
    }
    const result = await goalsService.unlockGoal(
      req.user!,
      paramId(req),
      reason,
      ip,
      userAgent
    );
    return sendSuccess(res, result, 'Goal unlocked');
  } catch (err) {
    return handleGoalError(res, err);
  }
}

export async function pushShared(req: Request, res: Response) {
  try {
    const { ip, userAgent } = requestMeta(req);
    const result = await goalsService.pushSharedGoal(
      req.user!,
      paramId(req),
      ip,
      userAgent
    );
    return sendSuccess(res, result, 'Shared goal pushed to team');
  } catch (err) {
    return handleGoalError(res, err);
  }
}
