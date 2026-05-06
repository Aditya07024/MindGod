import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/auth";

const router = Router();

router.post("/send-otp", AuthController.sendOTP);
router.post("/verify-otp", AuthController.verifyOTP);
router.get("/me", requireAuth, AuthController.me);
router.patch("/onboarding", requireAuth, AuthController.updateOnboarding);
router.patch("/profile", requireAuth, AuthController.updateProfile);
router.post("/dev-role", requireAuth, AuthController.setDevRole);
router.post("/logout", AuthController.logout);

export default router;
