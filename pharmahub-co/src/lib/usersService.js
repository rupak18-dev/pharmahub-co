import { apiRequest } from "./api";

// Backend user management endpoints. These are the single source of truth for
// the Users tab — the local database is only a fallback when the API is
// unreachable (network error), never a place to fabricate success.
export const usersService = {
  list(params = {}) {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") query.set(k, v);
    }
    const qs = query.toString();
    return apiRequest(`/users${qs ? `?${qs}` : ""}`);
  },

  get(id) {
    return apiRequest(`/users/${id}`);
  },

  create(payload) {
    return apiRequest("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id, payload) {
    return apiRequest(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  setStatus(id, status) {
    return apiRequest(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  remove(id) {
    return apiRequest(`/users/${id}`, { method: "DELETE" });
  },
};
