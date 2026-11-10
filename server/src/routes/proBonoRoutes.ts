import { Router } from 'express';
import {
  submitProBonoApplication,
  submitProBonoVolunteer,
  getProBonoApplications,
  getProBonoVolunteers,
  updateProBonoApplicationStatus,
  updateProBonoVolunteerStatus,
} from '../controllers/proBonoController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.post('/applications', submitProBonoApplication);
router.post('/volunteers', submitProBonoVolunteer);
router.get('/applications', protect, authorize('admin'), getProBonoApplications);
router.get('/volunteers', protect, authorize('admin'), getProBonoVolunteers);
router.put('/applications/:id/status', protect, authorize('admin'), updateProBonoApplicationStatus);
router.put('/volunteers/:id/status', protect, authorize('admin'), updateProBonoVolunteerStatus);

export default router;
