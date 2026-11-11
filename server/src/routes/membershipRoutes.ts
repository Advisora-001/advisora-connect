import { Router } from 'express';
import {
  getPublicCategories,
  getPublicCategory,
  getPublicPlans,
  startMembership,
  getMyMembership,
  createFirm,
  getMyFirms,
  inviteFirmMember,
  acceptFirmInvitation,
} from '../controllers/membershipController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/categories', getPublicCategories);
router.get('/categories/:key', getPublicCategory);
router.get('/plans', getPublicPlans);
router.get('/mine', protect, getMyMembership);
router.post('/subscribe', protect, startMembership);
router.get('/firms/mine', protect, getMyFirms);
router.post('/firms', protect, createFirm);
router.post('/firms/:id/invitations', protect, inviteFirmMember);
router.post('/firms/invitations/accept', protect, acceptFirmInvitation);

export default router;
