import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { AuthController } from "@/controllers/auth.controller";
import { UserController } from "@/controllers/user.controller";

const router = Router();

router.get("/me", requireAuth, AuthController.me);
router.get("/stats", requireAuth, UserController.stats);
router.get("/profile", requireAuth, UserController.profile);
router.get("/notifications", requireAuth, UserController.notifications);

export default router;
