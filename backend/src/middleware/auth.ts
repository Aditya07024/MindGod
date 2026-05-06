import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { AppError } from "@/lib/app-error";

export type AuthedRequest = Request & {
  user?: { sub: string; role: string };
};

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.mindgod_token ?? req.headers.authorization?.replace("Bearer ", "");
  if (!token) return next(new AppError("Unauthorized", 401));

  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
    next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }
    next();
  };
}
