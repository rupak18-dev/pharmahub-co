import dotenv from "dotenv";

dotenv.config();

// Secrets must come from the environment (.env / hosting provider dashboard).
// The server refuses to boot without them instead of silently using a default.
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[config] Missing required environment variable ${name}. ` +
        `Set it in pharmahub-server/.env (local) or your hosting provider's env settings.`,
    );
  }
  return value;
}

const mongoUri = process.env.MONGO_URI ?? process.env.MONGO_URL ?? requireEnv("MONGO_URI");
const jwtSecret = requireEnv("JWT_SECRET");

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",

  port: parseInt(process.env.PORT ?? "5050", 10),

  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:8080",

  // Canonical MongoDB connection variable.
  mongoUri,

  resetTokenTtlMs: parseInt(process.env.PASSWORD_RESET_TTL_MS ?? "3600000", 10),

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

  authCookieName: process.env.AUTH_COOKIE_NAME ?? "pharmahub_session",
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production",

  corsOrigin: process.env.CORS_ORIGIN ?? "*",

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "900000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? "300", 10),

  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : parseInt(process.env.SMTP_PORT ?? "587", 10) === 465,
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS ?? "",
    from: process.env.MAIL_FROM ?? "",
    fromName: process.env.MAIL_FROM_NAME ?? "PharmaHub",
  },
};

// True when the backend has everything it needs to actually deliver email.
export const isEmailConfigured = () =>
  Boolean(env.smtp.host && env.smtp.user && env.smtp.pass && (env.smtp.from || env.smtp.user));

// Google OAuth — used by the Gmail integration (send-only scope).
export function googleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ??
      `http://localhost:${parseInt(process.env.PORT ?? "5050", 10)}/api/v1/integrations/gmail/callback`,
  };
}

export const isGoogleConfigured = () => {
  const google = googleConfig();
  return Boolean(google.clientId && google.clientSecret && google.redirectUri);
};

// WhatsApp Business Cloud API — used to deliver customer bills (Reports → Bills)
export function whatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    templateName: process.env.WHATSAPP_BILL_TEMPLATE_NAME ?? "",
    templateLang: process.env.WHATSAPP_BILL_TEMPLATE_LANG ?? "en",
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION ?? "v21.0",
    publicUrl:
      process.env.API_PUBLIC_URL ??
      `http://localhost:${parseInt(process.env.PORT ?? "5050", 10)}`,
    currencySymbol: process.env.CURRENCY_SYMBOL ?? "₹",
  };
}

// True when the backend can actually call the WhatsApp Business Cloud API.
export const isWhatsAppConfigured = () => {
  const wa = whatsAppConfig();
  return Boolean(wa.phoneNumberId && wa.accessToken);
};
