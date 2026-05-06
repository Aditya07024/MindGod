import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { AdminController } from "@/controllers/admin.controller";

const router = Router();

router.get("/stats", requireAuth, AdminController.platformStats);
router.get("/org-stats", requireAuth, AdminController.orgStats);
router.get("/pending-therapists", requireAuth, AdminController.pendingTherapists);

export default router;
