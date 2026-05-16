import { prisma } from '../../common/db/prisma.js';
import type { AuthUser } from '../../common/types/express.js';

export async function listNotifications(user: AuthUser, limit = 20) {
  const notifications = await prisma.notification.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
  
  const unreadCount = await prisma.notification.count({
    where: { user_id: user.id, is_read: false }
  });

  return { notifications, unreadCount };
}

export async function markAsRead(user: AuthUser, id: string) {
  await prisma.notification.updateMany({
    where: { id, user_id: user.id },
    data: { is_read: true }
  });
  return { success: true };
}

export async function markAllAsRead(user: AuthUser) {
  await prisma.notification.updateMany({
    where: { user_id: user.id, is_read: false },
    data: { is_read: true }
  });
  return { success: true };
}

export async function createNotification(userId: string, type: string, title: string, message: string, actionUrl: string) {
  return prisma.notification.create({
    data: {
      user_id: userId,
      type,
      title,
      message,
      action_url: actionUrl,
      is_read: false
    }
  });
}
