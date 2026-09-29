import { apiRequest, isNetworkError } from "./api";

const DEFAULT_SUPPORT_SETTINGS = {
  title: "Help & Support Desk",
  description:
    "Submit support tickets, report technical or inventory issues, and monitor active ticket resolution.",
  supportEmail: "pharmahub.team@gmail.com",
  supportPhone: "1800-PHARMA-HELP",
  slaText: "Priority Live Helpdesk · Standard 4h-24h turnaround",
  helpInfo:
    "Critical issues receive an immediate response within 1 hour. High severity tickets are answered in 4 hours, and standard inquiries within 12-24 hours.",
  categories: [
    {
      id: "billing_pos",
      label: "Billing, POS & Invoicing Issue",
      icon: "CreditCard",
      desc: "Cash register errors, discount discrepancies, tax calculation, thermal bill printing",
    },
    {
      id: "inventory_stock",
      label: "Inventory & Stock Discrepancy",
      icon: "Package",
      desc: "Physical stock vs system count mismatch, negative balance, rack placement",
    },
    {
      id: "medicines_batches",
      label: "Medicine Catalog & Batch Tracking",
      icon: "Pill",
      desc: "Barcode/QR scan failure, batch number collision, missing HSN or salt details",
    },
    {
      id: "expiry_returns",
      label: "Expiry & Returns Management",
      icon: "CalendarClock",
      desc: "Near-expiry alerts, quarantine batch issue, credit note or vendor return error",
    },
    {
      id: "purchases_suppliers",
      label: "Purchase Orders & Supplier Sync",
      icon: "Truck",
      desc: "GRN creation failure, supplier ledger mismatch, purchase invoice upload issue",
    },
    {
      id: "user_access",
      label: "User Access & Permissions",
      icon: "ShieldCheck",
      desc: "Login failure, role capability restrictions, invitation link expired",
    },
    {
      id: "reports_export",
      label: "Reports & PDF/Excel Export",
      icon: "BarChart3",
      desc: "GST report generation error, Excel export broken, sales analytics discrepancies",
    },
    {
      id: "hardware_integrations",
      label: "Integrations & Hardware Setup",
      icon: "Printer",
      desc: "Thermal receipt printer, barcode reader, WhatsApp notification gateway",
    },
    {
      id: "system_bug",
      label: "System Bug / Technical Error",
      icon: "Bug",
      desc: "Unexpected UI glitch, freeze, 500 error code, or performance lag",
    },
    {
      id: "general_inquiry",
      label: "General Inquiry / Feature Feedback",
      icon: "CircleHelp",
      desc: "How-to guidance, new pharmacy feature request, or process questions",
    },
    {
      id: "Other",
      label: "Other",
      icon: "MoreHorizontal",
      desc: "",
    },
  ],
};

export const supportService = {
  getDefaultSettings() {
    return { ...DEFAULT_SUPPORT_SETTINGS };
  },

  /**
   * Fetch global support configuration from backend database.
   * Accessible to all users (read-only).
   */
  async getSettings() {
    try {
      const data = await apiRequest("/support/settings", { noCache: true });
      if (data && typeof data === "object") {
        return {
          ...DEFAULT_SUPPORT_SETTINGS,
          ...data,
          categories:
            Array.isArray(data.categories) && data.categories.length > 0
              ? data.categories
              : DEFAULT_SUPPORT_SETTINGS.categories,
        };
      }
    } catch (err) {
      if (!isNetworkError(err)) {
        console.warn("[supportService] Error fetching settings:", err.message);
      }
    }

    return { ...DEFAULT_SUPPORT_SETTINGS };
  },

  /**
   * Update global support configuration in backend database.
   * Requires Admin or Owner role.
   */
  async updateSettings(settings) {
    const payload = {
      title: settings.title?.trim(),
      description: settings.description?.trim(),
      supportEmail: settings.supportEmail?.trim(),
      supportPhone: settings.supportPhone?.trim(),
      slaText: settings.slaText?.trim(),
      helpInfo: settings.helpInfo?.trim(),
      categories: settings.categories,
    };

    const updated = await apiRequest("/support/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    return updated;
  },

  /**
   * Reply to a ticket. Admin can reply to any ticket and update status;
   * Normal user can reply to their own ticket.
   */
  async replyTicket(ticketId, { message, status }) {
    const payload = {
      message: message.trim(),
      ...(status ? { status } : {}),
    };

    const updated = await apiRequest(`/tickets/${ticketId}/reply`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return updated;
  },

  /**
   * Update ticket status (Admin/Owner or owner user closing).
   */
  async updateStatus(ticketId, { status, description }) {
    const payload = {
      status,
      description: description?.trim(),
    };

    const updated = await apiRequest(`/tickets/${ticketId}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    return updated;
  },

  /**
   * Add custom activity note to timeline (Admin/Owner only).
   */
  async addActivity(ticketId, { title, description, status }) {
    const payload = {
      title: title?.trim(),
      description: description.trim(),
      ...(status ? { status } : {}),
    };

    const updated = await apiRequest(`/tickets/${ticketId}/activity`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return updated;
  },
};
