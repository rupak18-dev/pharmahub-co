import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { constants } from "./config/constants.js";
import apiRoutes from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";
import { stream } from "./core/logger.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  const allowedOriginsRaw = env.corsOrigin;
  const allowedOrigins =
    typeof allowedOriginsRaw === "string" && allowedOriginsRaw !== "*"
      ? allowedOriginsRaw
          .split(",")
          .map((s) => s.trim().replace(/\/+$/, ""))
          .filter(Boolean)
      : [];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Credentials-bearing responses cannot use wildcard origins.
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/+$/, "");
        // Non-production stays permissive for local tooling.
        if (!env.isProduction && allowedOrigins.length === 0) return callback(null, true);
        if (
          allowedOrigins.includes(normalized) ||
          (!env.isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized))
        ) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // CSRF defense-in-depth for cookie-based sessions: mutating requests must
  // carry a custom header that cross-site form posts cannot add. Our own SPA
  // sets it on every API call; plain GETs are exempt.
  app.use((req, res, next) => {
    if (!["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) return next();
    if (req.get("x-pharmahub-client") === "web") return next();
    return res.status(403).json({
      success: false,
      error: { message: "Missing required client header." },
    });
  });

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? "combined" : "dev", { stream }));
  }

  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: { message: "Too many requests, please try again later." } },
    }),
  );

  app.get("/", (_req, res) => {
    res.status(200).json({
      success: true,
      name: constants.app.name,
      version: constants.app.version,
      docs: "/api/v1/docs",
    });
  });

  app.use(constants.app.apiPrefix, apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
