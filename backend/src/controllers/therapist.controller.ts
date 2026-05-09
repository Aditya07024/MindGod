import type { Request, Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { User, TherapistBooking } from "@/models";
import { AppError } from "@/lib/app-error";

export class TherapistController {
  /** GET /therapists — list all verified therapists (for users to browse) with search & filters */
  static list = asyncHandler(async (req: Request, res: Response) => {
    const {
      specialization,
      language,
      minFee = 0,
      maxFee = 5000,
      verified,
      rating,
      limit = 50,
      skip = 0,
    } = req.query;

    // Build filter query
    const filter: any = {
      role: "therapist",
      deletedAt: null,
    };

    // Filter by specialization (array contains)
    if (specialization) {
      filter["therapistProfile.specializations"] = {
        $regex: String(specialization),
        $options: "i",
      };
    }

    // Filter by language
    if (language) {
      filter["therapistProfile.languages"] = {
        $regex: String(language),
        $options: "i",
      };
    }

    // Filter by session fee range
    filter["therapistProfile.sessionFee"] = {
      $gte: Number(minFee),
      $lte: Number(maxFee),
    };

    // Filter by verification status
    if (verified === "true") {
      filter["therapistProfile.verified"] = true;
    }

    // Filter by minimum rating
    if (rating) {
      filter["therapistProfile.rating"] = { $gte: Number(rating) };
    }

    const therapists = await User.find(filter)
      .select("therapistProfile phoneMasked createdAt")
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      therapists: therapists.map((t) => ({
        id: t._id,
        name: t.therapistProfile?.name || "Therapist",
        specializations: t.therapistProfile?.specializations ?? [],
        languages: t.therapistProfile?.languages ?? [],
        rating: t.therapistProfile?.rating ?? 5.0,
        sessionCount: t.therapistProfile?.sessionCount ?? 0,
        sessionFee: t.therapistProfile?.sessionFee ?? 1800,
        verified: t.therapistProfile?.verified ?? false,
        bio: t.therapistProfile?.bio ?? "",
        introVideoUrl: t.therapistProfile?.introVideoUrl ?? "",
        availability: t.therapistProfile?.availability ?? [],
      })),
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  });

  /** GET /therapists/:id — get single therapist details */
  static getDetail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const therapist = await User.findOne({
      _id: id,
      role: "therapist",
      deletedAt: null,
    })
      .select("therapistProfile phoneMasked createdAt")
      .lean();

    if (!therapist || !therapist.therapistProfile) {
      throw new AppError("Therapist not found", 404);
    }

    res.json({
      id: therapist._id,
      name: therapist.therapistProfile.name || "Therapist",
      rciNumber: therapist.therapistProfile.rciNumber,
      verified: therapist.therapistProfile.verified,
      specializations: therapist.therapistProfile.specializations,
      languages: therapist.therapistProfile.languages,
      rating: therapist.therapistProfile.rating,
      sessionCount: therapist.therapistProfile.sessionCount,
      sessionFee: therapist.therapistProfile.sessionFee,
      bio: therapist.therapistProfile.bio,
      introVideoUrl: therapist.therapistProfile.introVideoUrl,
      availability: therapist.therapistProfile.availability,
    });
  });

  /** GET /therapists/:id/availability — check therapist's available slots */
  static getAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD

    const therapist = await User.findOne({
      _id: id,
      role: "therapist",
      deletedAt: null,
    })
      .select("therapistProfile")
      .lean();

    if (!therapist || !therapist.therapistProfile) {
      throw new AppError("Therapist not found", 404);
    }

    // Get booked slots for the date
    const dateObj = date ? new Date(String(date)) : new Date();
    const dayOfWeek = dateObj.getDay();

    const bookedSlots = await TherapistBooking.find({
      therapistId: id,
      slot: {
        $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        $lt: new Date(dateObj.setHours(23, 59, 59, 999)),
      },
      status: { $in: ["pending", "confirmed"] },
    })
      .select("slot")
      .lean();

    const bookedTimes = bookedSlots.map((b) =>
      b.slot.toISOString().split("T")[1].slice(0, 5),
    );
    const availability = therapist.therapistProfile.availability.find(
      (a) => a.day === dayOfWeek,
    );

    res.json({
      date: dateObj.toISOString().split("T")[0],
      availableSlots: availability?.slots ?? [],
      bookedSlots: bookedTimes,
      openSlots: (availability?.slots ?? []).filter(
        (s) => !bookedTimes.includes(s),
      ),
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

    const [totalBookings, monthBookings, completedAll, completedMonth] =
      await Promise.all([
        TherapistBooking.countDocuments({ therapistId: userId }),
        TherapistBooking.countDocuments({
          therapistId: userId,
          createdAt: { $gte: startOfMonth },
        }),
        TherapistBooking.find({ therapistId: userId, status: "completed" })
          .select("payment")
          .lean(),
        TherapistBooking.find({
          therapistId: userId,
          status: "completed",
          updatedAt: { $gte: startOfMonth },
        })
          .select("payment")
          .lean(),
      ]);

    const totalEarned = completedAll.reduce(
      (sum, b) => sum + (b.payment?.amount ?? 0),
      0,
    );
    const monthEarned = completedMonth.reduce(
      (sum, b) => sum + (b.payment?.amount ?? 0),
      0,
    );
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
        introVideoUrl: therapist.therapistProfile?.introVideoUrl ?? "",
        availability: therapist.therapistProfile?.availability ?? [],
      },
      stats: {
        totalBookings,
        monthBookings,
        totalEarned,
        monthEarned,
        nextPayout,
        completedSessions: completedAll.length,
        completedMonthSessions: completedMonth.length,
      },
    });
  });

  /** GET /therapists/me/bookings — upcoming + past bookings for this therapist */
  static myBookings = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const userId = req.user!.sub;

      const bookings = await TherapistBooking.find({ therapistId: userId })
        .sort({ slot: 1 })
        .lean();

      // Build monthly revenue buckets for chart
      const revenueByMonth: Record<string, number> = {};
      for (const b of bookings) {
        if (b.status !== "completed") continue;
        const key = `${b.slot.getFullYear()}-${String(b.slot.getMonth() + 1).padStart(2, "0")}`;
        revenueByMonth[key] =
          (revenueByMonth[key] ?? 0) + (b.payment?.amount ?? 0);
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
          videoRoomId: b.videoRoomId,
        })),
        revenueByMonth,
      });
    },
  );

  /** PATCH /therapists/me/availability — save weekly availability slots */
  static updateAvailability = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const userId = req.user!.sub;
      const { availability } = req.body as {
        availability: { day: number; slots: string[] }[];
      };

      await User.findByIdAndUpdate(userId, {
        "therapistProfile.availability": availability,
      });

      res.json({ message: "Availability updated" });
    },
  );

  /** PATCH /therapists/me/profile — save therapist profile details */
  static updateProfile = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const userId = req.user!.sub;
      const { bio, fee, specializations, introVideoUrl } = req.body;

      const user = await User.findById(userId);
      if (!user) throw new AppError("User not found", 404);

      if (!user.therapistProfile) {
        user.therapistProfile = {
          name: user.fullName ?? "Therapist",
          specializations: [],
          languages: ["English", "Hindi"],
          availability: [],
          rating: 0,
          sessionCount: 0,
          sessionFee: 1500,
          verified: false,
        };
      }

      if (bio !== undefined) user.therapistProfile.bio = bio;
      if (fee !== undefined) {
        let f = Number(fee);
        if (f < 500) f = 500;
        if (f > 5000) f = 5000;
        user.therapistProfile.sessionFee = f;
      }
      if (specializations !== undefined) {
        user.therapistProfile.specializations = specializations.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
      if (introVideoUrl !== undefined) user.therapistProfile.introVideoUrl = introVideoUrl;

      await user.save();

      res.json({ message: "Profile updated" });
    },
  );
}
