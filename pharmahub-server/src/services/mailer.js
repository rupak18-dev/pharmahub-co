import nodemailer from "nodemailer";

import { env, isEmailConfigured } from "../config/env.js";
import { logger } from "../core/logger.js";

let transporterCache = null;
// Previously this flag was computed once at module-load time, which caused
// a race condition: if dotenv hadn't finished loading before this module was
// imported the flag would be stuck `true` forever even with valid credentials.
// It is now evaluated lazily inside getTransporter() on every call.

function getTransporter() {
  // Re-evaluate on every call so a runtime env change or late dotenv load is
  // always picked up. The transporter is only recreated when configuration
  // actually changes (cache is intentionally not invalidated on every call).
  const configured = isEmailConfigured();
  if (!configured) {
    // Invalidate any cached transporter that might be pointing at a previous
    // (no-longer-valid) configuration so we don't accidentally reuse it.
    transporterCache = null;
    return null;
  }
  if (!transporterCache) {
    transporterCache = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporterCache;
}

/**
 * Startup validation — warns in development, fails safely in production.
 * Never logs the SMTP password or any credential value.
 */
export function validateEmailConfig() {
  const missing = [];
  if (!env.smtp.host) missing.push("SMTP_HOST");
  if (!env.smtp.port) missing.push("SMTP_PORT");
  if (!env.smtp.user) missing.push("SMTP_USER");
  if (!env.smtp.pass) missing.push("SMTP_PASSWORD");
  if (!env.smtp.from && !env.smtp.user) missing.push("MAIL_FROM");

  if (missing.length === 0) {
    logger.info(
      `SMTP configured (host=${env.smtp.host}:${env.smtp.port}, secure=${env.smtp.secure}, from=${env.smtp.from || env.smtp.user})`,
    );
    return true;
  }

  const message = `Incomplete SMTP configuration — email delivery will not work. Missing: ${missing.join(", ")}`;
  if (env.isProduction) {
    logger.error(message);
    return false;
  }
  logger.warn(`${message} (development mode — email sending will be skipped)`);
  return false;
}

export function isEmailEnabled() {
  return isEmailConfigured();
}

export async function sendEmail({ to, subject, text, html, attachments } = {}) {
  const recipient = Array.isArray(to) ? to.join(", ") : to;
  logger.info(`[MAIL DEBUG] sendEmail entered — recipient=${recipient} subject="${subject}"`);
  const transporter = getTransporter();
  if (!transporter) {
    if (env.isProduction) {
      throw new Error("Email is not configured — refusing to pretend email was sent.");
    }
    logger.warn("SMTP not configured; email delivery skipped");
    logger.info(`[MAIL DEBUG] sendResult=skipped (SMTP not configured) recipient=${recipient}`);
    return { skipped: true };
  }
  try {
    const fromAddress = env.smtp.from || env.smtp.user || "no-reply@pharmahub.local";
    const fromName = env.smtp.fromName || "PharmaHub";
    const from = `${fromName} <${fromAddress}>`;
    const info = await transporter.sendMail({
      from,
      replyTo: fromAddress,
      to: recipient,
      subject,
      text,
      html,
      attachments,
    });
    logger.info(
      `[MAIL DEBUG] sendResult=success messageId=${info.messageId} recipient=${recipient}`,
    );
    return { skipped: false, messageId: info.messageId };
  } catch (err) {
    logger.error(
      `[MAIL DEBUG] sendResult=failure recipient=${recipient} error=${err?.message ?? err}`,
    );
    throw err;
  }
}

export const sendMail = sendEmail;
