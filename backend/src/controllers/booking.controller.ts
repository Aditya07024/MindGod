import type { Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { User, TherapistBooking, Mood, JournalEntry } from "@/models";
import { AppError } from "@/lib/app-error";
import LiveKitService from "@/services/livekit.service";
import mongoose from "mongoose";
import { NotificationController } from "./notification.controller";


export class BookingController {
  static getMyBookings = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const bookings = await TherapistBooking.find({ userId: req.user!.sub })
        .sort({ slot: 1 })
        .lean();

      // Enrich with therapist name
      const enriched = await Promise.all(
        bookings.map(async (b) => {
          const therapist = await User.findById(b.therapistId)
            .select("therapistProfile phoneMasked")
            .lean();
          return {
            id: b._id,
            therapistId: b.therapistId,
            therapistName: therapist?.therapistProfile?.name ?? "Therapist",
            therapistSpecialization:
              therapist?.therapistProfile?.specializations?.[0] ?? "",
            slot: b.slot,
            status: b.status,
            amount: b.payment.amount,
            paid: b.payment.paid,
            videoRoomId: b.videoRoomId,
          };
        }),
      );

      res.json({ bookings: enriched });
    },
  );

  static createBooking = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { therapistId, slot } = req.body as {
        therapistId: string;
        slot: string;
      };

      if (!therapistId || !slot) {
        throw new AppError("therapistId and slot are required", 400);
      }

      const therapist = await User.findById(therapistId);
      if (
        !therapist ||
        therapist.role !== "therapist" ||
        !therapist.therapistProfile
      ) {
        throw new AppError("Therapist not found", 404);
      }

      const slotDate = new Date(slot);
      if (isNaN(slotDate.getTime()))
        throw new AppError("Invalid slot date", 400);
      if (slotDate < new Date())
        throw new AppError("Cannot book a past slot", 400);

      // Check slot is not already booked
      const conflict = await TherapistBooking.findOne({
        therapistId,
        slot: slotDate,
        status: { $in: ["pending", "confirmed"] },
      });
      if (conflict) throw new AppError("This slot is already booked", 409);

      const booking = await TherapistBooking.create({
        userId: new mongoose.Types.ObjectId(req.user!.sub),
        therapistId: new mongoose.Types.ObjectId(therapistId),
        slot: slotDate,
        status: "pending",
        payment: {
          amount: therapist.therapistProfile.sessionFee ?? 0,
          paid: false,
        },
        videoRoomId: `room-${Date.now()}`,
      });

      // Send live notifications
      try {
        const seekerName = (await User.findById(req.user!.sub).select("fullName"))?.fullName || "A Seeker";
        const formattedSlot = slotDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        // Seeker confirmation notification
        await NotificationController.createNotification(
          req.user!.sub,
          "Booking Reserved",
          `Your appointment with Dr. ${therapist.therapistProfile.name} is reserved for ${formattedSlot}.`,
          "booking",
          { bookingId: booking._id.toString(), therapistId }
        );

        // Therapist notification alert
        await NotificationController.createNotification(
          therapistId,
          "New Session Booked",
          `${seekerName} has booked a counseling session with you for ${formattedSlot}.`,
          "booking",
          { bookingId: booking._id.toString(), seekerId: req.user!.sub }
        );
      } catch (err) {
        console.error("[Notifications] Failed sending booking alerts:", err);
      }

      res.status(201).json({
        booking: {
          id: booking._id,
          therapistId,
          therapistName: therapist.therapistProfile.name,
          slot: booking.slot,
          status: booking.status,
          amount: booking.payment.amount,
          videoRoomId: booking.videoRoomId,
        },
      });
    },
  );

  static cancelBooking = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.params;

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) throw new AppError("Booking not found", 404);
      if (booking.status === "cancelled")
        throw new AppError("Already cancelled", 400);
      if (booking.status === "completed")
        throw new AppError("Cannot cancel a completed session", 400);

      booking.status = "cancelled";
      await booking.save();

      // Send live cancellation notifications
      try {
        const seekerName = (await User.findById(req.user!.sub).select("fullName"))?.fullName || "A Seeker";
        const formattedSlot = new Date(booking.slot).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        // Notify Therapist of cancellation
        await NotificationController.createNotification(
          booking.therapistId.toString(),
          "Session Cancelled",
          `${seekerName} has cancelled the session booked for ${formattedSlot}.`,
          "booking",
          { bookingId: booking._id.toString(), seekerId: req.user!.sub }
        );
      } catch (err) {
        console.error("[Notifications] Failed sending cancellation alert:", err);
      }

      res.json({ message: "Booking cancelled successfully", bookingId });
    },
  );

  /** GET /bookings/:bookingId/video-token — Get LiveKit token for video session */
  static getVideoToken = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.params;

      if (bookingId === "demo-room") {
        const user = await User.findById(req.user!.sub).select("fullName");
        if (!user) throw new AppError("User not found", 404);

        const token = await LiveKitService.generateToken({
          roomName: "demo-room",
          userName: user.fullName || "Demo User",
          userId: `demo-${req.user!.sub}-${Math.random().toString(36).substring(7)}`,
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          duration: 7200, // 2 hours
        });

        return res.json({
          token,
          url: LiveKitService.getLiveKitURL(),
          roomName: "demo-room",
        });
      }

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        $or: [{ userId: req.user!.sub }, { therapistId: req.user!.sub }],
      });

      if (!booking)
        throw new AppError("Booking not found or not authorized", 404);
      if (booking.status !== "confirmed") {
        throw new AppError(
          "Booking must be confirmed to start video session",
          400,
        );
      }

      const user = await User.findById(req.user!.sub).select("fullName");
      if (!user) throw new AppError("User not found", 404);

      if (!LiveKitService.isConfigured()) {
        throw new AppError("Video service not configured", 500);
      }

      // Check if session is within 15 minutes and not more than 2 hours after slot time
      const now = new Date().getTime();
      const slotTime = booking.slot.getTime();
      const timeDiff = now - slotTime;
      const fifteenMinutesMs = 15 * 60 * 1000;
      const twoHoursMs = 2 * 60 * 60 * 1000;

      if (timeDiff < -fifteenMinutesMs) {
        throw new AppError("Session starts in more than 15 minutes", 400);
      }

      if (timeDiff > twoHoursMs) {
        throw new AppError("Session time has expired", 400);
      }

      try {
        const token = await LiveKitService.generateToken({
          roomName: booking.videoRoomId!,
          userName: user.fullName || "User",
          userId: req.user!.sub,
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          duration: 7200, // 2 hours
        });

        res.json({
          token,
          url: LiveKitService.getLiveKitURL(),
          roomName: booking.videoRoomId,
        });
      } catch (error) {
        throw new AppError("Failed to generate video token", 500);
      }
    },
  );

  /** GET /bookings/:bookingId — Get single booking details */
  static getSingleBooking = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.params;

      if (bookingId === "demo-room") {
        return res.json({
          id: "demo-room",
          therapistId: "demo-therapist",
          therapistName: "Demo User",
          slot: new Date().toISOString(),
          status: "confirmed",
          amount: 0,
          paid: true,
          videoRoomId: "demo-room",
        });
      }

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        $or: [{ userId: req.user!.sub }, { therapistId: req.user!.sub }],
      }).lean();

      if (!booking) throw new AppError("Booking not found", 404);

      const therapist = await User.findById(booking.therapistId)
        .select("therapistProfile phoneMasked")
        .lean();

      res.json({
        id: booking._id,
        therapistId: booking.therapistId,
        therapistName: therapist?.therapistProfile?.name ?? "Therapist",
        slot: booking.slot,
        status: booking.status,
        amount: booking.payment.amount,
        paid: booking.payment.paid,
        videoRoomId: booking.videoRoomId,
      });
    },
  );

  /** POST /bookings/:bookingId/rate — Post-session rating */
  static rateSession = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.params;
      const { rating, feedback } = req.body as { rating: number; feedback?: string };

      if (!rating || rating < 1 || rating > 5) {
        throw new AppError("Rating must be between 1 and 5", 400);
      }

      if (bookingId === "demo-room") {
        return res.json({ message: "Demo rating submitted successfully" });
      }

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) throw new AppError("Booking not found", 404);

      booking.status = "completed";
      booking.rating = rating;
      if (feedback) booking.review = feedback;
      await booking.save();
      
      // Update therapist's average rating
      const allRated = await TherapistBooking.find({
        therapistId: booking.therapistId,
        status: "completed",
        rating: { $exists: true },
      }).lean();

      if (allRated.length > 0) {
        const ratings = allRated
          .map((b) => b.rating)
          .filter((r): r is number => r !== undefined && r !== null);
 
        if (ratings.length > 0) {
          const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          await User.findByIdAndUpdate(booking.therapistId, {
            "therapistProfile.rating": Math.round(avgRating * 10) / 10,
            "therapistProfile.sessionCount": allRated.length,
          });
        }
      }

      res.json({ message: "Rating submitted successfully" });
    },
  );



  /** GET /bookings/:bookingId/ai-brief — Groq-powered AI brief for therapist before session */
  static getAiBrief = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.params;

      if (bookingId === "demo-room") {
        return res.json({
          clientId: "demo-client",
          moodChart: [],
          avgMood: 7,
          riskLevel: "low",
          recentJournals: [],
          groqSummary: "This is a demo AI brief. The client has shown stable mood patterns recently. No immediate risk factors identified.",
          sessionCount: 0,
        });
      }

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        $or: [{ userId: req.user!.sub }, { therapistId: req.user!.sub }],
      }).lean();

      if (!booking) throw new AppError("Booking not found", 404);

      const user = await User.findById(req.user!.sub).select("role").lean();
      if (!user) throw new AppError("User not found", 404);

      // Fetch client's last 7 days of moods
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const moods = await Mood.find({
        userId: booking.userId,
        date: { $gte: sevenDaysAgo },
      })
        .sort({ date: 1 })
        .select("score date tags note")
        .lean();

      // Fetch last 5 journal entries
      const journals = await JournalEntry.find({ userId: booking.userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("content createdAt")
        .lean();

      // Compute analytics
      const avgMood =
        moods.length > 0
          ? Math.round((moods.reduce((s, m) => s + m.score, 0) / moods.length) * 10) / 10
          : null;

      const riskLevel =
        avgMood === null ? "unknown"
        : avgMood < 4 ? "high"
        : avgMood < 6 ? "medium"
        : "low";

      // Build Groq prompt
      const moodSummary = moods
        .map((m) => `${new Date(m.date).toDateString()}: score ${m.score}/10${m.note ? ` — "${m.note}"` : ""}`)
        .join("\n");

      const journalSummary = journals
        .map((j, i) => `Entry ${i + 1} (${new Date(j.createdAt).toDateString()}): ${
          typeof j.content === "string" ? j.content.slice(0, 300) : ""
        }`)
        .join("\n\n");

      let groqSummary: string | null = null;

      if (process.env.GROQ_API_KEY && (moods.length > 0 || journals.length > 0)) {
        try {
          const prompt = `You are a clinical psychologist assistant. Summarise the following client data for their therapist in 3-4 concise bullet points. Focus on: mood trend, key emotional themes, risk indicators, and suggested areas to explore in today's session. Be clinical but compassionate. Do not use the client's name.

MOOD DATA (last 7 days, scale 1-10):
${moodSummary || "No mood data available."}

RECENT JOURNAL ENTRIES:
${journalSummary || "No journal entries available."}

Average mood: ${avgMood ?? "N/A"}/10
Risk level: ${riskLevel}

Write a therapist pre-session brief:`;

          const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              temperature: 0.3,
              max_tokens: 400,
              messages: [{ role: "user", content: prompt }],
            }),
          });

          if (resp.ok) {
            const data = (await resp.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            groqSummary = data.choices?.[0]?.message?.content?.trim() ?? null;
          }
        } catch (err) {
          console.error("[AI Brief] Groq call failed:", err);
        }
      }

      const client = await User.findById(booking.userId)
        .select("fullName onboarding")
        .lean();

      res.json({
        clientId: booking.userId,
        clientName: client?.fullName || "Anonymous Client",
        onboardingDetails: client?.onboarding || null,
        moodChart: moods.map((m) => ({
          date: m.date,
          score: m.score,
          tags: (m as any).tags ?? [],
        })),
        avgMood,
        riskLevel,
        recentJournals: journals.map((j) => ({
          date: j.createdAt,
          excerpt: typeof j.content === "string" ? j.content.slice(0, 200) : "",
        })),
        groqSummary,
        sessionCount: 0,
      });
    },
  );

  /** PATCH /bookings/:bookingId/notes — Therapist saves session notes */
  static saveNotes = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.params;
      const { notes } = req.body as { notes: string };

      if (bookingId === "demo-room") {
        return res.json({ message: "Demo notes saved" });
      }

      const booking = await TherapistBooking.findOneAndUpdate(
        { _id: bookingId, therapistId: req.user!.sub },
        { therapistNotes: notes },
        { new: true },
      );

      if (!booking) throw new AppError("Booking not found or not your session", 404);
      res.json({ message: "Notes saved" });
    },
  );
}
