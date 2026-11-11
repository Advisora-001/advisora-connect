import { Router } from 'express';
import {
  getMembershipConfig,
  saveCategory,
  savePlan,
  savePlatformFeePolicy,
} from '../controllers/membershipController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin'));
router.get('/config', getMembershipConfig);
router.put('/categories/:key', (req, res, next) => {
  req.body.key = req.params.key;
  next();
}, saveCategory);
router.post('/categories', saveCategory);
router.put('/plans/:key', (req, res, next) => {
  req.body.key = req.params.key;
  next();
}, savePlan);
router.post('/plans', savePlan);
router.put('/platform-fee', savePlatformFeePolicy);

export default router;
