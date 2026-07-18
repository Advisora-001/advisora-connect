import { Router } from 'express';
import {
  getPendingVerifications,
  verifyLawyer,
  getUsers,
  toggleUserStatus,
  getAnalytics,
  getLawyerProfile,
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/lawyers/pending', getPendingVerifications);
router.put('/lawyers/:id/verify', verifyLawyer);
router.get('/lawyers/:id', getLawyerProfile);
router.get('/users', getUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/analytics', getAnalytics);

export default router;