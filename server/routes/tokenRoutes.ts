import { Router } from 'express';
import { joinQueue, getMyTokens, getTokenById, trackPublicToken, cancelToken } from '../controllers/tokenController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Public token tracker (no login required!)
router.get('/track/:tokenNumber', trackPublicToken);

// Customer protected routes
router.post('/', protect, joinQueue);
router.get('/my', protect, getMyTokens);
router.get('/:id', protect, getTokenById);
router.delete('/:id', protect, cancelToken);

export default router;
