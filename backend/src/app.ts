import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/error-handler";
import { apiRouter } from "@/routes";

export async function createApp() {
  await mongoose.connect(env.MONGODB_URI);

  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow any localhost in dev; in production restrict to CLIENT_ORIGIN
        if (!origin) return cb(null, true); // allow non-browser requests (curl, Postman)
        if (env.NODE_ENV !== "production" && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
          return cb(null, true);
        }
        if (origin === env.CLIENT_ORIGIN) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    })
  );
  app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan("dev"));

  // Clerk middleware — makes auth() available on req, but does NOT enforce auth.
  // Individual routes use requireAuth() for enforcement.
  app.use(clerkMiddleware());

  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}
