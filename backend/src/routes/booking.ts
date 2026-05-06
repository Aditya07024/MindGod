import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { BookingController } from "@/controllers/booking.controller";

const router = Router();

router.get("/", requireAuth, BookingController.getMyBookings);
router.post("/", requireAuth, BookingController.createBooking);
router.patch("/:bookingId/cancel", requireAuth, BookingController.cancelBooking);

export default router;
