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
} from '../controllers/fractionalController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Client routes
router.post('/request', requestFractionalGC);
router.get('/proposals', getClientFractionalProposals);
router.get('/proposals/:id', getFractionalProposal);
router.post('/proposals/:id/accept', acceptFractionalProposal);
router.post('/proposals/:id/reject', rejectFractionalProposal);

// Lawyer routes
router.get('/requests', authorize('lawyer', 'professional'), getFractionalRequests);
router.post('/proposals', authorize('lawyer', 'professional'), createFractionalProposal);
router.get('/my-proposals', authorize('lawyer', 'professional'), getLawyerFractionalProposals);

export default router;