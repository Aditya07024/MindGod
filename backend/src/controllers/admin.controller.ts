import type { Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { User, TherapistBooking, Mood, Conversation, Organization } from "@/models";

export class AdminController {
  /** POST /admin/verify-password */
  static verifyPassword = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { password } = req.body;
    if (password === process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      res.json({ ok: true });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  /** POST /admin/verify-password-public (No auth required) */
  static verifyPasswordPublic = asyncHandler(async (req: any, res: Response) => {
    const { password } = req.body;
    if (password === process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      res.json({ ok: true });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

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
      deletedAt: null,
      $or: [{ orgId: null }, { orgId: { $exists: false } }]
    }).select("therapistProfile phoneMasked").lean();

    const pendingOrgs = await Organization.find({
      verificationStatus: "pending",
      deletedAt: null
    }).lean();

    res.json({
      users: userCount,
      therapists: therapistCount,
      totalBookings,
      gmv,
      pendingTherapists: pendingTherapists.map(t => ({
        id: t._id,
        name: t.therapistProfile?.name ?? "Unnamed",
        rciNumber: t.therapistProfile?.rciNumber ?? "",
        verified: t.therapistProfile?.verified ?? false,
        verificationStatus: t.therapistProfile?.verificationStatus ?? "pending"
      })),
      pendingOrganizations: pendingOrgs.map(org => ({
        id: org._id,
        name: org.name,
        type: org.type,
        officialEmail: org.officialEmail,
        contactPerson: org.contactPerson,
        verificationStatus: org.verificationStatus,
        createdAt: org.createdAt
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

  /** GET /admin/pending-therapists — ALL independent therapists (verified and unverified) */
  static pendingTherapists = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const pending = await User.find({
      role: "therapist",
      deletedAt: null,
      $or: [{ orgId: null }, { orgId: { $exists: false } }]
    }).select("therapistProfile phoneMasked createdAt").lean();

    res.json({
      therapists: pending.map(t => ({
        id: t._id,
        name: t.therapistProfile?.name || "Therapist",
        specializations: t.therapistProfile?.specializations ?? [],
        languages: t.therapistProfile?.languages ?? [],
        rating: t.therapistProfile?.rating ?? 5.0,
        sessionCount: t.therapistProfile?.sessionCount ?? 0,
        sessionFee: t.therapistProfile?.sessionFee ?? 1800,
        verified: t.therapistProfile?.verified ?? false,
        verificationStatus: t.therapistProfile?.verificationStatus ?? "pending",
        bio: t.therapistProfile?.bio ?? "",
        introVideoUrl: t.therapistProfile?.introVideoUrl ?? "",
        availability: t.therapistProfile?.availability ?? [],
        documents: t.therapistProfile?.documents ?? null
      }))
    });
  });

  /** PATCH /admin/therapist/:id/verify — Super admin: verify or revoke therapist */
  static verifyTherapist = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { verified, password } = req.body as { verified: boolean, password?: string };

    if (password !== process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    const therapist = await User.findOneAndUpdate(
      { _id: id, role: "therapist" },
      { 
        "therapistProfile.verified": verified,
        "therapistProfile.verificationStatus": verified ? "verified" : "rejected"
      },
      { new: true }
    ).select("therapistProfile").lean();

    if (!therapist) throw new Error("Therapist not found");

    res.json({
      id,
      verified,
      name: therapist.therapistProfile?.name ?? "Unnamed",
      message: verified ? "Therapist verified successfully" : "Verification revoked",
    });
  });

  /** GET /admin/pending-orgs — ALL orgs */
  static pendingOrgs = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const pending = await Organization.find({
      deletedAt: null
    }).lean();

    res.json({
      organizations: pending.map(org => ({
        id: org._id,
        name: org.name,
        type: org.type,
        officialEmail: org.officialEmail,
        contactPerson: org.contactPerson,
        phone: org.phone,
        address: org.address,
        website: org.website,
        documents: org.documents,
        verificationStatus: org.verificationStatus,
        createdAt: org.createdAt
      }))
    });
  });

  /** PATCH /admin/org/:id/verify — Super admin: verify or revoke organization */
  static verifyOrg = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { verified, password } = req.body as { verified: boolean, password?: string };

    if (password !== process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    const org = await Organization.findByIdAndUpdate(
      id,
      { verificationStatus: verified ? "verified" : "rejected" },
      { new: true }
    ).lean();

    if (!org) throw new Error("Organization not found");

    res.json({
      id,
      verified,
      name: org.name,
      message: verified ? "Organization verified successfully" : "Verification revoked",
    });
  });
}

