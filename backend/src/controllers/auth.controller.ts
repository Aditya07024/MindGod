import type { Request, Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import { AuthService } from "@/services/auth.service";
import type { AuthedRequest } from "@/middleware/auth";

const COOKIE_NAME = "mindgod_token";

function serializeUser(
  user: Awaited<ReturnType<typeof AuthService.getCurrentUser>>,
) {
  return {
    id: user._id,
    role: user.role,
    tier: user.tier,
    language: user.language,
    phoneMasked: user.phoneMasked,
    isAnonymous: user.isAnonymous,
    streak: user.streak,
    onboarding: user.onboarding,
  };
}

export class AuthController {
  static sendOTP = asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;
    const result = await AuthService.sendOTP(phone);
    res.json({ message: "OTP sent successfully", ...result });
  });

  static verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    const user = await AuthService.verifyOTP(phone, otp);
    const token = AuthService.generateToken(user);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",      domain: process.env.NODE_ENV === "production" ? ".onrender.com" : undefined,      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: serializeUser(user) });
  });

  static me = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const user = await AuthService.getCurrentUser(req.user!.sub);
    res.json({ user: serializeUser(user) });
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
      res.json({ user: serializeUser(user) });
    },
  );

  static updateProfile = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const user = await AuthService.updateProfile(req.user!.sub, req.body);
      res.json({ user: serializeUser(user) });
    },
  );

  static setDevRole = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { role } = req.body as {
        role: "user" | "therapist" | "org_admin" | "super_admin";
      };

      const user = await AuthService.setRole(req.user!.sub, role);
      const token = AuthService.generateToken(user);

      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({ user: serializeUser(user) });
    },
  );

  static logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ message: "Logged out successfully" });
  });
}
