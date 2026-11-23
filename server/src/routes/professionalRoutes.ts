import { Router } from 'express';
import {
  getProfessionals,
  getProfessionalById,
  updateProfile,
  submitVerification,
  uploadVerificationDocs,
  acceptOnboardingAgreement,
  submitDeclaration,
  uploadPhoto,
} from '../controllers/professionalProfileController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getProfessionals);
router.get('/:id', getProfessionalById);

// Protected routes (any authenticated professional)
router.put('/profile', protect, updateProfile);
router.post('/verify', protect, submitVerification);
router.post('/verify-upload', protect, uploadVerificationDocs);
router.post('/onboarding/accept', protect, acceptOnboardingAgreement);
router.post('/declaration', protect, submitDeclaration);
router.post('/upload-photo', protect, uploadPhoto);

export default router;