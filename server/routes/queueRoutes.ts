import { Router } from 'express';
import {
  getQueueByBranch,
  getQueueStatus,
  getQueuePredictionHandler,
  callNextHandler,
  startServiceHandler,
  completeServiceHandler,
  skipTokenHandler,
  recallTokenHandler,
  scanQRHandler
} from '../controllers/queueController';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

// Public / Display endpoints
router.get('/:branchId', getQueueByBranch);
router.get('/:branchId/status', getQueueStatus);
router.get('/:branchId/prediction', getQueuePredictionHandler);

// Staff / Admin queue controls
router.post('/call-next', protect, authorizeRoles('STAFF', 'ADMIN'), callNextHandler);
router.post('/:tokenId/start', protect, authorizeRoles('STAFF', 'ADMIN'), startServiceHandler);
router.post('/:tokenId/complete', protect, authorizeRoles('STAFF', 'ADMIN'), completeServiceHandler);
router.post('/:tokenId/skip', protect, authorizeRoles('STAFF', 'ADMIN'), skipTokenHandler);
router.post('/:tokenId/recall', protect, authorizeRoles('STAFF', 'ADMIN'), recallTokenHandler);
router.post('/scan-qr', protect, authorizeRoles('STAFF', 'ADMIN'), scanQRHandler);

export default router;
