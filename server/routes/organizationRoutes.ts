import { Router } from 'express';
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization
} from '../controllers/organizationController';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', getOrganizations);
router.post('/', protect, authorizeRoles('ADMIN'), createOrganization);
router.put('/:id', protect, authorizeRoles('ADMIN'), updateOrganization);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteOrganization);

export default router;
