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

router.post('/initiate/:orderId', protect, initiatePayment);
router.post('/success/:orderId', paymentSuccess);
router.post('/fail/:orderId', paymentFail);
router.post('/cancel/:orderId', paymentCancel);
router.post('/ipn', paymentIPN);
router.get('/status/:orderId', protect, getPaymentStatus);

export default router;