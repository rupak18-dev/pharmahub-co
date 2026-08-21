// Fetch wrapper for the pharmahub-server Express API (`/api/v1`).
// Auth is session-cookie based: the server sets an httpOnly cookie and the
// browser sends it automatically via `credentials: "include"`. No token is
// ever stored in localStorage or touched by JS.
//
// Backend envelope: `{ success, message, data, meta }` on success and
// `{ success: false, error: { message, details } }` on failure.

function resolveApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) return fromEnv;
  // Hostname-based fallback (not build-mode based): Render serves the app via
  // the dev server, so `import.meta.env.PROD` is false there. Any host that is
  // not the local dev machine gets the production backend, which keeps both
  // Render and Vercel working even if VITE_API_URL is left unset.
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
      return "http://localhost:5000/api/v1";
    }
  }
  return "https://pharmahub-server.onrender.com/api/v1";
}

export const API_BASE = resolveApiBase();

export function resolveAssetUrl(path) {
  if (!path) return null;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:"))
    return path;
  if (path.startsWith("/")) {
    const origin = API_BASE.replace(/\/api\/v1\/?$/, "");
    return `${origin}${path}`;
  }
  return path;
}

export function isNetworkError(err) {
  return (
    err instanceof TypeError ||
    (typeof err?.message === "string" &&
      /fetch|network|load failed/i.test(err.message))
  );
}

function withLimit(url) {
  if (url.includes("?") || /\/([0-9a-fA-F]{24})$/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}limit=100`;
}

const SESSION_KEY = "PharmaHub_session_v2";

function getSessionToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.token || null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const finalUrl = !options.method || options.method === "GET" ? withLimit(url) : url;
  const headers = { ...(options.headers ?? {}) };
  const token = getSessionToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(finalUrl, { ...options, headers, credentials: "include" });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON response (e.g. the SPA index.html fallback) — json stays null
  }

  if (!res.ok) {
    const message =
      json?.error?.message ??
      json?.error ??
      (typeof json?.error === "string" ? json.error : null) ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return { status: res.status, json };
}

// Unwraps the envelope to `data` for the callers that want the payload directly.
export async function apiRequest(path, options = {}) {
  const { status, json } = await request(path, options);
  if (status === 204 || json === null) return null;
  if (json.success === true) return json.data ?? null;
  if (json.data !== undefined) return json.data ?? null; // legacy handler tolerance
  return json;
}

function toJsonBody(body) {
  if (body === undefined || body === null) return undefined;
  return typeof body === "string" ? body : JSON.stringify(body);
}

// Returns the full `{ success, data, ... }` envelope, which the catalog and
// medicines hooks rely on (`res.success`, `res.data`).
export const api = {
  get: async (path, options = {}) => (await request(path, { ...options, method: "GET" })).json,
  post: async (path, body, options = {}) =>
    (await request(path, { ...options, method: "POST", body: toJsonBody(body) })).json,
  patch: async (path, body, options = {}) =>
    (await request(path, { ...options, method: "PATCH", body: toJsonBody(body) })).json,
  delete: async (path, options = {}) =>
    (await request(path, { ...options, method: "DELETE" })).json,
};
