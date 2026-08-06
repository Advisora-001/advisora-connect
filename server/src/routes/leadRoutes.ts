import { Router } from 'express';
import { createBookingRequest, createLead, respondToLead, getLeads, bookConsultation, getMyEnquiries } from '../controllers/leadController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.post('/book-request', protect, authorize('client'), createBookingRequest);
router.post('/', protect, authorize('client'), createLead);
router.put('/:id/respond', protect, authorize('lawyer'), respondToLead);
router.post('/:id/book', protect, authorize('client'), bookConsultation);
router.get('/', protect, authorize('lawyer'), getLeads);
router.get('/my-enquiries', protect, authorize('client'), getMyEnquiries);

export default router;
