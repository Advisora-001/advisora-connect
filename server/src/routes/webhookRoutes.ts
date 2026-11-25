import { Router } from 'express';
import { handlePaystackWebhook } from '../controllers/webhookController';

const router = Router();

// Paystack webhook endpoint (no auth required - Paystack calls this)
// Note: This must be a raw body parser for signature verification
import express from 'express';
router.post('/paystack', express.raw({ type: 'application/json' }), handlePaystackWebhook);

export default router;