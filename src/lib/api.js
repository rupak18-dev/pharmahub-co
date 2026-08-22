// Fetch wrapper for the pharmahub-server Express API (`/api/v1`).
// Auth is session-cookie based: the server sets an httpOnly cookie at login
// and the browser sends it automatically via `credentials: "include"`.
// No token is ever exposed to JavaScript — nothing is stored in
// localStorage/sessionStorage or visible in DevTools storage panes.
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
export const API_BASE_URL = API_BASE;

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
    (typeof err?.message === "string" && /fetch|network|load failed/i.test(err.message))
  );
}

function withLimit(url) {
  if (url.includes("?") || /\/([0-9a-fA-F]{24})$/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}limit=100`;
}

// Custom header required by the server on mutating requests — cross-site
// form posts cannot add it, which gives lightweight CSRF protection for the
// cookie session.
const CLIENT_HEADER = { "X-PharmaHub-Client": "web" };

const DEFAULT_TIMEOUT_MS = 30000;

async function request(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const finalUrl = !options.method || options.method === "GET" ? withLimit(url) : url;
  const headers = {
    ...CLIENT_HEADER,
    ...(options.headers ?? {}),
  };

  // Never set Content-Type header when sending FormData, Blob, or ArrayBuffer.
  // The browser fetch API must automatically generate the multipart boundary.
  const isBinaryOrMultipart =
    (typeof FormData !== "undefined" && options.body instanceof FormData) ||
    (typeof Blob !== "undefined" && options.body instanceof Blob) ||
    (typeof ArrayBuffer !== "undefined" && options.body instanceof ArrayBuffer);

  if (options.body && !headers["Content-Type"] && !isBinaryOrMultipart) {
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
  if (text && (text.startsWith("{") || text.startsWith("["))) {
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }
  }

  if (!res.ok) {
    const message =
      json?.error?.message ??
      json?.error ??
      (typeof json?.error === "string" ? json.error : null) ??
      json?.message ??
      (text && text.length < 200 && !text.includes("<!DOCTYPE") ? text : null) ??
      `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = json;
    throw error;
  }

  return { status: res.status, json, text };
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
