import { env } from "../config/env.js";

// Session JWT lives in an httpOnly cookie so it is invisible to JavaScript,
// DevTools storage panes and XSS payloads alike.
function parseExpiresMs(value) {
  if (!value) return 7 * 24 * 60 * 60 * 1000;
  const match = /^(\d+)([smhd])?$/i.exec(String(value).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = parseInt(match[1], 10);
  const unit = (match[2] ?? "s").toLowerCase();
  const multiplier = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return amount * multiplier;
}

function cookieOptions() {
  // Cross-site deployments (Vercel frontend -> Render backend) need
  // SameSite=None + Secure; localhost dev stays Lax. Partitioned keeps the
  // cookie working under third-party cookie phase-out in Chromium browsers.
  const crossSite = env.isProduction;
  return {
    httpOnly: true,
    secure: env.cookieSecure || crossSite,
    sameSite: crossSite ? "none" : "lax",
    ...(crossSite ? { partitioned: true } : {}),
    path: "/",
  };
}

export function setAuthCookie(res, token, { remember = true } = {}) {
  // remember=false issues a browser-session cookie (no Max-Age/Expires) that
  // disappears when the browser closes; true keeps it for the JWT lifetime.
  const maxAge = remember ? parseExpiresMs(env.jwtExpiresIn) : undefined;
  res.cookie(env.authCookieName, token, { ...cookieOptions(), maxAge });
}

export function clearAuthCookie(res) {
  res.clearCookie(env.authCookieName, cookieOptions());
}
