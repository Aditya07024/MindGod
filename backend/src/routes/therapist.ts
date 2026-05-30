import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { requireSubscription } from "@/middleware/subscription";
import { TherapistController } from "@/controllers/therapist.controller";
import { ReportController } from "@/controllers/report.controller";

const router = Router();

// Public: list all therapists with search & filters
router.get("/", TherapistController.list);

// Public: get single therapist details
router.get("/:id", TherapistController.getDetail);

// Public: check therapist's available slots
router.get("/:id/availability", TherapistController.getAvailability);

// Therapist's own portal data (authenticated)
router.get("/me/stats", requireAuth, requireSubscription, TherapistController.myStats);
router.get("/me/bookings", requireAuth, requireSubscription, TherapistController.myBookings);
router.patch(
  "/me/availability",
  requireAuth,
  requireSubscription,
  TherapistController.updateAvailability,
);
router.patch(
  "/me/profile",
  requireAuth,
  requireSubscription,
  TherapistController.updateProfile,
);

router.get("/me/invitations", requireAuth, TherapistController.listInvitations);
router.patch("/me/invitations/:id/respond", requireAuth, TherapistController.respondToInvitation);

// Shared Reports
router.get(
  "/me/shared-reports",
  requireAuth,
  requireSubscription,
  ReportController.getTherapistSharedReports,
);
router.get(
  "/me/shared-reports/:id",
  requireAuth,
  requireSubscription,
  ReportController.getTherapistSharedReportDetail,
);

export default router;
