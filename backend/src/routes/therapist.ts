import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { TherapistController } from "@/controllers/therapist.controller";

const router = Router();

// Public: list all therapists
router.get("/", TherapistController.list);

// Therapist's own portal data (authenticated)
router.get("/me/stats", requireAuth, TherapistController.myStats);
router.get("/me/bookings", requireAuth, TherapistController.myBookings);
router.patch("/me/availability", requireAuth, TherapistController.updateAvailability);

export default router;
