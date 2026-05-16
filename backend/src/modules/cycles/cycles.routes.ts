import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import { prisma } from '../../common/db/prisma.js';
import { sendSuccess } from '../../common/utils/api-response.js';

export const cyclesRouter = Router();

cyclesRouter.use(jwtGuard);

cyclesRouter.get('/', async (_req, res, next) => {
  try {
    const cycles = await prisma.goalCycle.findMany({
      orderBy: { start_date: 'desc' },
    });
    return sendSuccess(res, { cycles });
  } catch (e) {
    next(e);
  }
});

cyclesRouter.get('/active', async (_req, res, next) => {
  try {
    const cycle = await prisma.goalCycle.findFirst({
      where: { is_active: true },
    });
    return sendSuccess(res, { cycle });
  } catch (e) {
    next(e);
  }
});
