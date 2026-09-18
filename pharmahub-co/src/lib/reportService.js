import { db } from "./db";
import { API_BASE_URL as API_ROOT, apiRequest, isNetworkError } from "./api";

// Reports endpoints live under the shared API root (see ./api.js), so the
// base URL can never drift from the rest of the app (e.g. the VITE_API_URL
// env var, currently http://localhost:5050).
const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? `${API_ROOT}/reports`
    : "/api/v1/reports";

/**
 * Service layer for Reports module.
 * Separates backend API communication from UI components.
 * Operates strictly on REAL database / store records — ZERO demo data.
 *
 * Every call goes through apiRequest(), which attaches the auth token and
 * surfaces real API errors. The local db.js fallback only kicks in for true
 * network failures (TypeError), so validation/authorization problems are shown
 * to the user instead of silently producing an empty local result.
 */
export const reportService = {
  /**
   * Fetch predefined report catalog list
   */
  async getReports() {
    try {
      const data = await apiRequest(`${API_BASE_URL}`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      // Return empty array if API is unreachable
      return [];
    }
  },

  /**
   * Generate custom report based on module, grouping, aggregations, filters, and date range
   */
  async generateCustomReport(payload) {
    try {
      return await apiRequest(`${API_BASE_URL}/custom`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }

    // Fallback: Query actual client store (db.js) — ONLY REAL USER DATA
    return executeLocalQuery(payload);
  },

  /**
   * Fetch user's saved report configurations
   */
  async getSavedReports() {
    try {
      const data = await apiRequest(`${API_BASE_URL}/saved`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
    // Fallback to local store
    const store = db.get();
    return store.savedReports || [];
  },

  /**
   * Save custom report configuration
   */
  async saveReport(config) {
    try {
      return await apiRequest(`${API_BASE_URL}/saved`, {
        method: "POST",
        body: JSON.stringify(config),
      });
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }

    // Fallback to local store
    const savedObj = {
      ...config,
      id: config.id || `saved-${Date.now()}`,
      createdAt: config.createdAt || new Date().toISOString(),
    };

    db.set((d) => {
      if (!d.savedReports) d.savedReports = [];
      const idx = d.savedReports.findIndex((r) => r.id === savedObj.id);
      if (idx >= 0) d.savedReports[idx] = savedObj;
      else d.savedReports.unshift(savedObj);
    });

    return savedObj;
  },

  /**
   * Delete a saved report
   */
  async deleteSavedReport(id) {
    try {
      await apiRequest(`${API_BASE_URL}/saved/${id}`, { method: "DELETE" });
      return;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }

    // Fallback to local store
    db.set((d) => {
      if (d.savedReports) {
        d.savedReports = d.savedReports.filter((r) => r.id !== id);
      }
    });
  },

  /**
   * Fetch scheduled report alert rules
   */
  async getScheduledReports() {
    try {
      const data = await apiRequest(`${API_BASE_URL}/schedules`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
    // Fallback to local store
    const store = db.get();
    return store.scheduledReports || [];
  },

  /**
   * Create a scheduled report rule
   */
  async scheduleReport(scheduleData) {
    try {
      return await apiRequest(`${API_BASE_URL}/schedules`, {
        method: "POST",
        body: JSON.stringify(scheduleData),
      });
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }

    // Fallback to local store
    const schedObj = {
      ...scheduleData,
      id: scheduleData.id || `sched-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    db.set((d) => {
      if (!d.scheduledReports) d.scheduledReports = [];
      d.scheduledReports.unshift(schedObj);
    });

    return schedObj;
  },

  /**
   * Delete a scheduled report rule
   */
  async deleteSchedule(id) {
    try {
      await apiRequest(`${API_BASE_URL}/schedules/${id}`, { method: "DELETE" });
      return;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }

    // Fallback to local store
    db.set((d) => {
      if (d.scheduledReports) {
        d.scheduledReports = d.scheduledReports.filter((s) => s.id !== id);
      }
    });
  },

  /* ------------------------------------------------------------------
     Report Data — Sales & Bills (API-only; mutations never fall back to
     a local store, otherwise report numbers would not be real).
     ------------------------------------------------------------------ */

  /** Fetch the list of report data sources with live counts. */
  async getDataSources() {
    const data = await apiRequest(`${API_BASE_URL}/data`);
    return Array.isArray(data) ? data : [];
  },

  /** Fetch sales bills with search/filter/sort/pagination. */
  async getSalesBills(params = {}) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    }
    const query = qs.toString();
    const data = await apiRequest(`${API_BASE_URL}/data/sales${query ? `?${query}` : ""}`);
    return data && Array.isArray(data.items) ? data : { items: [], meta: {} };
  },

  async getSalesBill(id) {
    return apiRequest(`${API_BASE_URL}/data/sales/${id}`);
  },

  async createSalesBill(payload) {
    return apiRequest(`${API_BASE_URL}/data/sales`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateSalesBill(id, payload) {
    return apiRequest(`${API_BASE_URL}/data/sales/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteSalesBill(id) {
    return apiRequest(`${API_BASE_URL}/data/sales/${id}`, { method: "DELETE" });
  },

  /**
   * Upload a bill image for OCR extraction. The server runs tesseract on the
   * image and returns the stored file ref plus an extraction result
   * ({ status: "extracted"|"manual", fields, confidence, warnings }) that the
   * UI shows in a review step before the record is saved.
   */
  async uploadBillImage(file) {
    const form = new FormData();
    form.append("file", file);
    return apiRequest(`${API_BASE_URL}/data/sales/upload`, { method: "POST", body: form });
  },

  /** Validate raw CSV text and return row-level preview + errors. */
  async validateSalesImport(csv) {
    return apiRequest(`${API_BASE_URL}/data/sales/validate-import`, {
      method: "POST",
      body: JSON.stringify({ csv }),
    });
  },

  /**
   * Import validated preview rows. duplicateMode: skip | replace | cancel.
   */
  async importSalesBills(rows, duplicateMode = "skip") {
    return apiRequest(`${API_BASE_URL}/data/sales/import`, {
      method: "POST",
      body: JSON.stringify({ rows, duplicateMode }),
    });
  },

  /** Read-only listing for the other report data sources. */
  async getSourceData(source) {
    return apiRequest(`${API_BASE_URL}/data/${source}`);
  },

  /* ------------------------------------------------------------------
     Report Data — Purchases (documents + orders). Mirrors Sales & Bills.
     ------------------------------------------------------------------ */

  /** Fetch purchases with search/filter/sort/pagination. */
  async getPurchases(params = {}) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    }
    const query = qs.toString();
    const data = await apiRequest(`${API_BASE_URL}/data/purchases${query ? `?${query}` : ""}`);
    return data && Array.isArray(data.items) ? data : { items: [], meta: {} };
  },

  async getPurchase(id) {
    return apiRequest(`${API_BASE_URL}/data/purchases/${id}`);
  },

  async createPurchase(payload) {
    return apiRequest(`${API_BASE_URL}/data/purchases`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updatePurchase(id, payload) {
    return apiRequest(`${API_BASE_URL}/data/purchases/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deletePurchase(id) {
    return apiRequest(`${API_BASE_URL}/data/purchases/${id}`, { method: "DELETE" });
  },

  /** Upload a purchase document (image). The server runs OCR on it and returns
   *  the stored file ref plus an extraction result for the review step. */
  async uploadPurchaseDocument(file) {
    const form = new FormData();
    form.append("file", file);
    return apiRequest(`${API_BASE_URL}/data/purchases/upload`, { method: "POST", body: form });
  },

  /** Validate raw CSV text and return row-level preview + errors. */
  async validatePurchaseImport(csv) {
    return apiRequest(`${API_BASE_URL}/data/purchases/validate-import`, {
      method: "POST",
      body: JSON.stringify({ csv }),
    });
  },

  /** Import validated preview rows. duplicateMode: skip | replace | cancel. */
  async importPurchases(rows, duplicateMode = "skip") {
    return apiRequest(`${API_BASE_URL}/data/purchases/import`, {
      method: "POST",
      body: JSON.stringify({ rows, duplicateMode }),
    });
  },

  /* ------------------------------------------------------------------
     Report Data — Unified Bills manager. One bill-centric endpoint set that
     unions the Sale / Purchase collections with the Reports-owned
     "reportbills" collection, each normalized to a unified superset shape
     tagged with its kind ("sale" | "purchase" | "bill").
     ------------------------------------------------------------------ */

  /** Fetch the unified bill list with search/filter/sort/pagination. */
  async getReportBills(params = {}) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    }
    const query = qs.toString();
    const data = await apiRequest(`${API_BASE_URL}/data/bills${query ? `?${query}` : ""}`);
    return data && Array.isArray(data.items) ? data : { items: [], meta: {} };
  },

  /** KPI summary (total / uploaded / manual / total value) across all bill stores. */
  async getReportBillsSummary() {
    return apiRequest(`${API_BASE_URL}/data/bills/summary`);
  },

  async getReportBill(id) {
    return apiRequest(`${API_BASE_URL}/data/bills/${id}`);
  },

  async createReportBill(payload) {
    return apiRequest(`${API_BASE_URL}/data/bills`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Manually deliver a saved sales bill to the customer on WhatsApp. The bill
   * is always saved server-side; delivery is best-effort and never rolls back
   * the bill. Returns the bill with a `whatsapp` summary.
   */
  async sendReportBillWhatsApp(id) {
    return apiRequest(`${API_BASE_URL}/data/bills/${id}/whatsapp`, { method: "POST" });
  },

  /** Re-attempt a previously failed WhatsApp delivery for a saved bill. */
  async retryReportBillWhatsApp(id) {
    return apiRequest(`${API_BASE_URL}/data/bills/${id}/whatsapp/retry`, { method: "POST" });
  },

  async updateReportBill(id, payload) {
    return apiRequest(`${API_BASE_URL}/data/bills/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteReportBill(id) {
    return apiRequest(`${API_BASE_URL}/data/bills/${id}`, { method: "DELETE" });
  },
};

/**
 * Executes a query against actual db.js collections when backend API is unreachable.
 * STRICT RULE: Only uses actual database records — NO demo data.
 */
function executeLocalQuery(payload) {
  const {
    module,
    selectedFields = [],
    groupBy = [],
    summarizeBy = [],
    filters = [],
    dateFrom,
    dateTo,
  } = payload;
  const store = db.get();

  let dataset = [];
  switch (module) {
    case "sales":
    case "gst":
    case "payments":
      dataset = (store.sales || []).map((s) => ({
        ...s,
        billDate: s.createdAt,
        netSales: s.grandTotal || 0,
        grossSales: s.totalAmount || s.grandTotal || 0,
        quantity: (s.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0),
        discount: s.discountAmount || 0,
        gst: s.gstTotal || 0,
        staff: s.createdBy || "Staff",
        customer: s.customerName || "Walk-in Customer",
        paymentMode: s.paymentMethod || "Cash",
        invoice: s.invoiceNo || s.id,
      }));
      break;

    case "purchases":
      dataset = (store.grns || store.purchaseOrders || []).map((p) => ({
        ...p,
        purchaseDate: p.createdAt,
        purchaseAmount: p.grandTotal || p.totalAmount || 0,
        purchaseQty: (p.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0),
        supplier: p.supplierName || "Supplier",
        invoice: p.invoiceNo || p.id,
        paymentMode: p.paymentMode || "Credit",
      }));
      break;

    case "inventory":
    case "expiry":
      dataset = (store.batches || []).map((b) => {
        const med = (store.medicines || []).find((m) => m.id === b.medicineId);
        return {
          ...b,
          medicine: med?.name || "Medicine",
          category: med?.categoryName || "General",
          batch: b.batchNo || b.id,
          expiryDate: b.expiryDate,
          stockQty: b.currentStock || 0,
          stockValue: (b.currentStock || 0) * (b.purchasePrice || 0),
          stockStatus:
            b.currentStock === 0
              ? "Out of Stock"
              : b.currentStock < (med?.reorderLevel || 50)
                ? "Low Stock"
                : "In Stock",
        };
      });
      break;

    case "medicines":
    case "items":
      dataset = (store.medicines || []).map((m) => ({
        ...m,
        medicine: m.name,
        category: m.categoryName || "General",
        hsnCode: m.hsnCode || "3004",
        stockQty: m.stock || 0,
        stockValue: (m.stock || 0) * (m.unitPrice || 0),
      }));
      break;

    case "customers":
      dataset = (store.sales || [])
        .filter((s) => s.customerName)
        .map((s) => ({
          customer: s.customerName,
          city: s.customerCity || "Local",
          customerType: s.customerType || "Retail",
          purchaseAmount: s.grandTotal || 0,
          purchaseDate: s.createdAt,
          netSales: s.grandTotal || 0,
        }));
      break;

    case "suppliers":
      dataset = (store.suppliers || []).map((sup) => ({
        supplier: sup.name,
        city: sup.city || "Local",
        purchaseAmount: sup.totalPurchaseAmount || 0,
        purchaseQty: sup.totalPurchaseQty || 0,
      }));
      break;

    case "audit":
      dataset = (store.activityLogs || []).map((a) => ({
        actionType: a.action || "Log",
        staff: a.userName || "User",
        transactionId: a.id,
        billDate: a.createdAt,
      }));
      break;

    default:
      dataset = [];
      break;
  }

  // Filter by Date
  if (dateFrom || dateTo) {
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
    const toTime = dateTo ? new Date(dateTo).getTime() : Infinity;

    dataset = dataset.filter((item) => {
      const itemDateStr = item.createdAt || item.billDate || item.purchaseDate || item.expiryDate;
      if (!itemDateStr) return true;
      const t = new Date(itemDateStr).getTime();
      return t >= fromTime && t <= toTime;
    });
  }

  // Apply filters
  if (Array.isArray(filters) && filters.length > 0) {
    dataset = dataset.filter((item) => {
      for (const f of filters) {
        if (!f.field || f.value === undefined || f.value === null || f.value === "") continue;
        const itemVal = item[f.field];
        if (itemVal === undefined) continue;

        const val = f.value;
        switch (f.operator) {
          case "equals":
            if (String(itemVal).toLowerCase() !== String(val).toLowerCase()) return false;
            break;
          case "not_equals":
            if (String(itemVal).toLowerCase() === String(val).toLowerCase()) return false;
            break;
          case "contains":
            if (!String(itemVal).toLowerCase().includes(String(val).toLowerCase())) return false;
            break;
          case "greater_than":
            if (Number(itemVal) <= Number(val)) return false;
            break;
          case "less_than":
            if (Number(itemVal) >= Number(val)) return false;
            break;
        }
      }
      return true;
    });
  }

  if (dataset.length === 0) {
    return {
      columns: [],
      rows: [],
      totals: {},
      message: "No data found for the selected criteria.",
    };
  }

  const primaryGroup = groupBy.length > 0 ? groupBy[0] : selectedFields[0] || null;
  const activeMeasures = summarizeBy.length > 0 ? summarizeBy : [];

  const groupsMap = new Map();
  for (const record of dataset) {
    const gKeyVal = primaryGroup ? String(record[primaryGroup] ?? "Other") : "Total";
    const cur = groupsMap.get(gKeyVal) || { key: gKeyVal, records: [] };
    cur.records.push(record);
    groupsMap.set(gKeyVal, cur);
  }

  const rows = [];
  const totals = {};

  for (const [gKey, gData] of groupsMap.entries()) {
    const row = {};
    if (primaryGroup) {
      row[primaryGroup] = gKey;
    }

    for (const m of activeMeasures) {
      const fieldKey = typeof m === "string" ? m : m.field;
      const agg = typeof m === "string" ? "SUM" : (m.aggregation || "SUM").toUpperCase();
      const vals = gData.records.map((r) => Number(r[fieldKey] ?? 0)).filter((v) => !isNaN(v));

      let resVal = 0;
      if (agg === "COUNT") {
        resVal = gData.records.length;
      } else if (vals.length > 0) {
        if (agg === "SUM") resVal = vals.reduce((a, b) => a + b, 0);
        else if (agg === "AVG") resVal = vals.reduce((a, b) => a + b, 0) / vals.length;
        else if (agg === "MIN") resVal = Math.min(...vals);
        else if (agg === "MAX") resVal = Math.max(...vals);
      }

      row[fieldKey] = Number(resVal.toFixed(2));
      totals[fieldKey] = Number(((totals[fieldKey] || 0) + row[fieldKey]).toFixed(2));
    }

    rows.push(row);
  }

  return {
    rows,
    totals,
    totalRecords: dataset.length,
  };
}
