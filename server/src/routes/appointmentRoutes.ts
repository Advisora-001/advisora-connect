import { Router } from 'express';
import { getMyAppointments, getLawyerAppointments, cancelAppointment, generateMeetingLink, setMeetingLink, completeAppointment } from '../controllers/appointmentController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/my-appointments', protect, authorize('client'), getMyAppointments);
router.get('/lawyer-appointments', protect, authorize('lawyer'), getLawyerAppointments);
router.put('/:id/cancel', protect, cancelAppointment);
router.post('/:id/generate-meeting', protect, authorize('lawyer'), generateMeetingLink);
router.put('/:id/meeting-link', protect, authorize('lawyer'), setMeetingLink);
router.put('/:id/complete', protect, authorize('lawyer'), completeAppointment);

export default router;
