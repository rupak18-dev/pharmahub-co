export const ALL_ROLES = [
  "Owner",
  "Admin",
  "Pharmacist",
  "Cashier",
  "Store Keeper",
  "Inventory Manager",
];
export const ALL_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "medicines", label: "Medicines" },
  { key: "batches", label: "Batches" },
  { key: "inventory", label: "Inventory" },
  { key: "purchases", label: "Purchases" },
  { key: "shortbook", label: "Shortbook" },
  { key: "sales", label: "Sales & POS" },
  { key: "expiry", label: "Expiry" },
  { key: "audit", label: "Stock Audit" },
  { key: "users", label: "Users & Roles" },
  { key: "reports", label: "Reports" },
  { key: "notifications", label: "Notifications" },
  { key: "ai", label: "AI Insights" },
  { key: "admin", label: "System Admin" },
  { key: "integrations", label: "Integrations" },
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
  Admin: role(() => all()),
  Pharmacist: role((m) => {
    if (m === "sales") return { ...all(), delete: false, approve: false };
    if (["medicines", "batches", "inventory", "expiry", "notifications"].includes(m))
      return { ...viewExport(), update: true };
    if (["dashboard", "reports", "ai"].includes(m)) return viewExport();
    return view();
  }),
  Cashier: role((m) => {
    if (m === "shortbook") return view();
    if (m === "sales") return { ...none(), view: true, create: true };
    if (["dashboard", "medicines", "batches"].includes(m)) return view();
    return none();
  }),
  "Store Keeper": role((m) => {
    if (m === "shortbook") return view();
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
};
export function can(matrix, role, module, action) {
  return matrix[role]?.[module]?.[action] ?? false;
}
