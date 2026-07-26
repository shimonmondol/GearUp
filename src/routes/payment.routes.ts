import { Router } from 'express';
import {
  initiatePayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIPN,
  getPaymentStatus
} from '../controllers/payment.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// পেমেন্ট শুরু করা (User Protected)
router.post('/initiate/:orderId', protect, initiatePayment);

// SSLCommerz Callbacks (Public/Form POST)
router.post('/success/:orderId', paymentSuccess);
router.post('/fail/:orderId', paymentFail);
router.post('/cancel/:orderId', paymentCancel);
router.post('/ipn', paymentIPN);

// পেমেন্ট স্ট্যাটাস ট্র্যাক করা (Status Tracking)
router.get('/status/:orderId', protect, getPaymentStatus);

export default router;