import { Router } from 'express';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
} from '../controllers/branchController';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', getBranches);
router.get('/:id', getBranchById);
router.post('/', protect, authorizeRoles('ADMIN'), createBranch);
router.put('/:id', protect, authorizeRoles('ADMIN'), updateBranch);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteBranch);

export default router;
