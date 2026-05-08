import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { PaymentController } from "@/controllers/payment.controller";

const router = Router();

// All payment routes require authentication
router.use(requireAuth);

// POST /api/payment/initiate - Initiate a payment
router.post("/initiate", PaymentController.initiatePayment);

// POST /api/payment/verify - Verify payment and confirm booking
router.post("/verify", PaymentController.verifyPayment);

// POST /api/payment/demo-verify - Demo bypass
router.post("/demo-verify", PaymentController.demoVerifyPayment);

// GET /api/payment/:bookingId - Get payment status
router.get("/:bookingId", PaymentController.getPaymentStatus);

// POST /api/payment/:bookingId/refund - Refund a booking
router.post("/:bookingId/refund", PaymentController.refundBooking);

// POST /api/payment/webhook - Razorpay webhook (no auth required)
router.post("/webhook", (req, res, next) => {
  // Verify webhook and process
  PaymentController.handleWebhook(req, res);
});

export default router;
