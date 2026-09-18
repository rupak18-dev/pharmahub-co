import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { env } from "../config/env.js";
import { ApiError } from "../core/ApiError.js";
import { User } from "../models/User.js";
import { PasswordResetToken } from "../models/PasswordResetToken.js";
import { computeProfileCompletion } from "./profileCompletion.service.js";
import { sendEmail } from "./mailer.js";
import { buildResetEmail } from "./emailTemplates.js";
import { recordAudit } from "./audit.service.js";
import { getEffectivePermissions, normalizePermissions } from "./permissions.service.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function registerUser({ name, email, password, orgName }) {
  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail }).collation({ locale: "en", strength: 2 });
  if (existing) throw ApiError.conflict("A user with this email already exists");

  // Self-registration always creates a Pharmacist; privileged roles are
  // assigned by an Owner/Admin through the users endpoint.
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "Pharmacist",
    orgName,
  });

  return { user: toPublicUser(user) };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail })
    .collation({ locale: "en", strength: 2 })
    .select("+passwordHash")
    .lean();
  if (!user || !user.active || user.status === "removed") {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw ApiError.unauthorized("Invalid email or password");

  const token = signToken(user._id);
  const publicUser = await toAuthUser(user);
  publicUser.profileCompletion = computeProfileCompletion(user);
  return { token, user: publicUser };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw ApiError.notFound("User not found");

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) throw ApiError.badRequest("Current password is incorrect");

  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    throw ApiError.badRequest("New password must be different from the current password");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  return true;
}

// Always returns the same generic result — the response must never reveal
// whether an account exists for the supplied email.
export async function requestPasswordReset(email, ip) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) return { sent: false };

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + env.resetTokenTtlMs);

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    status: "pending",
  });

  const link = `${env.frontendUrl}/reset-password?token=${rawToken}`;
  const { subject, html, text } = buildResetEmail({
    name: user.name,
    link,
    expiresInMinutes: Math.max(1, Math.round(env.resetTokenTtlMs / 60000)),
  });

  try {
    const result = await sendEmail({ to: normalizedEmail, subject, html, text });
    if (result.skipped) {
      recordAudit({ userId: user._id, userName: user.name, action: "Password reset requested (email skipped — SMTP not configured)", entityType: "user", entityId: String(user._id), ip });
      return { sent: true };
    }
  } catch {
    // Email delivery failed: remove the one-time token so no dangling reset
    // link survives, but keep the response generic to avoid user enumeration.
    await PasswordResetToken.deleteOne({ tokenHash });
    return { sent: false };
  }

  recordAudit({ userId: user._id, userName: user.name, action: "Password reset requested", entityType: "user", entityId: String(user._id), ip });
  return { sent: true };
}

export async function resetPassword({ token, newPassword }, ip) {
  const tokenHash = hashToken(token);
  const resetToken = await PasswordResetToken.findOne({ tokenHash }).select("+tokenHash");
  if (!resetToken || resetToken.status !== "pending") {
    throw ApiError.badRequest("This password reset link is invalid or has already been used");
  }
  if (resetToken.expiresAt < new Date()) {
    throw ApiError.badRequest("This password reset link has expired");
  }

  const user = await User.findById(resetToken.userId).select("+passwordHash");
  if (!user) throw ApiError.badRequest("This password reset link is invalid");

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  resetToken.status = "used";
  resetToken.usedAt = new Date();
  await resetToken.save();

  recordAudit({ userId: user._id, userName: user.name, action: "Password reset completed", entityType: "user", entityId: String(user._id), ip });

  return { user: toPublicUser(user.toObject()) };
}

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function issueToken(userId) {
  return signToken(userId);
}

export function toPublicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    orgName: user.orgName,
    active: user.active,
    status: user.status ?? (user.active ? "active" : "suspended"),
    removedAt: user.removedAt ?? null,
    removedBy: user.removedBy ? String(user.removedBy) : null,
    phoneVerified: user.phoneVerified ?? false,
    phoneVerifiedAt: user.phoneVerifiedAt ?? null,
    avatarUrl: user.avatarUrl ?? null,
    tagline: user.tagline ?? null,
    description: user.description ?? null,
    businessEmail: user.businessEmail ?? null,
    website: user.website ?? null,
    address: user.address ?? null,
    city: user.city ?? null,
    state: user.state ?? null,
    pincode: user.pincode ?? null,
    gstin: user.gstin ?? null,
    licenseNo: user.licenseNo ?? null,
    businessType: user.businessType ?? null,
    services: user.services ?? null,
    businessHours: user.businessHours ?? null,
    metaPixelId: user.metaPixelId ?? null,
    branches: user.branches ?? [],
    permissions: normalizePermissions(user.permissions),
    featureAccess: user.featureAccess ?? {},
    accessIds: user.accessIds ?? [],
    department: user.department ?? null,
    designation: user.designation ?? null,
    profileCompletion: user.profileCompletion ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Auth responses (login / me / invitation accept) must carry the user's
// EFFECTIVE permission matrix — role defaults merged with any per-user
// overrides — so the frontend can hide/block features and never trusts only
// the role name. Returns a fresh public-user object.
export async function toAuthUser(user) {
  const publicUser = toPublicUser(user);
  publicUser.permissions = await getEffectivePermissions(user);
  return publicUser;
}
