import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { roleHasPermission } from '../constants/permissions.js';
import { sendError } from '../utils/api-response.js';

export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!roleHasPermission(req.user.role, permission)) {
      return sendError(
        res,
        'FORBIDDEN',
        `Missing permission: ${permission}`,
        403
      );
    }

    if (
      permission.startsWith('goal:approve') ||
      permission === 'dashboard:manager' ||
      permission === 'report:team'
    ) {
      const reportCount = await prisma.user.count({
        where: { manager_id: req.user.id, is_active: true },
      });
      if (req.user.role === 'MANAGER' && reportCount === 0) {
        return sendError(
          res,
          'FORBIDDEN',
          'Manager must have at least one direct report',
          403
        );
      }
    }

    next();
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'Insufficient role', 403);
    }
    next();
  };
}
