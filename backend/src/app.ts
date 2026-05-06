import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/error-handler";
import { apiRouter } from "@/routes";

export async function createApp() {
  await mongoose.connect(env.MONGODB_URI);

  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true
    })
  );
  app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan("dev"));
  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}
