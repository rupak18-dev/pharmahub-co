// Fetch wrapper for the pharmahub-server Express API (`/api/v1`).
// Auth is session-cookie based: the server sets an httpOnly cookie and the
// browser sends it automatically via `credentials: "include"`. No token is
// ever stored in localStorage or touched by JS.
//
// Backend envelope: `{ success, message, data, meta }` on success and
// `{ success: false, error: { message, details } }` on failure.
function resolveApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
    // The absolute URL in VITE_API_URL targets this machine (:5000) — only
    // meaningful when the app itself is opened from localhost. Browsing via a
    // LAN IP / tunnel would otherwise try to reach the wrong host.
    if (fromEnv && isLocal) return fromEnv;
    if (isLocal) return "http://localhost:5000/api/v1";
    // Dev served over another hostname: go same-origin so the Vite proxy
    // routes the call (never wakes the sleeping production server).
    if (import.meta.env.DEV) return "/api/v1";
  }
  if (fromEnv) return fromEnv;
  return "https://pharmahub-server.onrender.com/api/v1";
}

export const API_BASE = resolveApiBase();

function withLimit(url) {
  if (url.includes("?") || /\/([0-9a-fA-F]{24})$/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}limit=100`;
}

const SESSION_KEY = "PharmaHub_session_v2";

function getSessionToken() {
  if (typeof window === "undefined") return null;
  try {
    // "Remember me" off keeps the session in sessionStorage only.
    const raw =
      window.localStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.token || null;
  } catch {
    return null;
  }
}

const DEFAULT_TIMEOUT_MS = 30000;

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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(finalUrl, {
      ...options,
      headers,
      credentials: "include",
      signal: options.signal ?? controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error("Request timed out — the server is unreachable or waking up. Try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
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

const API_CACHE_PREFIX = "PharmaHub_apicache_v1:";
const API_CACHE_TTL_MS = 5 * 60 * 1000;

export function getCachedResponse(path) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${API_CACHE_PREFIX}${path}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== "number") return null;
    return {
      data: parsed.data,
      ts: parsed.ts,
      stale: Date.now() - parsed.ts > API_CACHE_TTL_MS,
    };
  } catch {
    return null;
  }
}

function setCachedResponse(path, data) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      `${API_CACHE_PREFIX}${path}`,
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {
    // best-effort cache; ignore quota/unavailable storage
  }
}

// Fires GETs for the given paths once, warming the server and filling the
// response cache so pages hydrate instantly on visit.
export function prefetch(paths) {
  for (const p of paths) {
    apiRequest(p).catch(() => {});
  }
}

// Unwraps the envelope to `data` for the callers that want the payload directly.
// GETs serve cached data instantly (even stale) and revalidate in the
// background, so a slow/waking server never blocks page rendering.
export async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  if (method === "GET" && !options.noCache) {
    const cached = getCachedResponse(path);
    if (cached) {
      if (!cached.stale) return cached.data;
      revalidate(path);
      return cached.data;
    }
  }
  const { status, json } = await request(path, options);
  if (status === 204 || json === null) return null;
  let data;
  if (json.success === true || json.data !== undefined) {
    data = json.data ?? null; // legacy handler tolerance
  } else {
    data = json;
  }
  if (method === "GET") {
    setCachedResponse(path, data);
  }
  return data;
}

function revalidate(path) {
  request(path).then(
    ({ status, json }) => {
      if (status === 204 || json === null) return;
      const data = json.success === true || json.data !== undefined ? (json.data ?? null) : json;
      setCachedResponse(path, data);
    },
    () => {},
  );
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
