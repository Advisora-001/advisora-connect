import { Router } from 'express';
import { acceptFirmInvitation, createFirm, getMyFirms, inviteFirmMember, removeFirmMember } from '../controllers/firmController';
import { authorize, protect } from '../middleware/auth';

const router = Router();
router.use(protect, authorize('lawyer', 'professional'));
router.get('/mine', getMyFirms);
router.post('/', createFirm);
router.post('/invitations/accept', acceptFirmInvitation);
router.post('/:firmId/members', inviteFirmMember);
router.delete('/:firmId/members/:memberId', removeFirmMember);

export default router;
