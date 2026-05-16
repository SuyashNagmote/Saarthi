import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../common/utils/api-response.js';
import { requestMeta } from '../../common/utils/request-meta.js';
import {
  approveSchema,
  rejectSchema,
  requestReworkSchema,
  editApprovalSchema,
  bulkApproveSchema,
  approvalsQuerySchema,
} from './approvals.dto.js';
import * as approvalsService from './approvals.service.js';
import { GoalValidationError } from '../goals/goals.validation.js';

function handleApprovalError(res: Response, err: unknown) {
  if (err instanceof GoalValidationError) {
    const status = err.code === 'CONFLICT' ? 409 : 400;
    return sendError(res, err.code, err.message, status);
  }
  if (err instanceof Error) {
    if (err.message === 'NOT_FOUND') {
      return sendError(res, 'NOT_FOUND', 'Goal or approval not found', 404);
    }
    if (err.message === 'FORBIDDEN') {
      return sendError(res, 'FORBIDDEN', 'You do not have access to this goal', 403);
    }
  }
  throw err;
}

function goalIdParam(req: Request): string {
  const id = req.params.goalId;
  return Array.isArray(id) ? id[0]! : id!;
}

export async function listPending(req: Request, res: Response) {
  try {
    const query = approvalsQuerySchema.parse(req.query);
    const result = await approvalsService.listPendingApprovals(req.user!, query);
    return sendSuccess(res, result, undefined, 200, result.pagination);
  } catch (err) {
    return handleApprovalError(res, err);
  }
}

export async function listHistory(req: Request, res: Response) {
  try {
    const query = approvalsQuerySchema.parse(req.query);
    const result = await approvalsService.listApprovalHistory(req.user!, query);
    return sendSuccess(res, result, undefined, 200, result.pagination);
  } catch (err) {
    return handleApprovalError(res, err);
  }
}

export async function approve(req: Request, res: Response) {
  try {
    const body = approveSchema.parse(req.body);
    const { ip, userAgent } = requestMeta(req);
    const goal = await approvalsService.approveGoal(
      req.user!,
      goalIdParam(req),
      body,
      ip,
      userAgent
    );
    return sendSuccess(res, { goal }, 'Goal approved and locked');
  } catch (err) {
    return handleApprovalError(res, err);
  }
}

export async function reject(req: Request, res: Response) {
  try {
    const body = rejectSchema.parse(req.body);
    const { ip, userAgent } = requestMeta(req);
    const goal = await approvalsService.rejectGoal(
      req.user!,
      goalIdParam(req),
      body,
      ip,
      userAgent
    );
    return sendSuccess(res, { goal }, 'Goal rejected');
  } catch (err) {
    return handleApprovalError(res, err);
  }
}

export async function rework(req: Request, res: Response) {
  try {
    const body = requestReworkSchema.parse(req.body);
    const { ip, userAgent } = requestMeta(req);
    const goal = await approvalsService.requestRework(
      req.user!,
      goalIdParam(req),
      body,
      ip,
      userAgent
    );
    return sendSuccess(res, { goal }, 'Rework requested');
  } catch (err) {
    return handleApprovalError(res, err);
  }
}

export async function edit(req: Request, res: Response) {
  try {
    const body = editApprovalSchema.parse(req.body);
    const { ip, userAgent } = requestMeta(req);
    const goal = await approvalsService.editApproval(
      req.user!,
      goalIdParam(req),
      body,
      ip,
      userAgent
    );
    return sendSuccess(res, { goal }, 'Goal updated');
  } catch (err) {
    return handleApprovalError(res, err);
  }
}

export async function bulkApprove(req: Request, res: Response) {
  try {
    const body = bulkApproveSchema.parse(req.body);
    const { ip, userAgent } = requestMeta(req);
    const result = await approvalsService.bulkApproveGoals(
      req.user!,
      body,
      ip,
      userAgent
    );
    return sendSuccess(res, result, `${result.approved} goal(s) approved`);
  } catch (err) {
    return handleApprovalError(res, err);
  }
}

export async function pendingCount(req: Request, res: Response) {
  try {
    const result = await approvalsService.getPendingCount(req.user!);
    return sendSuccess(res, result);
  } catch (err) {
    return handleApprovalError(res, err);
  }
}

export async function teamsWebhook(req: Request, res: Response) {
  try {
    const { action, goalId, managerId } = req.body;
    
    // In a real app, validate an MS Teams JWT here. For demo, we mock the manager AuthUser
    const mockUser = {
      id: managerId,
      email: 'manager@demo.com',
      role: 'MANAGER' as const,
      name: 'Manager',
      department: 'Engineering',
      designation: 'Manager'
    };

    const approval = await approvalsService.listPendingApprovals(mockUser, { page: 1, limit: 100 });
    const targetApproval = approval.approvals.find(a => a.goal_id === goalId);
    
    if (!targetApproval) {
      return res.status(404).json({ error: 'Approval not found or already processed' });
    }

    if (action === 'approve') {
      await approvalsService.approveGoal(
        mockUser,
        goalId,
        { version: targetApproval.version, comments: 'Approved via MS Teams' },
        'teams-webhook',
        'ms-teams'
      );
    } else if (action === 'reject') {
      await approvalsService.rejectGoal(
        mockUser,
        goalId,
        { version: targetApproval.version, comments: 'Rejected via MS Teams' },
        'teams-webhook',
        'ms-teams'
      );
    }

    return res.status(200).json({ message: 'Action processed successfully' });
  } catch (err) {
    console.error('Teams Webhook Error:', err);
    return res.status(500).json({ error: 'Failed to process action' });
  }
}
