#!/usr/bin/env node
/**
 * Safe development test for Gmail SMTP.
 *
 * Usage:
 *   node scripts/test-email.js [recipient@example.com]
 *
 * Recipient defaults to process.env.TEST_EMAIL_TO, then SMTP_USER.
 * Verifies Gmail SMTP authentication and delivery without ever logging the
 * SMTP password or exposing it through any endpoint.
 */

import { env } from "../src/config/env.js";
import { sendEmail, isEmailEnabled } from "../src/services/mailer.js";

const recipient = process.argv[2] || process.env.TEST_EMAIL_TO || env.smtp.user;

if (!recipient) {
  console.error("No recipient. Pass one as an argument or set TEST_EMAIL_TO.");
  process.exit(1);
}

if (!isEmailEnabled()) {
  console.error("SMTP is not configured. Check SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/MAIL_FROM in .env");
  process.exit(1);
}

console.log(`Sending test email from ${env.smtp.from || env.smtp.user} to ${recipient} via ${env.smtp.host}:${env.smtp.port} (secure=${env.smtp.secure})`);

try {
  const result = await sendEmail({
    to: recipient,
    subject: "PharmaHub SMTP test",
    text: "This is a test email from PharmaHub to verify Gmail SMTP delivery.",
    html: "<p>This is a test email from <strong>PharmaHub</strong> to verify Gmail SMTP delivery.</p>",
  });

  if (result.skipped) {
    console.error("Email was skipped (SMTP not configured).");
    process.exit(1);
  }
  console.log(`OK — email accepted by Gmail SMTP. messageId=${result.messageId}`);
  console.log(`Check the inbox of ${recipient} (or pharmahub.team@gmail.com) for the delivery.`);
  process.exit(0);
} catch (err) {
  console.error(`FAILED — ${err.code || err.name || "Error"}: ${err.responseCode ? `SMTP response ${err.responseCode}` : ""} ${err.message}`);
  console.error("Verify the Gmail App Password (NOT the normal password) and that 2-Step Verification is enabled for pharmahub.team@gmail.com.");
  process.exit(1);
}
