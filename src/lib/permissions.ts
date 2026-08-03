import type { ModuleKey, PermissionAction, PermissionMatrix, RoleName } from "./types";

export const ALL_ROLES: RoleName[] = [
  "Owner",
  "Admin",
  "Pharmacist",
  "Cashier",
  "Store Keeper",
  "Inventory Manager",
];

export const ALL_MODULES: { key: ModuleKey; label: string }[] = [
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
  { key: "admin", label: "System Admin" },
];

export const ALL_ACTIONS: PermissionAction[] = [
  "view",
  "create",
  "update",
  "delete",
  "approve",
  "export",
];

const all = (): Record<PermissionAction, boolean> => ({
  view: true,
  create: true,
  update: true,
  delete: true,
  approve: true,
  export: true,
});
const none = (): Record<PermissionAction, boolean> => ({
  view: false,
  create: false,
  update: false,
  delete: false,
  approve: false,
  export: false,
});
const view = (): Record<PermissionAction, boolean> => ({ ...none(), view: true });
const viewExport = (): Record<PermissionAction, boolean> => ({ ...view(), export: true });

function role(fn: (m: ModuleKey) => Record<PermissionAction, boolean>) {
  return Object.fromEntries(ALL_MODULES.map((m) => [m.key, fn(m.key)])) as Record<
    ModuleKey,
    Record<PermissionAction, boolean>
  >;
}

export const DEFAULT_PERMISSIONS: PermissionMatrix = {
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
    if (m === "sales") return { ...none(), view: true, create: true };
    if (["dashboard", "medicines", "batches"].includes(m)) return view();
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
};

export function can(
  matrix: PermissionMatrix,
  role: RoleName,
  module: ModuleKey,
  action: PermissionAction,
): boolean {
  return matrix[role]?.[module]?.[action] ?? false;
}
