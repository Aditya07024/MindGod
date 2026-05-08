import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { TherapistController } from "@/controllers/therapist.controller";

const router = Router();

// Public: list all therapists with search & filters
router.get("/", TherapistController.list);

// Public: get single therapist details
router.get("/:id", TherapistController.getDetail);

// Public: check therapist's available slots
router.get("/:id/availability", TherapistController.getAvailability);

// Therapist's own portal data (authenticated)
router.get("/me/stats", requireAuth, TherapistController.myStats);
router.get("/me/bookings", requireAuth, TherapistController.myBookings);
router.patch(
  "/me/availability",
  requireAuth,
  TherapistController.updateAvailability,
);
router.patch(
  "/me/profile",
  requireAuth,
  TherapistController.updateProfile,
);

export default router;
