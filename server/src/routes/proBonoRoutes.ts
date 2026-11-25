import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  submitProBonoApplication,
  getProBonoApplication,
  registerVolunteerLawyer,
  getAdminProBonoApplications,
  getAdminProBonoApplication,
  updateProBonoApplication,
  getAdminVolunteerLawyers,
  getAdminVolunteerLawyer,
  updateVolunteerLawyer,
  getProBonoStats,
} from '../controllers/proBonoController';

const router = Router();

// Public routes
router.post('/apply', submitProBonoApplication);
router.post('/volunteer', registerVolunteerLawyer);
router.get('/application/:id', getProBonoApplication);

// Admin routes
router.use('/admin', authenticate, authorize('admin'));
router.get('/admin/stats', getProBonoStats);
router.get('/admin/applications', getAdminProBonoApplications);
router.get('/admin/applications/:id', getAdminProBonoApplication);
router.put('/admin/applications/:id', updateProBonoApplication);
router.get('/admin/volunteers', getAdminVolunteerLawyers);
router.get('/admin/volunteers/:id', getAdminVolunteerLawyer);
router.put('/admin/volunteers/:id', updateVolunteerLawyer);

export default router;