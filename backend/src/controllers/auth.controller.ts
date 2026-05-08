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
  static setRole = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { role } = req.body;
      const validRoles = ["user", "therapist", "org_admin", "super_admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const user = await User.findByIdAndUpdate(
        req.user!.sub,
        { role },
        { new: true },
      ).lean();

      if (!user) return res.status(404).json({ error: "User not found" });

      res.json({
        message: `Role updated to ${role}`,
        user: serializeUser(user),
      });
    },
  );

}
