import api from './api';

export interface NotificationItem {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getMyNotifications: async () => {
    return await api.get<{ success: boolean; notifications: NotificationItem[] }>('/api/notifications');
  },

  markAsRead: async (id: string) => {
    return await api.patch(`/api/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return await api.patch('/api/notifications/read-all');
  }
};
