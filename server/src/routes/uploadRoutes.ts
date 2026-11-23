import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSignedUploadUrl,
  verifyUpload,
  deleteUpload,
  getVerificationUploadUrls,
  submitVerification,
  getVerificationStatus,
} from '../controllers/uploadController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Signed upload URLs
router.post('/signed-url', getSignedUploadUrl);
router.post('/verify', verifyUpload);
router.delete('/:publicId', deleteUpload);

// Verification-specific routes
router.post('/verification/urls', getVerificationUploadUrls);
router.post('/verification/submit', submitVerification);
router.get('/verification/status', getVerificationStatus);

export default router;