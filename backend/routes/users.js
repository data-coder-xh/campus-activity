import { Router } from 'express';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../controllers/usersController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/me', requireAuth, getCurrentUserProfile);
router.put('/me', requireAuth, updateCurrentUserProfile);

export default router;

