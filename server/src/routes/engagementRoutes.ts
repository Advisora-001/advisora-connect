import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getLawyerEngagements,
  getClientEngagements,
  getEngagement,
  addHourEntry,
  addMeeting,
  updateEngagementStatus,
  renewEngagement,
  getEngagementStats,
  getAdminEngagements,
  getAdminEngagement,
  updateAdminEngagement,
  checkEngagementExpiry,
  requestRenewalConfirmation,
  confirmRenewal,
  updateAutoRenew,
  getRenewalStatus,
} from '../controllers/engagementController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Lawyer routes
router.get('/my-engagements', authorize('lawyer', 'professional'), getLawyerEngagements);
router.get('/stats', authorize('lawyer', 'professional'), getEngagementStats);
router.post('/:id/hours', authorize('lawyer', 'professional'), addHourEntry);
router.post('/:id/meetings', addMeeting);
router.put('/:id/status', updateEngagementStatus);
router.post('/:id/renew', renewEngagement);

// Renewal flow routes
router.post('/:id/request-renewal', authorize('lawyer', 'professional'), requestRenewalConfirmation);
router.post('/:id/confirm-renewal', confirmRenewal);
router.put('/:id/auto-renew', updateAutoRenew);
router.get('/:id/renewal-status', getRenewalStatus);

// Client routes
router.get('/client-engagements', getClientEngagements);
router.post('/:id/meetings', addMeeting); // Both lawyer and client can add meetings
router.put('/:id/status', updateEngagementStatus); // Both can update status
router.post('/:id/confirm-renewal', confirmRenewal); // Client confirms/declines
router.put('/:id/auto-renew', updateAutoRenew); // Client can toggle auto-renew
router.get('/:id/renewal-status', getRenewalStatus); // Client checks status

// Shared routes
router.get('/:id', getEngagement);

// Admin routes
router.use('/admin', authenticate, authorize('admin'));
router.get('/admin', getAdminEngagements);
router.get('/admin/:id', getAdminEngagement);
router.put('/admin/:id', updateAdminEngagement);
router.post('/check-expiry', checkEngagementExpiry);

export default router;