import type { Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { User, TherapistBooking } from "@/models";
import { AppError } from "@/lib/app-error";
import mongoose from "mongoose";

export class BookingController {
  static getMyBookings = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const bookings = await TherapistBooking.find({ userId: req.user!.sub })
      .sort({ slot: 1 })
      .lean();

    // Enrich with therapist name
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const therapist = await User.findById(b.therapistId).select("therapistProfile phoneMasked").lean();
        return {
          id: b._id,
          therapistId: b.therapistId,
          therapistName: therapist?.therapistProfile?.name ?? "Therapist",
          therapistSpecialization: therapist?.therapistProfile?.specializations?.[0] ?? "",
          slot: b.slot,
          status: b.status,
          amount: b.payment.amount,
          paid: b.payment.paid,
          videoRoomId: b.videoRoomId
        };
      })
    );

    res.json({ bookings: enriched });
  });

  static createBooking = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { therapistId, slot } = req.body as { therapistId: string; slot: string };

    if (!therapistId || !slot) {
      throw new AppError("therapistId and slot are required", 400);
    }

    const therapist = await User.findById(therapistId);
    if (!therapist || therapist.role !== "therapist" || !therapist.therapistProfile) {
      throw new AppError("Therapist not found", 404);
    }

    const slotDate = new Date(slot);
    if (isNaN(slotDate.getTime())) throw new AppError("Invalid slot date", 400);
    if (slotDate < new Date()) throw new AppError("Cannot book a past slot", 400);

    // Check slot is not already booked
    const conflict = await TherapistBooking.findOne({
      therapistId,
      slot: slotDate,
      status: { $in: ["pending", "confirmed"] }
    });
    if (conflict) throw new AppError("This slot is already booked", 409);

    const booking = await TherapistBooking.create({
      userId: new mongoose.Types.ObjectId(req.user!.sub),
      therapistId: new mongoose.Types.ObjectId(therapistId),
      slot: slotDate,
      status: "confirmed",
      payment: { amount: therapist.therapistProfile.sessionFee ?? 0, paid: false },
      videoRoomId: `room-${Date.now()}`
    });

    res.status(201).json({
      booking: {
        id: booking._id,
        therapistId,
        therapistName: therapist.therapistProfile.name,
        slot: booking.slot,
        status: booking.status,
        amount: booking.payment.amount,
        videoRoomId: booking.videoRoomId
      }
    });
  });

  static cancelBooking = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { bookingId } = req.params;

    const booking = await TherapistBooking.findOne({
      _id: bookingId,
      userId: req.user!.sub
    });

    if (!booking) throw new AppError("Booking not found", 404);
    if (booking.status === "cancelled") throw new AppError("Already cancelled", 400);
    if (booking.status === "completed") throw new AppError("Cannot cancel a completed session", 400);

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully", bookingId });
  });
}
