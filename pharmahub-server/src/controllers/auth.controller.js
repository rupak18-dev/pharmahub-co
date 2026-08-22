import { asyncHandler } from "../core/asyncHandler.js";
import { ok, created } from "../core/responses.js";
import {
  loginUser,
  registerUser,
  changePassword,
  requestPasswordReset,
  resetPassword as resetPasswordService,
} from "../services/auth.service.js";
import { recordAudit } from "../services/audit.service.js";
import { setAuthCookie, clearAuthCookie } from "../utils/authCookie.js";

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  recordAudit({
    userId: result.user?.id,
    userName: result.user?.name,
    action: "User registered",
    entityType: "user",
    entityId: result.user?.id,
    ip: req.ip,
  });
  return created(res, result.user, "Registration successful. Please sign in.");
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  recordAudit({
    userId: result.user.id,
    userName: result.user.name,
    action: "User signed in",
    entityType: "user",
    entityId: result.user.id,
    ip: req.ip,
  });
  // Session JWT is delivered as an httpOnly cookie — never in the body.
  // "Remember me" (default true) picks session-scope vs persistent cookie.
  const remember = req.body?.remember !== false;
  setAuthCookie(res, result.token, { remember });
  return ok(res, { user: result.user }, "Login successful");
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  return ok(res, null, "Logged out");
});

export const me = asyncHandler(async (req, res) => {
  return ok(res, req.user, "Current user");
});

export const updatePassword = asyncHandler(async (req, res) => {
  await changePassword(req.user._id, req.body);
  return ok(res, null, "Password updated");
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await requestPasswordReset(req.body.email, req.ip);
  // Uniform response — never reveal whether the email exists.
  return ok(res, { sent: true }, "If an account exists for that email, a reset link has been sent.");
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await resetPasswordService(req.body, req.ip);
  return ok(res, { user: result.user }, "Password has been reset. You can now sign in.");
});
