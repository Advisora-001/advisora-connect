import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  requestFractionalGC,
  getFractionalRequests,
  createFractionalProposal,
  getClientFractionalProposals,
  getFractionalProposal,
  acceptFractionalProposal,
  rejectFractionalProposal,
  getLawyerFractionalProposals,
  acceptFractionalProposalWithEmail,
  rejectFractionalProposalWithEmail,
  getAdminFractionalProposals,
  getAdminFractionalProposal,
  updateAdminFractionalProposal,
} from '../controllers/fractionalController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Client routes
router.post('/request', requestFractionalGC);
router.get('/proposals', getClientFractionalProposals);
router.get('/proposals/:id', getFractionalProposal);
router.post('/proposals/:id/accept', acceptFractionalProposal);
router.post('/proposals/:id/accept-with-email', acceptFractionalProposalWithEmail);
router.post('/proposals/:id/reject', rejectFractionalProposal);
router.post('/proposals/:id/reject-with-email', rejectFractionalProposalWithEmail);

// Lawyer routes
router.get('/requests', authorize('lawyer', 'professional'), getFractionalRequests);
router.post('/proposals', authorize('lawyer', 'professional'), createFractionalProposal);
router.get('/my-proposals', authorize('lawyer', 'professional'), getLawyerFractionalProposals);

// Admin routes
router.use('/admin', authenticate, authorize('admin'));
router.get('/admin/proposals', getAdminFractionalProposals);
router.get('/admin/proposals/:id', getAdminFractionalProposal);
router.put('/admin/proposals/:id', updateAdminFractionalProposal);

export default router;