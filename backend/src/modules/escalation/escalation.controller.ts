import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../common/utils/api-response.js';
import { runEscalationCheck } from './escalation.service.js';

/**
 * POST /api/v1/escalation/run — Trigger escalation check manually.
 * In production, call this via a cron job (e.g. every 6h).
 * Only ADMINs may trigger manually.
 */
export async function triggerEscalation(req: Request, res: Response) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'Only admins can trigger escalation', 403);
    }
    const result = await runEscalationCheck();
    return sendSuccess(res, result, `Escalation check complete`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sendError(res, 'INTERNAL_ERROR', message);
  }
}
