import { Router } from 'express';
import {
  getPlans,
  getAdminMembershipConfig,
  savePlan,
  saveFeePolicy,
} from '../controllers/membershipController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/plans', getPlans);
router.get('/admin/config', protect, authorize('admin'), getAdminMembershipConfig);
router.put('/admin/plans/:key', protect, authorize('admin'), savePlan);
router.put('/admin/fee-policies/:transactionType', protect, authorize('admin'), saveFeePolicy);

export default router;
