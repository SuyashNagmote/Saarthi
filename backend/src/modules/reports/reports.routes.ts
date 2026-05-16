import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import { requirePermission } from '../../common/guards/roles.guard.js';
import * as ctrl from './reports.controller.js';

export const reportsRouter = Router();

reportsRouter.use(jwtGuard);

reportsRouter.get(
  '/preview',
  requirePermission('report:org'),
  (req, res, next) => ctrl.previewReport(req, res).catch(next)
);

reportsRouter.get(
  '/export',
  requirePermission('report:org'), // Only Admins
  (req, res, next) => ctrl.exportReport(req, res).catch(next)
);

reportsRouter.get(
  '/audit-export',
  requirePermission('audit:read'),
  (req, res, next) => ctrl.exportAudit(req, res).catch(next)
);
