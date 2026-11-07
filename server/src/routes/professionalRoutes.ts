import { Router } from 'express';
import {
  getMyProfiles,
  updateMyProfile,
  submitMyProfile,
  uploadMyVerificationDocs,
  getPublicProfiles,
  getPublicProfile,
  createEnquiry,
  getMyEnquiries,
} from '../controllers/professionalController';
import { protect, authorize } from '../middleware/auth';
import { getProfilesForReview, reviewProfile } from '../controllers/professionalController';
import { upload } from '../config/cloudinary';

const router = Router();

router.get('/', getPublicProfiles);
router.get('/mine', protect, authorize('professional'), getMyProfiles);
router.get('/enquiries/mine', protect, authorize('professional'), getMyEnquiries);
router.put('/mine/:id', protect, authorize('professional'), updateMyProfile);
router.post('/mine/:id/submit', protect, authorize('professional'), submitMyProfile);
router.post('/mine/:id/documents', protect, authorize('professional'), upload.array('documents', 5), uploadMyVerificationDocs);
router.post('/:id/enquiries', protect, createEnquiry);
router.get('/admin/review', protect, authorize('admin'), getProfilesForReview);
router.put('/admin/:id/review', protect, authorize('admin'), reviewProfile);
router.get('/:id', getPublicProfile);

export default router;
