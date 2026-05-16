import type { Request } from 'express';

export function requestMeta(req: Request) {
  return {
    ip: req.ip ?? '0.0.0.0',
    userAgent: req.headers['user-agent'] ?? 'unknown',
  };
}
