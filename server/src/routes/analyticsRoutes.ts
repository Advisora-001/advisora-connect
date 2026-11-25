import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getLawyerAnalytics,
  getAdminAnalytics,
  getClientAnalytics,
} from '../controllers/analyticsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Lawyer routes
router.get('/lawyer', authorize('lawyer', 'professional'), getLawyerAnalytics);

// Client routes
router.get('/client', getClientAnalytics);

// Admin routes
router.use('/admin', authenticate, authorize('admin'));
router.get('/admin', getAdminAnalytics);

export default router;