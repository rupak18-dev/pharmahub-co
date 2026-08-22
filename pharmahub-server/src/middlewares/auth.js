import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { ApiError } from "../core/ApiError.js";
import { asyncHandler } from "../core/asyncHandler.js";
import { User } from "../models/User.js";

export const auth = asyncHandler(async (req, _res, next) => {
  // Primary: httpOnly session cookie. Fallback: Bearer header, kept only so
  // clients deployed before the cookie rollout keep working.
  let token = req.cookies?.[env.authCookieName] ?? null;
  if (!token) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Not authenticated");
    }
    token = header.slice(7).trim();
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  const user = await User.findById(payload.sub).lean();
  if (!user || !user.active || user.status === "removed") {
    throw ApiError.unauthorized("User account is inactive or removed");
  }

  req.user = user;
  next();
});
