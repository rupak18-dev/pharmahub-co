import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host = env.smtpHost;
  const port = env.smtpPort;
  const secure = env.smtpSecure;
  const user = env.smtpUser;
  const pass = env.smtpPassword;

  if (!host || !user || !pass) {
    logger.warn("SMTP not configured — emails will be logged to console only");
    return null;
  }

  _transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  return _transporter;
}

export async function sendMail({ to, subject, html }) {
  const from = env.mailFrom || env.smtpUser;
  const transporter = getTransporter();

  if (!transporter) {
    logger.info(`[email:console] To: ${to} | Subject: ${subject}`);
    return { accepted: [to], rejected: [] };
  }

  const info = await transporter.sendMail({ from, to, subject, html });
  logger.info(`Email sent to ${to}: ${info.messageId}`);
  return info;
}
