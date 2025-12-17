import { Router } from 'express';
import {
  listEvents,
  getEventDetail,
  createEvent,
  updateEvent,
  updateEventStatus,
  removeEvent,
  reviewEvent,
} from '../controllers/eventsController.js';
import { requireAuth, requireOrganizer, requireReviewer, requireOrganizerOrReviewer } from '../middlewares/auth.js';

const router = Router();

router.get('/', listEvents);
router.get('/:id', getEventDetail);
router.post('/', requireAuth, requireOrganizer, createEvent);
router.put('/:id', requireAuth, requireOrganizerOrReviewer, updateEvent);
router.patch('/:id/status', requireAuth, requireOrganizerOrReviewer, updateEventStatus);
router.patch('/:id/review', requireAuth, requireReviewer, reviewEvent);
router.delete('/:id', requireAuth, requireOrganizerOrReviewer, removeEvent);

export default router;

