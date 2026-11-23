import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPlans,
  getCurrentSubscription,
  createSubscriptionCheckout,
  verifySubscription,
  cancelSubscription,
  reactivateSubscription,
  changePlan,
  getSubscriptionUsage,
} from '../controllers/subscriptionController';

const router = Router();

// Public routes
router.get('/plans', getPlans);

// Protected routes
router.use(authenticate);

router.get('/current', getCurrentSubscription);
router.get('/usage', getSubscriptionUsage);
router.post('/checkout', createSubscriptionCheckout);
router.post('/verify', verifySubscription);
router.post('/cancel', cancelSubscription);
router.post('/reactivate', reactivateSubscription);
router.post('/change-plan', changePlan);

export default router;