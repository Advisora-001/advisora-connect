import { Router } from 'express';
import { getLawyers, getLawyerById, updateProfile, submitVerification, getLawyersList, uploadVerificationDocs, acceptOnboardingAgreement, submitDeclaration, uploadPhoto, getAvailability, getWallet, requestPayout } from '../controllers/lawyerController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../config/cloudinary';

const router = Router();

router.get('/', getLawyers);
router.get('/list', getLawyersList);
router.get('/:id/availability', protect, getAvailability);
router.get('/:id', protect, getLawyerById);
router.put('/profile', protect, authorize('lawyer'), updateProfile);
router.post('/verify', protect, authorize('lawyer'), submitVerification);
router.post('/verify-upload', protect, authorize('lawyer'), upload.array('documents', 5), uploadVerificationDocs);
router.post('/onboarding/accept', protect, authorize('lawyer'), acceptOnboardingAgreement);
router.post('/declaration', protect, authorize('lawyer'), submitDeclaration);
router.post('/upload-photo', protect, authorize('lawyer'), upload.single('photo'), uploadPhoto);
router.get('/wallet', protect, authorize('lawyer'), getWallet);
router.post('/wallet/payout-request', protect, authorize('lawyer'), requestPayout);

export default router;
