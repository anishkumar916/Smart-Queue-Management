import { Router } from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllRead
} from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getMyNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllRead);

export default router;
