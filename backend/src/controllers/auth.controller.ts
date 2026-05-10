import type { Request, Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import { AuthService } from "@/services/auth.service";
import type { AuthedRequest } from "@/middleware/auth";
import { User } from "@/models";

function serializeUser(user: any) {
  return {
    id: user._id,
    role: user.role,
    tier: user.tier,
    language: user.language,
    phoneMasked: user.phoneMasked,
    fullName: user.fullName,
    isAnonymous: user.isAnonymous,
    streak: user.streak,
    onboarding: user.onboarding,
    therapistProfile: user.role === "therapist" ? user.therapistProfile : undefined,
  };
}

export class AuthController {
  /** GET /auth/me — returns the current Clerk-authed user's MongoDB profile */
  static me = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const user = await User.findById(req.user!.sub).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(serializeUser(user));
  });

  static updateOnboarding = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { moodScore, concerns, primaryNeed, completed } = req.body;
      const user = await AuthService.updateOnboarding(req.user!.sub, {
        moodScore,
        concerns,
        primaryNeed,
        completed,
      });
      res.json(serializeUser(user));
    },
  );

  static updateProfile = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const user = await AuthService.updateProfile(req.user!.sub, req.body);
      res.json(serializeUser(user));
    },
  );

  static therapistOnboarding = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const {
        fullName,
        email,
        phone,
        qualification,
        experienceYears,
        specializations,
        clinicDetails,
        degreeUrl,
        licenseUrl,
        governmentIdUrl,
        introVideoUrl,
        orgId
      } = req.body;

      const user = await User.findById(req.user!.sub);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (fullName) user.fullName = fullName;
      if (orgId) user.orgId = orgId;

      // Ensure they have the therapist role now, but verification is pending
      user.role = "therapist";
      
      user.therapistProfile = {
        name: fullName || user.fullName || "",
        verified: false,
        verificationStatus: "pending",
        qualification,
        experienceYears,
        clinicDetails,
        specializations: specializations || [],
        documents: {
          degreeUrl,
          licenseUrl,
          governmentIdUrl,
        },
        introVideoUrl,
        languages: [],
        sessionFee: 0,
        rating: 0,
        sessionCount: 0,
        availability: []
      };

      await user.save();
      res.json(serializeUser(user));
    }
  );
  static setRole = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      let { role } = req.body;

      // Normalize frontend role values
      if (role === "super admin") role = "super_admin";
      if (role === "super-admin") role = "super_admin";
      if (role === "org admin") role = "org_admin";
      if (role === "org-admin") role = "org_admin";

      const validRoles = ["user", "therapist", "org_admin", "super_admin"];

      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const userDoc = await User.findById(req.user!.sub);
      if (!userDoc) {
        return res.status(404).json({ error: "User not found" });
      }

      // SECURITY FIX: If the user already has a defined role (other than 'user'), DO NOT allow it to be changed.
      // This prevents an Org Admin from accidentally becoming a regular user or vice versa if they click the wrong link.
      if (userDoc.role !== "user" && userDoc.role !== role) {
        return res.json({
          message: "Role is already locked for this account.",
          user: serializeUser(userDoc),
        });
      }

      userDoc.role = role;
      await userDoc.save();

      res.json({
        message: `Role confirmed as ${role}`,
        user: serializeUser(userDoc),
      });
    },
  );

}
