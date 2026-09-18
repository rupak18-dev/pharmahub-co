// Fetch wrapper for the pharmahub-server Express API (`/api/v1`).
// Backend envelope: `{ success, message, data, meta }` on success and
// `{ success: false, error: { message, details } }` on failure. The legacy
// Vercel-style `{ data }` / `{ error }` envelope is still tolerated.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5050/api/v1";
export const API_BASE_URL = API_BASE;
const SESSION_KEY = "PharmaHub_session_v2";

// Backend-origin resolution for relative asset paths the API returns (e.g.
// "/uploads/profile/x.jpg"). The backend (5050) and the dev UI (5100) are
// different origins, so absolute paths must never be used as-is.
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

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ token }));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

// A TypeError from fetch means the backend is unreachable (network failure) —
// callers can fall back to offline/local behavior. Anything else is a real API
// error and must surface as such.
export function isNetworkError(error) {
  return error instanceof TypeError || (error && error.name === "TypeError");
}

function withLimit(url) {
  if (url.includes("?") || /\/([0-9a-fA-F]{24})$/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}limit=100`;
}

export async function apiRequest(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const finalUrl = !options.method || options.method === "GET" ? withLimit(url) : url;
  const headers = { ...(options.headers ?? {}) };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  // Only string bodies are JSON. FormData/Blob bodies must keep the browser's
  // automatically-generated multipart boundary (Content-Type is omitted).
  if (typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(finalUrl, { ...options, headers });
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
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204 || json === null) return null;
  if (json.success === true) return json.data ?? null;
  if (json.data !== undefined) return json.data ?? null; // legacy handler tolerance
  return json;
}
