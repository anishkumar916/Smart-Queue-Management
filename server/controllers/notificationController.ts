import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/notificationService';

export async function getMyNotifications(req: AuthRequest, res: Response) {
  try {
    const list = await getUserNotifications(req.user._id);
    return res.json({ success: true, notifications: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await markNotificationAsRead(id, req.user._id);
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function markAllRead(req: AuthRequest, res: Response) {
  try {
    await markAllNotificationsAsRead(req.user._id);
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
