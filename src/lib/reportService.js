import { apiRequest } from "./api";
import { db } from "./db";

const REPORTS = "/reports";

/**
 * Service layer for Reports module.
 * All API calls go through the shared apiRequest wrapper so every request
 * carries the authenticated session token and hits the correct backend URL.
 * Operates strictly on REAL database / store records — ZERO demo data.
 */
export const reportService = {
  /**
   * Fetch predefined report catalog list
   */
  async getReports() {
    try {
      const data = await apiRequest(`${REPORTS}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Generate custom report based on module, grouping, aggregations, filters, and date range
   */
  async generateCustomReport(payload) {
    try {
      const data = await apiRequest(`${REPORTS}/custom`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return data;
    } catch {
      // Fallback: Query actual client store (db.js) — ONLY REAL USER DATA
    }

    return executeLocalQuery(payload);
  },

  /**
   * Fetch user's saved report configurations
   */
  async getSavedReports() {
    try {
      const data = await apiRequest(`${REPORTS}/saved`);
      return Array.isArray(data) ? data : [];
    } catch {
      // Fallback to local store
    }
    const store = db.get();
    return store.savedReports || [];
  },

  /**
   * Save custom report configuration
   */
  async saveReport(config) {
    try {
      const data = await apiRequest(`${REPORTS}/saved`, {
        method: "POST",
        body: JSON.stringify(config),
      });
      return data;
    } catch {
      // Fallback to local store
    }

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
      await apiRequest(`${REPORTS}/saved/${id}`, { method: "DELETE" });
    } catch {
      // Fallback to local store
    }

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
      const data = await apiRequest(`${REPORTS}/schedules`);
      return Array.isArray(data) ? data : [];
    } catch {
      // Fallback to local store
    }
    const store = db.get();
    return store.scheduledReports || [];
  },

  /**
   * Create a scheduled report rule
   */
  async scheduleReport(scheduleData) {
    try {
      const data = await apiRequest(`${REPORTS}/schedules`, {
        method: "POST",
        body: JSON.stringify(scheduleData),
      });
      return data;
    } catch {
      // Fallback to local store
    }

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
      await apiRequest(`${REPORTS}/schedules/${id}`, { method: "DELETE" });
    } catch {
      // Fallback to local store
    }

    db.set((d) => {
      if (d.scheduledReports) {
        d.scheduledReports = d.scheduledReports.filter((s) => s.id !== id);
      }
    });
  },

  /**
   * Create a new report bill (unified bill manager — ReportBill collection)
   */
  async createReportBill(payload) {
    return apiRequest(`${REPORTS}/data/bills`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update an existing report bill
   */
  async updateReportBill(id, payload) {
    return apiRequest(`${REPORTS}/data/bills/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete a report bill
   */
  async deleteReportBill(id) {
    return apiRequest(`${REPORTS}/data/bills/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Send a bill via WhatsApp (or retrieve status)
   */
  async sendReportBillWhatsApp(id) {
    return apiRequest(`${REPORTS}/data/bills/${id}/whatsapp`, {
      method: "POST",
    });
  },

  /**
   * Upload a purchase document (e.g., GRN image) — multipart/form-data.
   * The apiRequest wrapper detects FormData and omits Content-Type so the
   * browser can set the multipart boundary automatically.
   */
  async uploadPurchaseDocument(file) {
    const form = new FormData();
    form.append("file", file);
    return apiRequest(`${REPORTS}/data/purchases/upload`, {
      method: "POST",
      body: form,
    });
  },

  /**
   * Upload a sales bill image — multipart/form-data.
   */
  async uploadSalesBillImage(file) {
    const form = new FormData();
    form.append("file", file);
    return apiRequest(`${REPORTS}/data/sales/upload`, {
      method: "POST",
      body: form,
    });
  },

  /**
   * List sales bills (Report Data — Sales & Bills tab)
   */
  async listSalesBills(params = {}) {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") query.set(k, v);
    }
    const qs = query.toString();
    return apiRequest(`${REPORTS}/data/sales${qs ? `?${qs}` : ""}`);
  },

  /**
   * List purchases (Report Data — Purchases tab)
   */
  async listPurchases(params = {}) {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") query.set(k, v);
    }
    const qs = query.toString();
    return apiRequest(`${REPORTS}/data/purchases${qs ? `?${qs}` : ""}`);
  },

  /**
   * List unified report bills (Report Data — Bills tab)
   */
  async listReportBills(params = {}) {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") query.set(k, v);
    }
    const qs = query.toString();
    return apiRequest(`${REPORTS}/data/bills${qs ? `?${qs}` : ""}`);
  },

  /**
   * Get report data sources overview
   */
  async getDataSources() {
    return apiRequest(`${REPORTS}/data`);
  },

  /**
   * Validate sales CSV import
   */
  async validateSalesImport(csv) {
    return apiRequest(`${REPORTS}/data/sales/validate-import`, {
      method: "POST",
      body: JSON.stringify({ csv }),
    });
  },

  /**
   * Validate purchase CSV import
   */
  async validatePurchaseImport(csv) {
    return apiRequest(`${REPORTS}/data/purchases/validate-import`, {
      method: "POST",
      body: JSON.stringify({ csv }),
    });
  },

  /**
   * Import sales bills from CSV
   */
  async importSalesBills(rows, duplicateMode = "skip") {
    return apiRequest(`${REPORTS}/data/sales/import`, {
      method: "POST",
      body: JSON.stringify({ rows, duplicateMode }),
    });
  },

  /**
   * Import purchases from CSV
   */
  async importPurchases(rows, duplicateMode = "skip") {
    return apiRequest(`${REPORTS}/data/purchases/import`, {
      method: "POST",
      body: JSON.stringify({ rows, duplicateMode }),
    });
  },

  /**
   * Upload a sales bill image — alias for uploadSalesBillImage
   */
  async uploadBillImage(file) {
    return this.uploadSalesBillImage(file);
  },

  /**
   * Get unified report bills (alias for listReportBills used by ReportDataPage)
   */
  async getReportBills(params = {}) {
    return this.listReportBills(params);
  },

  /**
   * Get report bills summary
   */
  async getReportBillsSummary() {
    return apiRequest(`${REPORTS}/data/bills/summary`);
  },

  /**
   * Retry WhatsApp delivery for a bill
   */
  async retryReportBillWhatsApp(id) {
    return apiRequest(`${REPORTS}/data/bills/${id}/whatsapp/retry`, {
      method: "POST",
    });
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
