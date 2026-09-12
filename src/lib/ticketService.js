import { apiRequest, isNetworkError } from "./api";
import { db } from "./db";

export function generateTicketId() {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `PH-TKT-${year}-${randomDigits}`;
}

/**
 * Service to submit and manage support tickets.
 * Communicates with backend /api/v1/tickets and falls back gracefully to local reactive storage
 * if the backend is offline.
 */
export const ticketService = {
  async raiseTicket({
    title,
    issueType,
    description,
    severity = "medium",
    screenshot = null,
    userEmail = "",
    userName = "",
    userRole = "Staff",
    orgName = "PharmaHub Pharmacy",
  }) {
    const payload = {
      title: title.trim(),
      issueType: issueType.trim(),
      description: description.trim(),
      severity,
      screenshot,
      userEmail: userEmail?.trim() || "",
      userName: userName?.trim() || "PharmaHub User",
      userRole,
      orgName,
    };

    try {
      const result = await apiRequest("http://localhost:5000/api/v1/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (result) {
        // Synchronize into client db reactive store
        db.set((d) => {
          const list = Array.isArray(d.tickets) ? d.tickets : [];
          d.tickets = [result, ...list.filter((t) => t.ticketId !== result.ticketId)];
        });
        return result;
      }
    } catch (err) {
      if (!isNetworkError(err)) {
        // If it's a real validation error from server, let it throw
        throw err;
      }
      console.warn("[ticketService] Backend unreachable, saving ticket locally:", err.message);
    }

    // Local fallback when backend server is offline or in development
    const ticketId = generateTicketId();
    const localTicket = {
      id: db.uid(),
      ticketId,
      title: payload.title,
      issueType: payload.issueType,
      description: payload.description,
      severity: payload.severity,
      screenshot: payload.screenshot,
      status: "open",
      userName: payload.userName,
      userEmail: payload.userEmail,
      userRole: payload.userRole,
      orgName: payload.orgName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.set((d) => {
      const list = Array.isArray(d.tickets) ? d.tickets : [];
      d.tickets = [localTicket, ...list];
    });

    return localTicket;
  },

  async listTickets() {
    try {
      const data = await apiRequest("/tickets");
      if (Array.isArray(data)) {
        // Sync local
        db.set((d) => {
          d.tickets = data;
        });
        return data;
      }
    } catch (err) {
      if (!isNetworkError(err)) {
        console.error("[ticketService] Error fetching tickets:", err);
      }
    }

    // Return local tickets
    return db.get().tickets || [];
  },

  async getTicket(ticketId) {
    try {
      const data = await apiRequest(`/tickets/${ticketId}`);
      if (data) return data;
    } catch {
      // ignore
    }

    const local = (db.get().tickets || []).find(
      (t) => t.ticketId === ticketId || t.id === ticketId || t._id === ticketId,
    );
    return local || null;
  },
};
