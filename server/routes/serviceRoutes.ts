import { Router } from 'express';
import {
  getServices,
  createService,
  updateService,
  deleteService
} from '../controllers/serviceController';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', getServices);
router.post('/', protect, authorizeRoles('ADMIN'), createService);
router.put('/:id', protect, authorizeRoles('ADMIN'), updateService);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteService);

export default router;
