import { ROLE_CATALOG } from "./roleCatalog";

export const ALL_ROLES = ROLE_CATALOG.map((r) => r.name);
export const ALL_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "medicines", label: "Medicines" },
  { key: "batches", label: "Batches" },
  { key: "inventory", label: "Inventory" },
  { key: "purchases", label: "Purchases" },
  { key: "sales", label: "Sales & POS" },
  { key: "expiry", label: "Expiry" },
  { key: "audit", label: "Stock Audit" },
  { key: "users", label: "Users & Roles" },
  { key: "reports", label: "Reports" },
  { key: "notifications", label: "Notifications" },
  { key: "ai", label: "AI Insights" },
  { key: "admin", label: "Profile" },
];
export const ALL_ACTIONS = ["view", "create", "update", "delete", "approve", "export"];
const all = () => ({
  view: true,
  create: true,
  update: true,
  delete: true,
  approve: true,
  export: true,
});
const none = () => ({
  view: false,
  create: false,
  update: false,
  delete: false,
  approve: false,
  export: false,
});
const view = () => ({ ...none(), view: true });
const viewExport = () => ({ ...view(), export: true });
function role(fn) {
  return Object.fromEntries(ALL_MODULES.map((m) => [m.key, fn(m.key)]));
}
export const DEFAULT_PERMISSIONS = {
  Owner: role(() => all()),
  Administrator: role(() => all()),
  "Pharmacy Manager": role((m) => {
    if (["medicines", "batches", "sales"].includes(m)) return { ...all(), delete: false };
    if (["inventory", "purchases", "expiry", "audit", "notifications"].includes(m)) return all();
    if (["dashboard", "reports"].includes(m)) return { ...all(), delete: false };
    if (["users", "ai"].includes(m)) return view();
    if (m === "admin") return { ...view(), update: true };
    return none();
  }),
  "Senior Pharmacist": role((m) => {
    if (m === "sales") return { ...all(), delete: false };
    if (["medicines", "batches", "inventory", "expiry"].includes(m))
      return { ...viewExport(), update: true };
    if (["dashboard", "reports", "audit"].includes(m)) return viewExport();
    if (["notifications", "ai"].includes(m)) return view();
    if (m === "purchases") return view();
    if (m === "admin") return { ...view(), update: true };
    return none();
  }),
  Pharmacist: role((m) => {
    if (m === "sales") return { ...all(), delete: false, approve: false };
    if (["medicines", "batches", "inventory", "expiry", "notifications"].includes(m))
      return { ...viewExport(), update: true };
    if (["dashboard", "reports", "ai"].includes(m)) return viewExport();
    return view();
  }),
  "Pharmacy Technician": role((m) => {
    if (["medicines", "batches"].includes(m)) return viewExport();
    if (m === "inventory") return { ...viewExport(), create: true, update: true };
    if (["dashboard", "expiry", "sales", "notifications"].includes(m)) return view();
    return none();
  }),
  "Store Keeper": role((m) => {
    if (["inventory", "batches"].includes(m)) return { ...view(), create: true, update: true };
    if (["dashboard", "medicines", "expiry", "audit", "notifications"].includes(m)) return view();
    return none();
  }),
  "Inventory Manager": role((m) => {
    if (["medicines", "batches", "inventory", "expiry", "audit", "purchases"].includes(m))
      return { ...all(), delete: m === "batches" };
    if (["dashboard", "reports", "notifications", "ai"].includes(m)) return viewExport();
    return view();
  }),
  "Procurement / Purchase Manager": role((m) => {
    if (m === "purchases") return { ...all(), delete: false };
    if (["medicines", "batches", "expiry", "reports", "notifications"].includes(m))
      return viewExport();
    if (m === "inventory") return { ...viewExport(), update: true };
    if (["dashboard", "audit", "sales", "ai"].includes(m)) return view();
    if (m === "admin") return view();
    return none();
  }),
  "Sales & POS Executive": role((m) => {
    if (m === "sales") return { ...all(), delete: false };
    if (["medicines", "inventory"].includes(m)) return viewExport();
    if (["dashboard", "batches", "notifications"].includes(m)) return view();
    return none();
  }),
  "Cashier / Billing Executive": role((m) => {
    if (m === "sales") return { ...none(), view: true, create: true };
    if (["dashboard", "medicines", "batches"].includes(m)) return view();
    return none();
  }),
  "Accounts / Finance Manager": role((m) => {
    if (["sales", "purchases", "reports", "audit"].includes(m)) return viewExport();
    if (
      ["dashboard", "medicines", "batches", "inventory", "expiry", "notifications", "ai"].includes(
        m,
      )
    )
      return view();
    if (m === "users") return view();
    if (m === "admin") return { ...view(), update: true };
    return none();
  }),
  "Warehouse Manager": role((m) => {
    if (["inventory", "batches"].includes(m)) return all();
    if (m === "purchases") return { ...viewExport(), update: true };
    if (["medicines", "expiry", "audit", "notifications"].includes(m)) return viewExport();
    if (["dashboard", "reports", "sales"].includes(m)) return view();
    if (m === "admin") return view();
    return none();
  }),
  "Quality & Compliance Officer": role((m) => {
    if (["expiry", "audit"].includes(m)) return all();
    if (["medicines", "batches", "inventory", "reports", "notifications"].includes(m))
      return viewExport();
    if (["dashboard", "purchases", "sales", "ai"].includes(m)) return view();
    if (m === "admin") return view();
    return none();
  }),
  Auditor: role((m) => {
    if (["audit", "reports"].includes(m)) return viewExport();
    if (
      [
        "dashboard",
        "medicines",
        "batches",
        "inventory",
        "purchases",
        "sales",
        "expiry",
        "users",
        "notifications",
        "ai",
      ].includes(m)
    )
      return view();
    if (m === "admin") return { ...view(), update: true };
    return none();
  }),
};
export function can(matrix, role, module, action) {
  return matrix[role]?.[module]?.[action] ?? false;
}
