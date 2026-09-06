/**
 * Service layer for the Integrations module.
 * Talks to the pharmahub-server API through the shared apiRequest wrapper
 * (src/lib/api.js) so every request carries the authenticated session token.
 * Connected state is always whatever the backend reports — never fabricated,
 * never mirrored to localStorage.
 *
 * Backend contract (GET /api/v1/integrations, etc.):
 *   GET  /integrations            -> [{ id, key, status, config, ... }]
 *   GET  /integrations/:id        -> { id, key, status, config, ... }
 *   POST /integrations/:id/connect   body { config } -> { ... }
 *   PUT  /integrations/:id/configure body { config } -> { ... }
 *   POST /integrations/:id/disconnect                -> { ... }
 *
 * Gmail (organization-level, Google OAuth, send-only):
 *   GET    /integrations/gmail/connect -> { authorizationUrl }
 *   POST   /integrations/gmail/test    -> { to, message }
 *   DELETE /integrations/gmail         -> { ... }
 */

import { apiRequest, isNetworkError } from "./api";

/**
 * List all integrations and their backend connection state.
 * Network failures (backend unreachable) degrade to [] so the page can render
 * a clean empty state. Real API errors are rethrown for the page to surface.
 */
export async function getIntegrations() {
  try {
    const data = await apiRequest("/integrations");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (isNetworkError(error)) return [];
    throw error;
  }
}

export async function getIntegration(id) {
  const data = await apiRequest(`/integrations/${id}`);
  return data ?? null;
}

/**
 * Start the real connect flow for an integration. Resolves with the backend
 * confirmation record; rejects when the backend cannot confirm the connection
 * so the UI never shows a fabricated success state.
 */
export async function connectIntegration(id, config = {}) {
  return apiRequest(`/integrations/${id}/connect`, {
    method: "POST",
    body: JSON.stringify({ config }),
  });
}

/**
 * Push configuration updates for a connected integration to the backend.
 */
export async function configureIntegration(id, config = {}) {
  return apiRequest(`/integrations/${id}/configure`, {
    method: "PUT",
    body: JSON.stringify({ config }),
  });
}

/**
 * Ask the backend to disconnect an integration.
 */
export async function disconnectIntegration(id) {
  return apiRequest(`/integrations/${id}/disconnect`, {
    method: "POST",
  });
}

/**
 * Start Google OAuth for the organization-level Gmail integration. Resolves
 * with the Google authorization URL the user must visit. The backend never
 * considers Gmail connected until the full OAuth flow completes and Google
 * confirms the account — this only begins that flow.
 */
export async function gmailConnect() {
  try {
    const data = await apiRequest("/integrations/gmail/connect");
    return data?.authorizationUrl ?? null;
  } catch (error) {
    // 503 = Google OAuth is not configured on the server. Show a friendly,
    // actionable message instead of exposing credential variable names to
    // normal users. The technical detail stays in the backend logs.
    if (error?.status === 503) {
      const friendly = new Error(
        "Gmail connection is not available yet. The administrator needs to complete the Google configuration before Gmail can be connected.",
      );
      friendly.status = 503;
      throw friendly;
    }
    throw error;
  }
}

/**
 * Ask the backend to send a REAL test email through the connected Gmail
 * account (Gmail API). Resolves only when Gmail confirms delivery; rejects
 * with the backend error otherwise.
 */
export async function gmailSendTestEmail() {
  return apiRequest("/integrations/gmail/test", {
    method: "POST",
  });
}

/**
 * Disconnect the organization's Gmail integration. The backend clears and
 * revokes the stored credentials. System SMTP email (invitations, password
 * reset, scheduled reports) is separate and unaffected.
 */
export async function gmailDisconnect() {
  return apiRequest("/integrations/gmail", {
    method: "DELETE",
  });
}

/**
 * Resolve the real WhatsApp destination the backend configured for the
 * connected WhatsApp integration. Never hardcodes wa.me links — returns null
 * unless the backend actually provides a destination.
 */
export function getWhatsAppDestination(integration) {
  if (!integration || integration.key !== "whatsapp") return null;
  const config = integration.config ?? {};
  return (
    config.destinationUrl ??
    config.destination ??
    config.waLink ??
    integration.destinationUrl ??
    null
  );
}

export function isConnected(integration) {
  return Boolean(integration && (integration.status === "connected" || integration.connected));
}
