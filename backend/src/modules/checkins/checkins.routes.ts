import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import { requirePermission } from '../../common/guards/roles.guard.js';
import * as ctrl from './checkins.controller.js';

export const checkinsRouter = Router();

checkinsRouter.use(jwtGuard);

// GET /checkins/window-status — public to all auth users
checkinsRouter.get(
  '/window-status',
  (req, res, next) => ctrl.windowStatus(req, res).catch(next)
);

// GET /checkins/completion-status — Manager only
checkinsRouter.get(
  '/completion-status',
  requirePermission('checkin:comment'),
  (req, res, next) => ctrl.completionStatus(req, res).catch(next)
);

// GET /checkins — Employee own; Manager team
checkinsRouter.get(
  '/',
  requirePermission('checkin:read:own'),
  (req, res, next) => ctrl.list(req, res).catch(next)
);

// POST /checkins — Employee, window must be open
checkinsRouter.post(
  '/',
  requirePermission('checkin:create'),
  (req, res, next) => ctrl.create(req, res).catch(next)
);

// PATCH /checkins/:id — Employee update
checkinsRouter.patch(
  '/:id',
  requirePermission('checkin:create'),
  (req, res, next) => ctrl.update(req, res).catch(next)
);

// POST /checkins/:id/comment — Manager
checkinsRouter.post(
  '/:id/comment',
  requirePermission('checkin:comment'),
  (req, res, next) => ctrl.comment(req, res).catch(next)
);
