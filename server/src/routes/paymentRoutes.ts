import { Router } from 'express';
import { initializePayment, verifyPayment, handleWebhook } from '../controllers/paymentController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/initialize', protect, initializePayment);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', handleWebhook);

export default router;