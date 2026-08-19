import { apiRequest } from "./api";

// Invitation endpoints. The raw one-time token is only ever sent to the
// backend inside the request URL / body — it is never stored in the browser.
export const invitationService = {
  invite({ name, email, phone, role, message, permissions, featureAccess, accessIds }) {
    const payload = { name, email, phone, role };
    if (message) payload.message = message;
    if (permissions && Object.keys(permissions).length > 0) payload.permissions = permissions;
    if (featureAccess && Object.keys(featureAccess).length > 0)
      payload.featureAccess = featureAccess;
    if (accessIds && accessIds.length > 0) payload.accessIds = accessIds;
    return apiRequest("/users/invite", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getInvitation(token) {
    return apiRequest(`/users/invite/${token}`);
  },

  accept({ token, name, password, phone }) {
    const payload = { token, name, password };
    if (phone) payload.phone = phone;
    return apiRequest("/users/invitations/accept", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  list() {
    return apiRequest("/users/invitations");
  },

  resend(id) {
    return apiRequest(`/users/invite/${id}/resend`, { method: "POST" });
  },

  cancel(id) {
    return apiRequest(`/users/invite/${id}`, { method: "DELETE" });
  },

  getLink(id) {
    return apiRequest(`/users/invite/${id}/link`);
  },
};
