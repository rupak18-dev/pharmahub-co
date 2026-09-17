import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { asyncHandler } from "../core/asyncHandler.js";
import { User } from "../models/User.js";
import * as ticketController from "../controllers/ticket.controller.js";

const router = Router();

// Soft auth middleware so tickets can be submitted whether authenticated or during onboarding/support
const softAuth = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.[env.authCookieName] ?? null;
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.slice(7).trim();
  }
  if (token) {
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.sub).lean();
      if (user && user.active && user.status !== "removed") {
        req.user = user;
      }
    } catch {
      // soft fail
    }
  }
  next();
});

router.use(softAuth);

router.post("/", ticketController.createTicket);
router.get("/", ticketController.listTickets);
router.get("/:id", ticketController.getTicket);

export default router;
