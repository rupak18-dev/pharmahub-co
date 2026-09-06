import {
  Receipt,
  ShoppingCart,
  Boxes,
  Pill,
  Users,
  Truck,
  AlertTriangle,
  Landmark,
  Wallet,
  ClipboardList,
} from "lucide-react";

/* =====================================================================
   REPORT MODULE CONFIGURATION
   ---------------------------------------------------------------------
   Every report is built interactively on top of a pharmacy module
   (Sales, Purchases, Inventory, Medicines, Customers, Suppliers, Expiry, GST, Payments, Audit).
   Maps strictly to actual pharmacy entities in PharmaHub database.
   ===================================================================== */

export const REPORT_CATEGORIES = [
  { id: "Sales", label: "Sales" },
  { id: "Purchases", label: "Purchases" },
  { id: "Inventory", label: "Inventory" },
  { id: "Medicines", label: "Medicines" },
  { id: "Customers", label: "Customers" },
  { id: "Suppliers", label: "Suppliers" },
  { id: "Expiry", label: "Expiry" },
  { id: "GST", label: "GST / Tax" },
  { id: "Payments", label: "Payments" },
  { id: "Audit", label: "Audit" },
];

/* Date presets resolved to a concrete { from, to } range. */
export const DATE_PRESETS = {
  today: { label: "Today", resolve: (now) => [now, now] },
  yesterday: {
    label: "Yesterday",
    resolve: (now) => {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return [y, y];
    },
  },
  week: {
    label: "This Week",
    resolve: (now) => {
      const from = new Date(now);
      from.setDate(from.getDate() - from.getDay());
      return [from, now];
    },
  },
  month: {
    label: "This Month",
    resolve: (now) => [
      new Date(now.getFullYear(), now.getMonth(), 1),
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
    ],
  },
  lastMonth: {
    label: "Last Month",
    resolve: (now) => {
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return [new Date(end.getFullYear(), end.getMonth(), 1), end];
    },
  },
  last30: {
    label: "Last 30 Days",
    resolve: (now) => {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return [from, now];
    },
  },
  next90: {
    label: "Next 90 Days",
    resolve: (now) => {
      const to = new Date(now);
      to.setDate(to.getDate() + 90);
      return [now, to];
    },
  },
  fy: {
    label: "This Financial Year",
    resolve: (now) => {
      const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      return [new Date(startYear, 3, 1), new Date(startYear + 1, 2, 31)];
    },
  },
  prevFy: {
    label: "Previous Financial Year",
    resolve: (now) => {
      const startYear = now.getMonth() >= 3 ? now.getFullYear() - 1 : now.getFullYear() - 2;
      return [new Date(startYear, 3, 1), new Date(startYear + 1, 2, 31)];
    },
  },
};

export function resolveDateRange(presetId, now = new Date()) {
  const preset = DATE_PRESETS[presetId] ?? DATE_PRESETS.month;
  const [from, to] = preset.resolve(new Date(now));
  return { from, to, presetId };
}

/* ---------------------------------------------------------------------
   Shared field definitions (dimension columns)
   --------------------------------------------------------------------- */

const F = {
  staff: { key: "staff", label: "Staff" },
  customer: { key: "customer", label: "Customer" },
  medicine: { key: "medicine", label: "Medicine" },
  category: { key: "category", label: "Category" },
  invoice: { key: "invoice", label: "Invoice" },
  billDate: { key: "billDate", label: "Bill Date", date: true },
  purchaseDate: { key: "purchaseDate", label: "Purchase Date", date: true },
  distributor: { key: "distributor", label: "Distributor" },
  paymentMode: { key: "paymentMode", label: "Payment Method" },
  hsnCode: { key: "hsnCode", label: "HSN Code" },
  medicineTags: { key: "medicineTags", label: "Medicine Tags" },
  supplier: { key: "supplier", label: "Supplier" },
  batch: { key: "batch", label: "Batch" },
  expiryDate: { key: "expiryDate", label: "Expiry Date", date: true },
  city: { key: "city", label: "City" },
  customerType: { key: "customerType", label: "Customer Type" },
  stockStatus: { key: "stockStatus", label: "Stock Status" },
  gstSlab: { key: "gstSlab", label: "GST Slab" },
  actionType: { key: "actionType", label: "Action Type" },
  transactionId: { key: "transactionId", label: "Transaction ID" },
};

