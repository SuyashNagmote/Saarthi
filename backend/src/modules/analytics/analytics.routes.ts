import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import * as analyticsController from './analytics.controller.js';

export const analyticsRouter = Router();

analyticsRouter.use(jwtGuard);

analyticsRouter.get('/qoq', analyticsController.getQoqTrend);
analyticsRouter.get('/heatmap', analyticsController.getHeatmap);
analyticsRouter.get('/distribution', analyticsController.getDistribution);
