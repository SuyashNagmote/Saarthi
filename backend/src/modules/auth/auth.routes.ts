import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import * as authController from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', (req, res, next) =>
  authController.login(req, res).catch(next)
);
authRouter.post('/azure', (req, res, next) =>
  authController.azureLogin(req, res).catch(next)
);
authRouter.post('/register', (req, res, next) =>
  authController.register(req, res).catch(next)
);
authRouter.get('/managers', (req, res, next) =>
  authController.getManagers(req, res).catch(next)
);
authRouter.post('/refresh', (req, res, next) =>
  authController.refresh(req, res).catch(next)
);
authRouter.post('/logout', (req, res, next) =>
  authController.logout(req, res).catch(next)
);
authRouter.get('/me', jwtGuard, (req, res, next) =>
  authController.me(req, res).catch(next)
);
authRouter.patch('/change-password', jwtGuard, (req, res, next) =>
  authController.changePassword(req, res).catch(next)
);
