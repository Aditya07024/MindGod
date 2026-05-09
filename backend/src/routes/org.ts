import { Router } from "express";
import { OrgController } from "@/controllers/org.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import multer from "multer";

// Use memory storage so we can parse the buffer directly with xlsx
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// Public (auth required, any role)
router.get("/me", requireAuth, OrgController.me);
router.get("/verified", requireAuth, OrgController.getVerifiedOrgs);

// Org onboarding & email verification
router.post("/onboarding", requireAuth, OrgController.onboarding);
router.post("/send-otp", requireAuth, OrgController.sendOtp);
router.post("/verify-otp", requireAuth, OrgController.verifyOtp);

// ── JOIN REQUEST FLOW (any authenticated user) ──
router.post("/request-join", requireAuth, OrgController.requestJoin);

// ── ORG ADMIN ROUTES ──
router.get("/pending-therapists", requireAuth, requireRole(["org_admin"]), OrgController.pendingTherapists);
router.patch("/therapist/:id/verify", requireAuth, requireRole(["org_admin"]), OrgController.verifyTherapist);

router.get("/stats", requireAuth, requireRole(["org_admin"]), OrgController.dashboardStats);
router.get("/users", requireAuth, requireRole(["org_admin"]), OrgController.listUsers);

// Join request management
router.get("/join-requests", requireAuth, requireRole(["org_admin"]), OrgController.listJoinRequests);
router.patch("/join-request/:userId/approve", requireAuth, requireRole(["org_admin"]), OrgController.approveJoinRequest);
router.patch("/join-request/:userId/reject", requireAuth, requireRole(["org_admin"]), OrgController.rejectJoinRequest);

// Excel email whitelist upload
router.post("/upload-emails", requireAuth, requireRole(["org_admin"]), upload.single("file"), OrgController.uploadEmails);

// Member data
router.get("/members", requireAuth, requireRole(["org_admin"]), OrgController.listMembers);
router.get("/user-data/:userId", requireAuth, requireRole(["org_admin"]), OrgController.getUserData);

export default router;
