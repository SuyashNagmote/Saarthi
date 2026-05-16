import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import * as usersController from './users.controller.js';

export const usersRouter = Router();

usersRouter.use(jwtGuard);

usersRouter.get('/', usersController.listUsers);
usersRouter.get('/org-tree', usersController.getOrgTree);
usersRouter.get('/:id', usersController.getUser);
usersRouter.post('/', usersController.createUser);
usersRouter.patch('/:id', usersController.updateUser);
usersRouter.delete('/:id', usersController.deleteUser);