/* Shared measure definitions (numeric value columns) */
const M = {
  grossSales: { key: "grossSales", label: "Gross Sale Amount", money: true },
  netSales: { key: "netSales", label: "Net Sale Amount", money: true },
  quantity: { key: "quantity", label: "Quantity" },
  discount: { key: "discount", label: "Discount", money: true },
  gst: { key: "gst", label: "GST", money: true },
  profit: { key: "profit", label: "Profit", money: true },
  purchaseAmount: { key: "purchaseAmount", label: "Purchase Amount", money: true },
  purchaseGst: { key: "purchaseGst", label: "GST", money: true },
  purchaseQty: { key: "purchaseQty", label: "Purchase Quantity" },
  stockQty: { key: "stockQty", label: "Stock Quantity" },
  stockValue: { key: "stockValue", label: "Stock Value", money: true },
  expiringQty: { key: "expiringQty", label: "Expiring Quantity" },
  invoiceCount: { key: "invoiceCount", label: "Invoice Count" },
  taxableAmount: { key: "taxableAmount", label: "Taxable Amount", money: true },
  gstAmount: { key: "gstAmount", label: "GST Amount", money: true },
  collectedAmount: { key: "collectedAmount", label: "Collected Amount", money: true },
  transactionCount: { key: "transactionCount", label: "Transaction Count" },
  movementCount: { key: "movementCount", label: "Movement Count" },
  adjustmentCount: { key: "adjustmentCount", label: "Adjustment Count" },
  saleQty: { key: "saleQty", label: "Sale Quantity" },
  saleValue: { key: "saleValue", label: "Sale Value", money: true },
};

/* ---------------------------------------------------------------------
   Report Modules
   --------------------------------------------------------------------- */

