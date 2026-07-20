import { Router } from 'express';
import { getLawyers, getLawyerById, updateProfile, submitVerification, getLawyersList, uploadVerificationDocs, acceptOnboardingAgreement, submitDeclaration, uploadPhoto } from '../controllers/lawyerController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../config/cloudinary';

const router = Router();

router.get('/', getLawyers);
router.get('/list', getLawyersList);
router.get('/:id', protect, getLawyerById);
router.put('/profile', protect, authorize('lawyer'), updateProfile);
router.post('/verify', protect, authorize('lawyer'), submitVerification);
router.post('/verify-upload', protect, authorize('lawyer'), upload.array('documents', 5), uploadVerificationDocs);
router.post('/onboarding/accept', protect, authorize('lawyer'), acceptOnboardingAgreement);
router.post('/declaration', protect, authorize('lawyer'), submitDeclaration);
router.post('/upload-photo', protect, authorize('lawyer'), upload.single('photo'), uploadPhoto);

export default router;
