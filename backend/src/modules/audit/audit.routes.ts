import { Router } from 'express';
import { jwtGuard } from '../../common/guards/jwt.guard.js';
import { requirePermission } from '../../common/guards/roles.guard.js';
import { prisma } from '../../common/db/prisma.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { sendError } from '../../common/utils/api-response.js';

export const auditRouter = Router();

auditRouter.use(jwtGuard);

auditRouter.get('/', requirePermission('audit:read'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const entity_type = req.query.entity_type as string | undefined;
    const action = req.query.action as string | undefined;

    const where = {
      ...(entity_type ? { entity_type } : {}),
      ...(action ? { action } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          changer: {
            select: { id: true, name: true, email: true, role: true, department: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const parsedLogs = logs.map(log => ({
      ...log,
      old_value: log.old_value ? JSON.parse(log.old_value) : null,
      new_value: log.new_value ? JSON.parse(log.new_value) : null,
      diff: log.diff ? JSON.parse(log.diff) : null,
    }));

    return sendSuccess(res, { logs: parsedLogs }, undefined, 200, { page, limit, total });
  } catch (e) {
    next(e);
  }
});

auditRouter.get('/:entityType/:entityId', async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const user = req.user!;

    if (entityType === 'Goal') {
      const goal = await prisma.goal.findUnique({ where: { id: entityId } });
      if (!goal) return sendError(res, 'NOT_FOUND', 'Goal not found', 404);
      if (user.role === 'EMPLOYEE' && goal.employee_id !== user.id) {
        return sendError(res, 'FORBIDDEN', 'Access denied', 403);
      }
    } else if (user.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    const timeline = await prisma.auditLog.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      include: {
        changer: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    const parsedTimeline = timeline.map(log => ({
      ...log,
      old_value: log.old_value ? JSON.parse(log.old_value) : null,
      new_value: log.new_value ? JSON.parse(log.new_value) : null,
      diff: log.diff ? JSON.parse(log.diff) : null,
    }));

    return sendSuccess(res, { timeline: parsedTimeline });
  } catch (e) {
    next(e);
  }
});
