import type { Request, Response } from 'express';
import * as service from './notifications.service.js';
import { sendSuccess, sendError } from '../../common/utils/api-response.js';

export async function list(req: Request, res: Response) {
  try {
    const data = await service.listNotifications(req.user!);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, 'INTERNAL_ERROR', 'Failed to fetch notifications', 500);
  }
}

export async function markRead(req: Request, res: Response) {
  try {
    await service.markAsRead(req.user!, req.params.id as string);
    return sendSuccess(res, { read: true });
  } catch (err) {
    return sendError(res, 'INTERNAL_ERROR', 'Failed to mark notification', 500);
  }
}

export async function markAllRead(req: Request, res: Response) {
  try {
    await service.markAllAsRead(req.user!);
    return sendSuccess(res, { readAll: true });
  } catch (err) {
    return sendError(res, 'INTERNAL_ERROR', 'Failed to mark all notifications', 500);
  }
}

export async function stream(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Immediate send
  const initial = await service.listNotifications(req.user!, 10);
  sendEvent(initial);

  // Poll DB every 30s as a fallback SSE mechanism
  const interval = setInterval(async () => {
    try {
      const data = await service.listNotifications(req.user!, 10);
      sendEvent(data);
    } catch {
      // ignore
    }
  }, 30000);

  req.on('close', () => clearInterval(interval));
}
