import express from 'express';
import {
  createPaymentIntent,
  handleStripeWebhook,
  getPaymentMethods,
  getPaymentById,
} from '../controllers/payment.controller.js';
import {
  initiateZarinpalPayment,
  handleZarinpalCallback,
  getZarinpalPaymentStatus,
} from '../controllers/zarinpal.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { csrfExclude } from '../middleware/csrf.middleware.js';

const router = express.Router();

// Webhook and callback endpoints don't need authentication or CSRF protection
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
router.get('/zarinpal/callback', csrfExclude(), handleZarinpalCallback);

// Protected routes
router.use(protect);

// Stripe endpoints
router.post('/create-payment-intent', createPaymentIntent);
router.get('/:id', getPaymentById);

// Zarinpal endpoints
router.post('/zarinpal/pay', initiateZarinpalPayment);
router.get('/zarinpal/status/:orderId', getZarinpalPaymentStatus);

// General payment endpoints
router.get('/methods', getPaymentMethods);

export default router;
