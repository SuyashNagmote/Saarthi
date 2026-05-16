import type { Request, Response } from 'express';
import { generateGoalSchema, parseCheckinSchema } from './ai.dto.js';
import * as aiService from './ai.service.js';
import { sendError, sendSuccess } from '../../common/utils/api-response.js';

export async function generateGoal(req: Request, res: Response) {
  try {
    const body = generateGoalSchema.parse(req.body);
    const result = await aiService.generateGoal(body);
    return sendSuccess(res, result, 'Goal generated successfully');
  } catch (e) {
    return sendError(res, 'AI_ERROR', 'Failed to generate goal');
  }
}

export async function parseCheckin(req: Request, res: Response) {
  try {
    const body = parseCheckinSchema.parse(req.body);
    const result = await aiService.parseCheckin(body);
    return sendSuccess(res, result, 'Check-in parsed successfully');
  } catch (e) {
    return sendError(res, 'AI_ERROR', 'Failed to parse check-in');
  }
}
