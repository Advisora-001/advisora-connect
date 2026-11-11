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
  getMySentEnquiries,
  createServiceEngagement,
  getMyServiceEngagements,
  updateServiceEngagementStatus,
} from '../controllers/professionalController';
import { protect, authorize } from '../middleware/auth';
import { getProfilesForReview, reviewProfile } from '../controllers/professionalController';
import { upload } from '../config/cloudinary';

const router = Router();

router.get('/', getPublicProfiles);
router.get('/mine', protect, authorize('professional', 'lawyer'), getMyProfiles);
router.get('/enquiries/mine', protect, authorize('professional', 'lawyer'), getMyEnquiries);
router.get('/enquiries/sent', protect, authorize('client'), getMySentEnquiries);
router.get('/engagements/mine', protect, authorize('professional', 'lawyer', 'client'), getMyServiceEngagements);
router.post('/enquiries/:id/engagements', protect, authorize('professional', 'lawyer'), createServiceEngagement);
router.put('/engagements/:id/status', protect, authorize('professional', 'lawyer', 'client'), updateServiceEngagementStatus);
router.put('/mine/:id', protect, authorize('professional', 'lawyer'), updateMyProfile);
router.post('/mine/:id/submit', protect, authorize('professional', 'lawyer'), submitMyProfile);
router.post('/mine/:id/documents', protect, authorize('professional', 'lawyer'), upload.array('documents', 5), uploadMyVerificationDocs);
router.post('/:id/enquiries', protect, createEnquiry);
router.get('/admin/review', protect, authorize('admin'), getProfilesForReview);
router.put('/admin/:id/review', protect, authorize('admin'), reviewProfile);
router.get('/:id', getPublicProfile);

export default router;
