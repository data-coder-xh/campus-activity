import { Router } from 'express';
import { createRegistration, listRegistrations, updateRegistrationStatus } from '../controllers/registrationsController.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, listRegistrations);
router.post('/', requireAuth, createRegistration);
router.patch('/:id/status', requireAuth, requireAdmin, updateRegistrationStatus);

export default router;

