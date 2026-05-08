import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth";
import { AdminController } from "@/controllers/admin.controller";

const router = Router();

router.get("/stats", requireAuth, requireRole(["super_admin"]), AdminController.platformStats);
router.get("/org-stats", requireAuth, AdminController.orgStats);
router.get("/pending-therapists", requireAuth, requireRole(["super_admin"]), AdminController.pendingTherapists);
router.patch("/therapist/:id/verify", requireAuth, requireRole(["super_admin"]), AdminController.verifyTherapist);

export default router;

