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
  // 1. Pharmacy Manager — full access across all modules
  "Pharmacy Manager": role((m) => {
    if (["medicines", "batches", "sales"].includes(m)) return { ...all(), delete: false };
    if (["inventory", "purchases", "expiry", "audit", "notifications"].includes(m)) return all();
    if (["dashboard", "reports"].includes(m)) return { ...all(), delete: false };
    if (["users", "ai"].includes(m)) return view();
    if (m === "admin") return { ...view(), update: true };
    return none();
  }),

  // 2. Senior Pharmacist — clinical access, can supervise pharmacists
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

  // 3. Pharmacist — dispensing, prescriptions, basic inventory
  Pharmacist: role((m) => {
    if (m === "sales") return { ...all(), delete: false, approve: false };
    if (["medicines", "batches", "inventory", "expiry", "notifications"].includes(m))
      return { ...viewExport(), update: true };
    if (["dashboard", "reports", "ai"].includes(m)) return viewExport();
    return view();
  }),

  // 4. Pharmacy Technician — dispensing support, inventory updates
  "Pharmacy Technician": role((m) => {
    if (["medicines", "batches"].includes(m)) return viewExport();
    if (m === "inventory") return { ...viewExport(), create: true, update: true };
    if (["dashboard", "expiry", "sales", "notifications"].includes(m)) return view();
    return none();
  }),

  // 5. Inventory Manager — full inventory, batches, purchases, expiry
  "Inventory Manager": role((m) => {
    if (["medicines", "batches", "inventory", "expiry", "audit", "purchases"].includes(m))
      return { ...all(), delete: m === "batches" };
    if (["dashboard", "reports", "notifications", "ai"].includes(m)) return viewExport();
    return view();
  }),

  // 6. Cashier / Sales Executive — sales, billing, POS
  "Cashier / Sales Executive": role((m) => {
    if (m === "sales") return { ...none(), view: true, create: true, approve: true };
    if (["dashboard", "medicines", "batches", "notifications"].includes(m)) return view();
    return none();
  }),

  // 7. Store Administrator — users, roles, settings, full admin
  "Store Administrator": role(() => all()),
};

export function can(matrix, role, module, action) {
  return matrix[role]?.[module]?.[action] ?? false;
}
