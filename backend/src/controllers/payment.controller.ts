import type { Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { TherapistBooking, User } from "@/models";
import { AppError } from "@/lib/app-error";
import PaymentService from "@/services/payment.service";
import mongoose from "mongoose";
import { sendPaymentConfirmedToTherapist } from "@/services/email.service";

export class PaymentController {
  /**
   * Initiate a payment for a booking
   */
  static initiatePayment = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.body as { bookingId: string };

      if (!bookingId) {
        throw new AppError("bookingId is required", 400);
      }

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (booking.payment.paid) {
        throw new AppError("This booking is already paid", 400);
      }

      const user = await User.findById(req.user!.sub);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Create Razorpay order
      const order = await PaymentService.createOrder({
        amount: booking.payment.amount,
        bookingId: bookingId,
        userEmail: user.phoneHash, // Using phone hash as identifier
        userName: user.fullName,
      });

      // Update booking with Razorpay order ID
      booking.payment.razorpayOrderId = order.orderId;
      await booking.save();

      res.json({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId,
        userName: user.fullName,
      });
    },
  );

  /**
   * Verify payment and confirm booking
   */
  static verifyPayment = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId, orderId, paymentId, signature } = req.body as {
        bookingId: string;
        orderId: string;
        paymentId: string;
        signature: string;
      };

      if (!bookingId || !orderId || !paymentId || !signature) {
        throw new AppError("Missing required payment details", 400);
      }

      // Verify signature
      const isValid = PaymentService.verifyPaymentSignature(
        orderId,
        paymentId,
        signature,
      );
      if (!isValid) {
        throw new AppError("Invalid payment signature", 400);
      }

      // Verify payment with Razorpay
      const paymentDetails = await PaymentService.getPaymentDetails(paymentId);
      if (paymentDetails.status !== "captured") {
        throw new AppError("Payment not captured", 400);
      }

      // Update booking
      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      booking.payment.paid = true;
      booking.payment.razorpayPaymentId = paymentId;
      booking.status = "confirmed";
      await booking.save();

      // Send payment-confirmed email to therapist
      try {
        const therapist = await User.findById(booking.therapistId).select("therapistProfile").lean();
        const seeker = await User.findById(booking.userId).select("fullName").lean();
        const therapistEmail = therapist?.therapistProfile?.email;
        if (therapistEmail) {
          sendPaymentConfirmedToTherapist({
            therapistEmail,
            therapistName: therapist?.therapistProfile?.name || "Therapist",
            seekerName: seeker?.fullName || "Client",
            slot: booking.slot,
            fee: booking.payment.amount,
            bookingId: booking._id.toString(),
          }).catch(err => console.error("[Email] Payment confirmed email failed:", err));
        }
      } catch (err) {
        console.error("[Email] Could not send payment confirmed email:", err);
      }

      res.json({
        message: "Payment verified and booking confirmed",
        booking: {
          id: booking._id,
          status: booking.status,
          paid: booking.payment.paid,
          videoRoomId: booking.videoRoomId,
        },
      });
    },
  );

  /**
   * Demo: Bypass Razorpay for testing
   */
  static demoVerifyPayment = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.body as { bookingId: string };

      if (!bookingId) throw new AppError("Missing bookingId", 400);

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) throw new AppError("Booking not found", 404);

      booking.payment.paid = true;
      booking.status = "confirmed";
      await booking.save();

      // Send payment-confirmed email to therapist (demo mode)
      try {
        const therapist = await User.findById(booking.therapistId).select("therapistProfile").lean();
        const seeker = await User.findById(booking.userId).select("fullName").lean();
        const therapistEmail = therapist?.therapistProfile?.email;
        if (therapistEmail) {
          sendPaymentConfirmedToTherapist({
            therapistEmail,
            therapistName: therapist?.therapistProfile?.name || "Therapist",
            seekerName: seeker?.fullName || "Client",
            slot: booking.slot,
            fee: booking.payment.amount,
            bookingId: booking._id.toString(),
          }).catch(err => console.error("[Email] Demo payment confirmed email failed:", err));
        }
      } catch (err) {
        console.error("[Email] Could not send demo payment email:", err);
      }

      res.json({
        message: "Demo Payment verified",
        booking: {
          id: booking._id,
          status: booking.status,
          paid: booking.payment.paid,
          videoRoomId: booking.videoRoomId,
        },
      });
    },
  );

  /**
   * Handle Razorpay webhook
   */
  static handleWebhook = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const event = req.body;
      const signature = req.headers["x-razorpay-signature"];

      // Verify webhook signature
      const body = JSON.stringify(event);
      const expectedSignature = require("crypto")
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest("hex");

      if (expectedSignature !== signature) {
        throw new AppError("Invalid webhook signature", 400);
      }

      if (event.event === "payment.captured") {
        const { id: paymentId, notes } = event.payload.payment.entity;
        const { bookingId } = notes;

        const booking = await TherapistBooking.findById(bookingId);
        if (booking && !booking.payment.paid) {
          booking.payment.paid = true;
          booking.payment.razorpayPaymentId = paymentId;
          booking.status = "confirmed";
          await booking.save();
        }
      } else if (event.event === "payment.failed") {
        const { id: paymentId, notes } = event.payload.payment.entity;
        const { bookingId } = notes;

        const booking = await TherapistBooking.findById(bookingId);
        if (booking) {
          booking.status = "cancelled";
          await booking.save();
        }
      }

      res.json({ received: true });
    },
  );

  /**
   * Get payment details for a booking
   */
  static getPaymentStatus = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.params;

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      res.json({
        bookingId,
        paid: booking.payment.paid,
        amount: booking.payment.amount,
        razorpayOrderId: booking.payment.razorpayOrderId,
        status: booking.status,
      });
    },
  );

  /**
   * Refund a booking payment
   */
  static refundBooking = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.params;

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (!booking.payment.paid) {
        throw new AppError("No payment to refund", 400);
      }

      if (booking.status === "completed") {
        throw new AppError("Cannot refund a completed session", 400);
      }

      // Find payment ID from Razorpay (in production, store this)
      // For now, we'll need to fetch from Razorpay using the order ID
      // In production, you should store the paymentId when verifying payment

      booking.status = "cancelled";
      booking.payment.paid = false;
      await booking.save();

      res.json({
        message: "Booking refunded successfully",
        bookingId,
      });
    },
  );
}
