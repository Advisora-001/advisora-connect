import { Router } from 'express';
import { getMyAppointments, getLawyerAppointments } from '../controllers/appointmentController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/my-appointments', protect, authorize('client'), getMyAppointments);
router.get('/lawyer-appointments', protect, authorize('lawyer'), getLawyerAppointments);

export default router;