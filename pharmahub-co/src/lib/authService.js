import { apiRequest } from "./api";

// Thin wrapper around the backend auth/user endpoints. All calls return the
// unwrapped `data` payload from the `{ success, message, data }` envelope.
// HTTP/validation errors throw (handled by callers); network errors surface
// as fetch TypeErrors so callers can fall back to the local database.
export const authService = {
  async login({ email, password }) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe() {
    return apiRequest("/users/me");
  },

  async updateMyProfile(payload) {
    return apiRequest("/users/me/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // Profile image upload — multipart/form-data (a File can never be sent as
  // JSON). The browser sets the multipart boundary automatically; apiRequest
  // only adds a Content-Type header for string bodies, so it is left alone.
  async uploadAvatar(file) {
    const form = new FormData();
    form.append("file", file);
    return apiRequest("/users/me/avatar", { method: "PUT", body: form });
  },

  async removeAvatar() {
    return apiRequest("/users/me/avatar", { method: "DELETE" });
  },

  async changePassword({ currentPassword, newPassword }) {
    return apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async requestPasswordReset(email) {
    return apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword({ token, newPassword }) {
    return apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },
};

// True only when the request never reached the backend (offline / server
// down / blocked port). HTTP error responses produce a normal Error instead.
export function isNetworkError(error) {
  return Boolean(error && (error instanceof TypeError || error.name === "TypeError"));
}
