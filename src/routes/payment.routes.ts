import { Router } from "express";
import {
  createPaymentSession,
  initiatePaymentWithParam,
  confirmPayment,
  getMyPaymentHistory,
  getPaymentDetails,
} from "../controllers/payment.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

// Payment Initialization Routes
router.post("/create", protect, createPaymentSession);
router.post("/initiate/:orderId", protect, initiatePaymentWithParam);

// SSLCommerz Webhook / Confirm Callbacks
router.post("/confirm", confirmPayment);
router.get("/confirm", confirmPayment);

// Payment History
router.get("/", protect, getMyPaymentHistory);

// Single Payment Details & Status Check Endpoints
router.get("/:id", protect, getPaymentDetails);
router.get("/status/:id", protect, getPaymentDetails); // 👈 এটি যুক্ত করা হলো

export default router;