import { Router } from 'express';
import {
  getAdminDashboard,
  getQueueAnalytics,
  getUsers,
  updateUser,
  getQueueSettings,
  updateQueueSettings
} from '../controllers/adminController';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

// Require ADMIN role for admin portal routes
router.use(protect, authorizeRoles('ADMIN'));

router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getQueueAnalytics);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.get('/settings/:branchId', getQueueSettings);
router.put('/settings/:branchId', updateQueueSettings);

export default router;
