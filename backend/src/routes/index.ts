import { Router } from "express";
import authRoutes from "./auth";
import chatRoutes from "./chat";
import moodRoutes from "./mood";
import journalRoutes from "./journal";
import therapistRoutes from "./therapist";
import userRoutes from "./user";
import bookingRoutes from "./booking";
import adminRoutes from "./admin";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => res.json({ ok: true }));

apiRouter.use("/auth", authRoutes);
apiRouter.use("/chat", chatRoutes);
apiRouter.use("/user", userRoutes);
apiRouter.use("/mood", moodRoutes);
apiRouter.use("/moods", moodRoutes);
apiRouter.use("/journal", journalRoutes);
apiRouter.use("/therapists", therapistRoutes);
apiRouter.use("/bookings", bookingRoutes);
apiRouter.use("/admin", adminRoutes);
