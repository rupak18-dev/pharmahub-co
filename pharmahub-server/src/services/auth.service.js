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

const MAX_RESET_CODE_ATTEMPTS = 5;

export async function registerUser({ name, email, password, orgName }) {
  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail }).collation({ locale: "en", strength: 2 });
  if (existing) throw ApiError.conflict("A user with this email already exists");

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
  let user = await User.findOne({ email: normalizedEmail })
    .collation({ locale: "en", strength: 2 })
    .select("+passwordHash");

  if (!user || !user.active || user.status === "removed") {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw ApiError.unauthorized("Invalid email or password");

  const token = signToken(user._id);
  const publicUser = await toAuthUser(user.toObject());
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

export async function requestPasswordReset(email, ip) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) return { sent: false };

  // Only the most recent code for a user stays valid.
  await PasswordResetToken.updateMany(
    { userId: user._id, status: "pending" },
    { $set: { status: "used" } },
  );

  const expiresAt = new Date(Date.now() + env.resetTokenTtlMs);
  const code = await createUniqueCode();
  const tokenHash = hashToken(code);

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    status: "pending",
  });

  const { subject, html, text } = buildResetEmail({
    name: user.name,
    code,
    expiresInMinutes: Math.max(1, Math.round(env.resetTokenTtlMs / 60000)),
  });

  try {
    const result = await sendEmail({ to: normalizedEmail, subject, html, text });
    if (result.skipped) {
      recordAudit({ userId: user._id, userName: user.name, action: "Password reset requested (email skipped — SMTP not configured)", entityType: "user", entityId: String(user._id), ip });
      return { sent: true };
    }
  } catch {
    await PasswordResetToken.deleteOne({ tokenHash });
    return { sent: false };
  }

  recordAudit({ userId: user._id, userName: user.name, action: "Password reset requested", entityType: "user", entityId: String(user._id), ip });
  return { sent: true };
}

// 6-digit numeric code; retries on the (rare) hash collision with a still-pending code.
async function createUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    const clash = await PasswordResetToken.findOne({
      tokenHash: hashToken(candidate),
      status: "pending",
    })
      .select("_id")
      .lean();
    if (!clash) return candidate;
  }
  throw ApiError.unprocessable("Could not generate a reset code, please try again");
}

export async function resetPassword({ email, code, newPassword }, ip) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  // Uniform error so we never reveal whether the email exists.
  const invalidError = ApiError.badRequest("This reset code is invalid or has expired");
  if (!user) throw invalidError;

  const resetToken = await PasswordResetToken.findOne({
    userId: user._id,
    tokenHash: hashToken(code),
    status: "pending",
  }).select("+tokenHash");

  if (!resetToken || resetToken.expiresAt < new Date()) {
    throw invalidError;
  }

  // Brute-force guard: a wrong entry burns an attempt; 5 wrong entries kill the code.
  resetToken.attempts = (resetToken.attempts ?? 0) + 1;
  if (resetToken.attempts > MAX_RESET_CODE_ATTEMPTS) {
    resetToken.status = "used";
    await resetToken.save();
    throw ApiError.badRequest("Too many incorrect attempts. Please request a new code.");
  }
  await resetToken.save();

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

export async function toAuthUser(user) {
  const publicUser = toPublicUser(user);
  publicUser.permissions = await getEffectivePermissions(user);
  return publicUser;
}
