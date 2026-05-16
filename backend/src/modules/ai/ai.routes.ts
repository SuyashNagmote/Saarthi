import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import * as aiController from './ai.controller.js';

export const aiRouter = Router();

aiRouter.use(jwtGuard); // Require auth for AI tools

aiRouter.post('/generate-goal', (req, res, next) =>
  aiController.generateGoal(req, res).catch(next)
);

aiRouter.post('/parse-checkin', (req, res, next) =>
  aiController.parseCheckin(req, res).catch(next)
);
