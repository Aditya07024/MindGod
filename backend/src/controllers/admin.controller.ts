import type { Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { User, TherapistBooking, Mood, Conversation } from "@/models";

export class AdminController {
  /** GET /admin/stats — platform-wide counts for super_admin */
  static platformStats = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const [userCount, therapistCount, totalBookings, completedBookings] = await Promise.all([
      User.countDocuments({ role: "user", deletedAt: null }),
      User.countDocuments({ role: "therapist", deletedAt: null }),
      TherapistBooking.countDocuments(),
      TherapistBooking.find({ status: "completed" }).select("payment").lean()
    ]);

    const gmv = completedBookings.reduce((s, b) => s + (b.payment?.amount ?? 0), 0);

    const pendingTherapists = await User.find({
      role: "therapist",
      "therapistProfile.verified": false,
      deletedAt: null
    }).select("therapistProfile phoneMasked").lean();

    res.json({
      users: userCount,
      therapists: therapistCount,
      totalBookings,
      gmv,
      pendingTherapists: pendingTherapists.map(t => ({
        id: t._id,
        name: t.therapistProfile?.name ?? "Unnamed",
        rciNumber: t.therapistProfile?.rciNumber ?? "",
        verified: t.therapistProfile?.verified ?? false
      }))
    });
  });

  /** GET /admin/org-stats — org wellness aggregates */
  static orgStats = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const totalUsers = await User.countDocuments({ role: "user", deletedAt: null });
    const activeUsers = await User.countDocuments({
      role: "user",
      deletedAt: null,
      lastActiveAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Get average mood from last 30 days
    const moods = await Mood.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).select("score").lean();

    const avgMood = moods.length ? (moods.reduce((s, m) => s + m.score, 0) / moods.length).toFixed(1) : "0";
    const engagement = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    // Conversation counts for chat usage
    const chatSessions = await Conversation.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalUsers,
      activeUsers,
      avgMood: `${avgMood}/10`,
      engagement: `${engagement}%`,
      chatSessions,
      seatsUsed: `${activeUsers} / ${totalUsers}`
    });
  });

  /** GET /admin/pending-therapists — unverified therapists */
  static pendingTherapists = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const pending = await User.find({
      role: "therapist",
      "therapistProfile.verified": false,
      deletedAt: null
    }).select("therapistProfile phoneMasked createdAt").lean();

    res.json({
      therapists: pending.map(t => ({
        id: t._id,
        name: t.therapistProfile?.name ?? "Unnamed",
        rciNumber: t.therapistProfile?.rciNumber ?? "",
        bio: t.therapistProfile?.bio ?? "",
        createdAt: t.createdAt
      }))
    });
  });
}
