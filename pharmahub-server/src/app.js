import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { constants } from "./config/constants.js";
import { uploadsDir } from "./middlewares/upload.js";
import apiRoutes from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";
import { stream } from "./core/logger.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  const corsOrigins =
    env.corsOrigin === "*"
      ? true
      : env.corsOrigin
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

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

  // Uploaded files (e.g. profile avatars) are served from the uploads root at
  // a stable public URL: /uploads/profile/<file>. The frontend and API live on
  // different origins in dev (e.g. localhost:5100 vs localhost:5050), so the
  // global helmet `Cross-Origin-Resource-Policy: same-origin` would make the
  // browser refuse to embed these images. Uploaded assets are intentionally
  // public and cross-origin embeddable, so relax CORP for this route only.
  app.use(
    "/uploads",
    express.static(uploadsDir, {
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
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
