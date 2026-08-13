/**
 * Service layer for the Integrations module.
 * Mirrors the Reports module pattern (reportService.js): talks to the backend
 * API first and never fabricates connection state.
 *
 * Backend contract the UI is ready for:
 *   GET  /integrations            -> { data: [{ id, key, status, config, ... }] }
 *   GET  /integrations/:id        -> { data: { id, key, status, config, ... } }
 *   POST /integrations/:id/connect   body { config? }  -> { data: {...} }
 *   PUT  /integrations/:id/configure body { config }   -> { data: {...} }
 *   POST /integrations/:id/disconnect                   -> { data: {...} }
 *
 * IMPORTANT: Nothing here writes to localStorage. Connected state is always
 * whatever the backend reports. If the backend is unreachable the UI shows the
 * empty state (zero integrations) instead of a fake "Connected" chip.
 */

const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000/api/v1/integrations"
    : "/api/v1/integrations";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Integration request failed (${res.status})`);
  }
  return res.json();
}

/**
 * List all integrations and their backend connection state.
 * Returns [] when the backend is unreachable so the page renders a clean
 * empty state — never fake "connected" records.
 */
export async function getIntegrations() {
  try {
    const json = await request("");
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function getIntegration(id) {
  try {
    const json = await request(`/${id}`);
    return json.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Start the real connect flow for an integration. Resolves with the backend
 * confirmation record; rejects when the backend cannot confirm the connection
 * so the UI never shows a fabricated success state.
 */
export async function connectIntegration(id, config = {}) {
  const json = await request(`/${id}/connect`, {
    method: "POST",
    body: JSON.stringify({ config }),
  });
  return json.data ?? json;
}

/**
 * Push configuration updates for a connected integration to the backend.
 */
export async function configureIntegration(id, config = {}) {
  const json = await request(`/${id}/configure`, {
    method: "PUT",
    body: JSON.stringify({ config }),
  });
  return json.data ?? json;
}

/**
 * Ask the backend to disconnect an integration.
 */
export async function disconnectIntegration(id) {
  const json = await request(`/${id}/disconnect`, {
    method: "POST",
  });
  return json.data ?? json;
}

/**
 * Resolve the real WhatsApp destination the backend configured for the
 * connected WhatsApp integration. Never hardcodes wa.me links — returns null
 * unless the backend actually provides a destination.
 */
export function getWhatsAppDestination(integration) {
  if (!integration || integration.key !== "whatsapp") return null;
  const config = integration.config ?? {};
  return config.destinationUrl ?? config.destination ?? config.waLink ?? null;
}

export function isConnected(integration) {
  return Boolean(integration && (integration.status === "connected" || integration.connected));
}
