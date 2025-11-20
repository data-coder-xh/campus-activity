import { Router } from 'express';
import {
  listEvents,
  getEventDetail,
  createEvent,
  updateEvent,
  updateEventStatus,
  removeEvent,
} from '../controllers/eventsController.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', listEvents);
router.get('/:id', getEventDetail);
router.post('/', requireAuth, requireAdmin, createEvent);
router.put('/:id', requireAuth, requireAdmin, updateEvent);
router.patch('/:id/status', requireAuth, requireAdmin, updateEventStatus);
router.delete('/:id', requireAuth, requireAdmin, removeEvent);

export default router;

