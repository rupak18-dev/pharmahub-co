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

const denyAll = () => ({
  view: false,
  create: false,
  update: false,
  delete: false,
  approve: false,
  export: false,
});

// Translates the Change Role dialog state into the per-user permission override
// map the backend persists on the User document. The override only ever DENIES —
// modules the Owner did not tick lose access, capabilities turned off lose their
// actions — while role defaults still govern everything left untouched, so the
// dialog can restrict a user but can never escalate a role's powers.
export function buildPermissionOverrides({ role, accessIds = [], features = {} } = {}) {
  const ids = new Set(accessIds);
  const roleDefaults = (role && DEFAULT_PERMISSIONS[role]) || {};
  const overrides = {};

  // Module whitelist: modules not selected are explicitly denied, overriding
  // whatever the role default allows. Modules in the whitelist that the role
  // default does not include are explicitly granted view access.
  for (const mod of ALL_MODULES) {
    if (!ids.has(mod.key)) {
      overrides[mod.key] = denyAll();
    } else if (roleDefaults[mod.key] && !roleDefaults[mod.key].view) {
      overrides[mod.key] = { view: true };
    }
  }

  // Capability toggles map to action-level denials.
  if (features.processSales === false) {
    overrides.sales = { ...(overrides.sales ?? {}), create: false, update: false, approve: false };
  }
  if (features.stockAudit === false) {
    overrides.audit = { ...(overrides.audit ?? {}), create: false, update: false, delete: false };
  }
  if (features.purchasing === false) {
    overrides.purchases = {
      ...(overrides.purchases ?? {}),
      create: false,
      update: false,
      approve: false,
    };
  }
  if (features.dataExport === false) {
    for (const mod of ALL_MODULES) {
      if (overrides[mod.key]) overrides[mod.key].export = false;
    }
  }
  if (features.notifications === false) {
    overrides.notifications = { ...(overrides.notifications ?? {}), view: false };
  }
  if (features.userAdmin === false) {
    overrides.users = {
      ...(overrides.users ?? {}),
      create: false,
      update: false,
      delete: false,
      approve: false,
    };
  }

  return overrides;
}
