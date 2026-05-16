import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import { requirePermission } from '../../common/guards/roles.guard.js';
import * as goalsController from './goals.controller.js';

export const goalsRouter = Router();

goalsRouter.use(jwtGuard);

goalsRouter.get(
  '/check-title',
  requirePermission('goal:read:own'),
  (req, res, next) => goalsController.checkTitle(req, res).catch(next)
);

goalsRouter.get(
  '/weightage-summary',
  requirePermission('goal:read:own'),
  (req, res, next) => goalsController.weightageSummary(req, res).catch(next)
);

goalsRouter.get(
  '/',
  requirePermission('goal:read:own'),
  (req, res, next) => goalsController.list(req, res).catch(next)
);

goalsRouter.post(
  '/',
  requirePermission('goal:create'),
  (req, res, next) => goalsController.create(req, res).catch(next)
);

goalsRouter.post(
  '/bulk-submit',
  requirePermission('goal:submit'),
  (req, res, next) => goalsController.bulkSubmit(req, res).catch(next)
);

goalsRouter.get(
  '/:id',
  requirePermission('goal:read:own'),
  (req, res, next) => goalsController.getById(req, res).catch(next)
);

goalsRouter.patch(
  '/:id',
  requirePermission('goal:update:draft'),
  (req, res, next) => goalsController.update(req, res).catch(next)
);

goalsRouter.delete(
  '/:id',
  requirePermission('goal:update:draft'),
  (req, res, next) => goalsController.remove(req, res).catch(next)
);

goalsRouter.post(
  '/:id/submit',
  requirePermission('goal:submit'),
  (req, res, next) => goalsController.submit(req, res).catch(next)
);

goalsRouter.post(
  '/:id/unlock',
  requirePermission('goal:unlock'),
  (req, res, next) => goalsController.unlock(req, res).catch(next)
);

goalsRouter.post(
  '/:id/push-shared',
  requirePermission('goal:push-shared'),
  (req, res, next) => goalsController.pushShared(req, res).catch(next)
);
