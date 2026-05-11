import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth";
import { SubscriptionController } from "@/controllers/subscription.controller";

const router = Router();

// User routes
router.get("/", requireAuth, SubscriptionController.getMySubscription);
router.post("/upgrade", requireAuth, SubscriptionController.upgradeSubscription);
router.post("/cancel", requireAuth, SubscriptionController.cancelSubscription);
router.post("/demo-activate", requireAuth, SubscriptionController.demoActivate);

// Razorpay webhook (no auth — verified by signature)
router.post("/webhook", SubscriptionController.webhook);

// Super admin
router.get(
  "/admin/all",
  requireAuth,
  requireRole(["super_admin"]),
  SubscriptionController.adminListAll,
);

export default router;
