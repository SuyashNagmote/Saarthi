import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import type { AuthUser } from '../types/express.js';
import { sendError } from '../utils/api-response.js';

interface AccessPayload {
  sub: string;
  email: string;
  role: AuthUser['role'];
}

export async function jwtGuard(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    token = header.slice(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AccessPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        department: true,
        designation: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      return sendError(res, 'UNAUTHORIZED', 'Account inactive or not found', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
      designation: user.designation,
    };
    next();
  } catch {
    return sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }
}

export function optionalJwtGuard(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  return jwtGuard(req, res, next);
}
