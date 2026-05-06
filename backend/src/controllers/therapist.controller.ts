import type { Request, Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { User, TherapistBooking } from "@/models";
import { AppError } from "@/lib/app-error";

export class TherapistController {
  /** GET /therapists — list all verified therapists (for users to browse) */
  static list = asyncHandler(async (_req: Request, res: Response) => {
    const therapists = await User.find({
      role: "therapist",
      deletedAt: null
    })
      .select("therapistProfile phoneMasked")
      .lean();

    res.json({
      therapists: therapists.map((t) => ({
        id: t._id,
        name: t.therapistProfile?.name || t.phoneMasked || "Therapist",
        specializations: t.therapistProfile?.specializations ?? [],
        languages: t.therapistProfile?.languages ?? [],
        rating: t.therapistProfile?.rating ?? 5.0,
        sessionFee: t.therapistProfile?.sessionFee ?? 1800,
        verified: t.therapistProfile?.verified ?? false,
        bio: t.therapistProfile?.bio ?? "",
        availability: t.therapistProfile?.availability ?? []
      }))
    });
  });

  /** GET /therapists/me/stats — therapist's own earnings + session counts */
  static myStats = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.user!.sub;

    const therapist = await User.findById(userId).lean();
    if (!therapist || therapist.role !== "therapist") {
      throw new AppError("Not a therapist account", 403);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalBookings, monthBookings, completedAll, completedMonth] = await Promise.all([
      TherapistBooking.countDocuments({ therapistId: userId }),
      TherapistBooking.countDocuments({ therapistId: userId, createdAt: { $gte: startOfMonth } }),
      TherapistBooking.find({ therapistId: userId, status: "completed" }).select("payment").lean(),
      TherapistBooking.find({ therapistId: userId, status: "completed", updatedAt: { $gte: startOfMonth } })
        .select("payment").lean()
    ]);

    const totalEarned = completedAll.reduce((sum, b) => sum + (b.payment?.amount ?? 0), 0);
    const monthEarned = completedMonth.reduce((sum, b) => sum + (b.payment?.amount ?? 0), 0);
    const sessionFee = therapist.therapistProfile?.sessionFee ?? 1800;
    const nextPayout = Math.round(monthEarned * 0.85);

    res.json({
      profile: {
        name: therapist.therapistProfile?.name ?? "",
        rciNumber: therapist.therapistProfile?.rciNumber ?? "",
        specializations: therapist.therapistProfile?.specializations ?? [],
        languages: therapist.therapistProfile?.languages ?? [],
        sessionFee,
        rating: therapist.therapistProfile?.rating ?? 0,
        verified: therapist.therapistProfile?.verified ?? false,
        bio: therapist.therapistProfile?.bio ?? "",
        availability: therapist.therapistProfile?.availability ?? []
      },
      stats: {
        totalBookings,
        monthBookings,
        totalEarned,
        monthEarned,
        nextPayout,
        completedSessions: completedAll.length,
        completedMonthSessions: completedMonth.length
      }
    });
  });

  /** GET /therapists/me/bookings — upcoming + past bookings for this therapist */
  static myBookings = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.user!.sub;

    const bookings = await TherapistBooking.find({ therapistId: userId })
      .sort({ slot: 1 })
      .lean();

    // Build monthly revenue buckets for chart
    const revenueByMonth: Record<string, number> = {};
    for (const b of bookings) {
      if (b.status !== "completed") continue;
      const key = `${b.slot.getFullYear()}-${String(b.slot.getMonth() + 1).padStart(2, "0")}`;
      revenueByMonth[key] = (revenueByMonth[key] ?? 0) + (b.payment?.amount ?? 0);
    }

    res.json({
      bookings: bookings.map((b) => ({
        id: b._id,
        clientId: b.userId,
        slot: b.slot,
        status: b.status,
        topic: "Therapy session",
        fee: b.payment?.amount ?? 0,
        paid: b.payment?.paid ?? false,
        videoRoomId: b.videoRoomId
      })),
      revenueByMonth
    });
  });

  /** PATCH /therapists/me/availability — save weekly availability slots */
  static updateAvailability = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.user!.sub;
    const { availability } = req.body as {
      availability: { day: number; slots: string[] }[];
    };

    await User.findByIdAndUpdate(userId, {
      "therapistProfile.availability": availability
    });

    res.json({ message: "Availability updated" });
  });
}
