import { asyncHandler } from "../core/asyncHandler.js";
import { ok, created } from "../core/responses.js";
import { loginUser, registerUser, changePassword, requestPasswordReset, resetPassword, toAuthUser } from "../services/auth.service.js";
import { recordAudit } from "../services/audit.service.js";
import { User } from "../models/User.js";
import { computeProfileCompletion } from "../services/profileCompletion.service.js";

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
  return ok(res, result, "Login successful");
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  const publicUser = await toAuthUser(user);
  publicUser.profileCompletion = computeProfileCompletion(user);
  return ok(res, publicUser, "Current user");
});

export const updatePassword = asyncHandler(async (req, res) => {
  await changePassword(req.user._id, req.body);
  recordAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: "Password changed",
    entityType: "user",
    entityId: String(req.user._id),
    ip: req.ip,
  });
  return ok(res, null, "Password updated");
});

// Both branches return the same generic message to prevent account enumeration.
export const forgotPassword = asyncHandler(async (req, res) => {
  await requestPasswordReset(req.body.email, req.ip);
  return ok(
    res,
    null,
    "If an account exists for that email, a password reset link has been sent.",
  );
});

export const resetPasswordHandler = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body, req.ip);
  return ok(res, { user: result.user }, "Password reset successfully. Please sign in.");
});
