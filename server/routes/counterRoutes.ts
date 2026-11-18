import { Router } from 'express';
import {
  getCounters,
  createCounter,
  updateCounter,
  toggleCounterActive
} from '../controllers/counterController';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', getCounters);
router.post('/', protect, authorizeRoles('ADMIN'), createCounter);
router.put('/:id', protect, authorizeRoles('ADMIN'), updateCounter);
router.patch('/:id/toggle-active', protect, authorizeRoles('STAFF', 'ADMIN'), toggleCounterActive);

export default router;
