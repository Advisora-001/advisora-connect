import { Router } from 'express';
import {
  getActiveDocuments,
  getDocumentBySlug,
  acceptDocument,
  getMyAcceptances,
  getAcceptanceStatus,
  createDocument,
  updateDocument,
  getAllDocuments,
  getAcceptanceStats,
} from '../controllers/legalController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getActiveDocuments);
router.get('/:slug', getDocumentBySlug);

// Authenticated routes
router.post('/:slug/accept', protect, acceptDocument);
router.get('/acceptances/mine', protect, getMyAcceptances);
router.get('/acceptances/status', protect, getAcceptanceStatus);

// Admin routes
router.post('/admin', protect, authorize('admin'), createDocument);
router.put('/admin/:id', protect, authorize('admin'), updateDocument);
router.get('/admin', protect, authorize('admin'), getAllDocuments);
router.get('/admin/acceptance-stats', protect, authorize('admin'), getAcceptanceStats);

export default router;