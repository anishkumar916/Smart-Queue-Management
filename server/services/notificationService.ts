import { NotificationModel, INotification } from '../models/Notification';
import { emitUserNotification } from './socketService';

export async function createNotification(params: {
  userId: string;
  type: 'TOKEN_CREATED' | 'APPROACHING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED' | 'ALERT';
  title: string;
  message: string;
}): Promise<INotification> {
  const notif = await NotificationModel.create({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  emitUserNotification(params.userId, notif);
  return notif;
}

export async function getUserNotifications(userId: string) {
  const list = await NotificationModel.find({ userId });
  // return newest first
  return list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markNotificationAsRead(notifId: string, userId: string) {
  return await NotificationModel.updateOne({ _id: notifId, userId }, { isRead: true });
}

export async function markAllNotificationsAsRead(userId: string) {
  return await NotificationModel.updateMany({ userId }, { isRead: true });
}
