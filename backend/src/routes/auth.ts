import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/auth";

const router = Router();

// OTP routes removed — auth is now handled by Clerk (Google, Apple, email)
// Clerk auto-provisions MongoDB users on first sign-in via requireAuth middleware

router.get("/me", requireAuth, AuthController.me);
router.patch("/onboarding", requireAuth, AuthController.updateOnboarding);
router.patch("/profile", requireAuth, AuthController.updateProfile);
router.patch("/role", requireAuth, AuthController.setRole);

export default router;
