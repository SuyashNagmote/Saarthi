import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import { requirePermission } from '../../common/guards/roles.guard.js';
import * as approvalsController from './approvals.controller.js';

export const approvalsRouter = Router();

// MS Teams Webhook (Unprotected by JWT, relies on Teams token validation in real app)
approvalsRouter.post(
  '/webhook/teams',
  (req, res, next) => approvalsController.teamsWebhook(req, res).catch(next)
);

approvalsRouter.use(jwtGuard);

// GET /approvals — Manager pending queue
approvalsRouter.get(
  '/',
  requirePermission('goal:approve'),
  (req, res, next) => approvalsController.listPending(req, res).catch(next)
);

// GET /approvals/history — Manager past approvals
approvalsRouter.get(
  '/history',
  requirePermission('goal:approve'),
  (req, res, next) => approvalsController.listHistory(req, res).catch(next)
);

// GET /approvals/pending-count — Sidebar badge count
approvalsRouter.get(
  '/pending-count',
  requirePermission('goal:approve'),
  (req, res, next) => approvalsController.pendingCount(req, res).catch(next)
);

// POST /approvals/bulk-approve — Bulk approve with confirmation
approvalsRouter.post(
  '/bulk-approve',
  requirePermission('goal:approve'),
  (req, res, next) => approvalsController.bulkApprove(req, res).catch(next)
);

// POST /approvals/:goalId/approve
approvalsRouter.post(
  '/:goalId/approve',
  requirePermission('goal:approve'),
  (req, res, next) => approvalsController.approve(req, res).catch(next)
);

// POST /approvals/:goalId/reject
approvalsRouter.post(
  '/:goalId/reject',
  requirePermission('goal:reject'),
  (req, res, next) => approvalsController.reject(req, res).catch(next)
);

// POST /approvals/:goalId/request-rework
approvalsRouter.post(
  '/:goalId/request-rework',
  requirePermission('goal:approve'),
  (req, res, next) => approvalsController.rework(req, res).catch(next)
);

// PATCH /approvals/:goalId/edit — Manager inline edit target/weightage
approvalsRouter.patch(
  '/:goalId/edit',
  requirePermission('goal:edit:during-approval'),
  (req, res, next) => approvalsController.edit(req, res).catch(next)
);
