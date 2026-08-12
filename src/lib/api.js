// Fetch wrapper for the pharmahub-server Express API (`/api/v1`).
// Backend envelope: `{ success, message, data, meta }` on success and
// `{ success: false, error: { message, details } }` on failure. The legacy
// Vercel-style `{ data }` / `{ error }` envelope is still tolerated.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";
const SESSION_KEY = "PharmaHub_session_v2";

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
  if (options.body && !headers["Content-Type"]) {
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
    throw new Error(message);
  }

  if (res.status === 204 || json === null) return null;
  if (json.success === true) return json.data ?? null;
  if (json.data !== undefined) return json.data ?? null; // legacy handler tolerance
  return json;
}
