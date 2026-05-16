import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import * as ctrl from './notifications.controller.js';

export const notificationsRouter = Router();

notificationsRouter.use(jwtGuard);

notificationsRouter.get('/', (req, res, next) => ctrl.list(req, res).catch(next));
notificationsRouter.get('/stream', (req, res, next) => ctrl.stream(req, res).catch(next));
notificationsRouter.patch('/read-all', (req, res, next) => ctrl.markAllRead(req, res).catch(next));
notificationsRouter.patch('/:id/read', (req, res, next) => ctrl.markRead(req, res).catch(next));
