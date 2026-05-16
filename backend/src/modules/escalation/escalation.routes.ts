import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import * as escalationController from './escalation.controller.js';

export const escalationRouter = Router();

escalationRouter.use(jwtGuard);

// POST /api/v1/escalation/run — manual trigger (ADMIN only)
escalationRouter.post('/run', escalationController.triggerEscalation);