export const REPORT_MODULES = [
  {
    id: "sales",
    title: "Sales & Returns",
    category: "Sales",
    description: "Sales invoices, returns, staff and customer performance, discounts and tax.",
    icon: Receipt,
    dateField: "Bill Date",
    defaultDatePreset: "month",
    fields: [
      F.staff,
      F.customer,
      F.medicine,
      F.category,
      F.invoice,
      F.billDate,
      F.paymentMode,
      F.hsnCode,
    ],
    measures: [M.netSales, M.grossSales, M.quantity, M.discount, M.gst, M.profit],
    filters: [
      { key: "staff", label: "Staff" },
      { key: "category", label: "Category" },
      { key: "medicine", label: "Medicine" },
      { key: "customer", label: "Customer" },
      { key: "paymentMode", label: "Payment Method" },
    ],
  },
  {
    id: "purchases",
    title: "Purchases & Purchase Returns",
    category: "Purchases",
    description: "Supplier purchases, purchase returns, GRN invoices and procurement totals.",
    icon: ShoppingCart,
    dateField: "Purchase Date",
    defaultDatePreset: "month",
    fields: [F.supplier, F.medicine, F.category, F.invoice, F.purchaseDate, F.paymentMode, F.batch],
    measures: [M.purchaseAmount, M.purchaseQty, M.purchaseGst],
    filters: [
      { key: "supplier", label: "Supplier" },
      { key: "category", label: "Category" },
      { key: "medicine", label: "Medicine" },
    ],
  },
  {
    id: "inventory",
    title: "Inventory / Stock",
    category: "Inventory",
    description: "Current stock position, batch valuation and stock movement by category.",
    icon: Boxes,
    dateField: "Last Stock Update",
    defaultDatePreset: "month",
    fields: [F.medicine, F.batch, F.category, F.supplier, F.expiryDate, F.stockStatus],
    measures: [M.stockQty, M.stockValue],
    filters: [
      { key: "category", label: "Category" },
      { key: "supplier", label: "Supplier" },
      { key: "stockStatus", label: "Stock Status" },
    ],
  },
  {
    id: "medicines",
    title: "Medicines / Items",
    category: "Medicines",
    description: "Medicine catalog, HSN classification, tags and movement performance.",
    icon: Pill,
    dateField: "As On",
    defaultDatePreset: "month",
    fields: [F.medicine, F.category, F.hsnCode, F.stockStatus],
    measures: [M.stockQty, M.stockValue, M.saleQty, M.saleValue],
    filters: [
      { key: "category", label: "Category" },
      { key: "stockStatus", label: "Stock Status" },
    ],
  },
  {
    id: "customers",
    title: "Customers",
    category: "Customers",
    description: "Customer profiles, purchase history, cities and customer type split.",
    icon: Users,
    dateField: "Purchase Date",
    defaultDatePreset: "month",
    fields: [F.customer, F.city, F.customerType, F.purchaseDate],
    measures: [M.purchaseAmount, M.invoiceCount, M.netSales],
    filters: [
      { key: "customerType", label: "Type" },
      { key: "city", label: "City" },
    ],
  },
  {
    id: "suppliers",
    title: "Suppliers / Distributors",
    category: "Suppliers",
    description: "Supplier purchases, inward volumes and supplier performance.",
    icon: Truck,
    dateField: "Purchase Date",
    defaultDatePreset: "fy",
    fields: [F.supplier, F.city, F.medicine, F.purchaseDate],
    measures: [M.purchaseAmount, M.purchaseQty, M.purchaseGst],
    filters: [
      { key: "supplier", label: "Supplier" },
      { key: "city", label: "City" },
    ],
  },
  {
    id: "expiry",
    title: "Expiry",
    category: "Expiry",
    description: "Batches expiring soon or already expired, grouped by medicine and batch.",
    icon: AlertTriangle,
    dateField: "Expiry Date",
    defaultDatePreset: "next90",
    fields: [F.medicine, F.batch, F.expiryDate, F.category, F.supplier],
    measures: [M.expiringQty, M.stockQty, M.stockValue],
    filters: [
      { key: "supplier", label: "Supplier" },
      { key: "category", label: "Category" },
    ],
  },
  {
    id: "gst",
    title: "GST / Tax",
    category: "GST",
    description: "Taxable turnover and tax liability by GST slab and HSN code.",
    icon: Landmark,
    dateField: "Bill Date",
    defaultDatePreset: "month",
    fields: [F.gstSlab, F.hsnCode, F.customer, F.invoice, F.billDate],
    measures: [M.taxableAmount, M.gstAmount, M.netSales],
    filters: [
      { key: "gstSlab", label: "GST Slab" },
      { key: "hsnCode", label: "HSN Code" },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    category: "Payments",
    description: "Collections, payment modes and transaction counts for the period.",
    icon: Wallet,
    dateField: "Payment Date",
    defaultDatePreset: "month",
    fields: [F.paymentMode, F.customer, F.medicine, F.billDate, F.invoice],
    measures: [M.collectedAmount, M.transactionCount, M.netSales],
    filters: [
      { key: "paymentMode", label: "Payment Method" },
      { key: "customer", label: "Customer" },
    ],
  },
  {
    id: "audit",
    title: "Audit",
    category: "Audit",
    description: "Stock movements, adjustments and activity trail across the pharmacy.",
    icon: ClipboardList,
    dateField: "Transaction Date",
    defaultDatePreset: "month",
    fields: [F.actionType, F.staff, F.medicine, F.transactionId, F.billDate],
    measures: [M.movementCount, M.adjustmentCount, M.quantity],
    filters: [
      { key: "actionType", label: "Action" },
      { key: "staff", label: "Staff" },
    ],
  },
];

export function getModule(moduleId) {
  return REPORT_MODULES.find((m) => m.id === moduleId);
}

export function getFieldDef(module, key) {
  return (module?.fields ?? []).find((f) => f.key === key);
}

export function getMeasureDef(module, key) {
  return (module?.measures ?? []).find((m) => m.key === key);
}

export function getDefaultConfig(module) {
  return {
    moduleId: module.id,
    fields: module.fields[0] ? [module.fields[0].key] : [],
    measures: module.measures[0] ? [module.measures[0].key] : [],
    filters: [],
    datePreset: module.defaultDatePreset ?? "month",
  };
}

/* ---------------------------------------------------------------------
   Automatic report title
   --------------------------------------------------------------------- */

const MEASURE_SUFFIX = {
  grossSales: "Sales Summary",
  netSales: "Sales Report",
  quantity: "Quantity Report",
  discount: "Discount Summary",
  gst: "GST Summary",
  profit: "Profit Summary",
  purchaseAmount: "Purchase Summary",
  purchaseGst: "Purchase GST Summary",
  purchaseQty: "Purchase Quantity Report",
  stockQty: "Stock Summary",
  stockValue: "Stock Summary",
  expiringQty: "Expiry Summary",
  invoiceCount: "Summary",
  taxableAmount: "Taxable Sales Summary",
  gstAmount: "GST Summary",
  collectedAmount: "Payment Summary",
  transactionCount: "Payment Summary",
  movementCount: "Movement Summary",
  adjustmentCount: "Adjustment Summary",
  saleQty: "Sales Report",
  saleValue: "Sales Report",
};

export function generateReportTitle(module, selectedFields, measures) {
  const group = selectedFields[0] ? getFieldDef(module, selectedFields[0]) : null;
  const groupLabel = group?.label ?? module?.title ?? "Custom";
  const firstMeasure = measures[0];
  const suffix = MEASURE_SUFFIX[firstMeasure];
  if (suffix) return `${groupLabel} ${suffix}`;
  return `${groupLabel} Report`;
}

export function buildReportRequest({
  module,
  selectedFields,
  measures,
  filters = [],
  dateFrom,
  dateTo,
}) {
  return {
    module: module?.id ?? "",
    selectedFields,
    groupBy: selectedFields,
    summarizeBy: measures,
    filters,
    dateFrom: dateFrom instanceof Date ? dateFrom.toISOString() : dateFrom,
    dateTo: dateTo instanceof Date ? dateTo.toISOString() : dateTo,
  };
}
