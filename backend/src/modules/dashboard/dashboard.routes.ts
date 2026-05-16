import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import { requirePermission } from '../../common/guards/roles.guard.js';
import * as ctrl from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.use(jwtGuard);

dashboardRouter.get(
  '/employee',
  requirePermission('dashboard:employee'),
  (req, res, next) => ctrl.employeeDashboard(req, res).catch(next)
);

dashboardRouter.get(
  '/manager',
  requirePermission('dashboard:manager'),
  (req, res, next) => ctrl.managerDashboard(req, res).catch(next)
);

dashboardRouter.get(
  '/admin',
  requirePermission('user:manage'), // Used as admin check proxy
  (req, res, next) => ctrl.adminDashboard(req, res).catch(next)
);
