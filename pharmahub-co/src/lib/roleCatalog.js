import { Boxes, Crown, Pill, Receipt, Shield, Store } from "lucide-react";

export const ROLE_CATEGORIES = [
  { key: "operations", label: "Operations" },
  { key: "inventory-procurement", label: "Inventory & Procurement" },
  { key: "sales-finance", label: "Sales & Finance" },
  { key: "admin-compliance", label: "Administration" },
];

const TONES = {
  blue: {
    tileBg: "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  green: {
    tileBg: "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30",
    iconColor: "text-green-600 dark:text-green-400",
  },
  orange: {
    tileBg: "bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  teal: {
    tileBg: "bg-teal-50 border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/30",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  purple: {
    tileBg: "bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
};

const ALL_MODULE_KEYS = [
  "dashboard",
  "medicines",
  "batches",
  "inventory",
  "purchases",
  "sales",
  "expiry",
  "audit",
  "users",
  "reports",
  "notifications",
  "ai",
  "admin",
  "shortbook",
  "integrations",
];

/**
 * ROLE_CATALOG — presentation metadata for the real system roles.
 * The role names MUST match the actual role system everywhere else:
 * the backend role list (constants.roles / DEFAULT_ROLE_PERMISSIONS), the
 * permission matrix keys (src/lib/permissions.js ALL_ROLES) and the role
 * values stored on backend users. Because names line up, the Roles tab can
 * resolve module access, permission counts and assigned staff from the real
 * permission store and backend member list — nothing here is hardcoded data.
 * Custom roles are handled separately (CreateCustomRoleDialog) and never
 * modify this catalog.
 */
export const ROLE_CATALOG = [
  // ── Administration ──────────────────────────────────────────────────────────
  {
    roleId: "owner",
    name: "Owner",
    description: "Full unrestricted access across every PharmaHub module and setting.",
    category: "admin-compliance",
    type: "system",
    icon: Crown,
    tone: "purple",
    priority: 1,
    modules: ALL_MODULE_KEYS,
  },
  {
    roleId: "admin",
    name: "Admin",
    description: "Manages staff, roles, and administrative settings with broad access.",
    category: "admin-compliance",
    type: "system",
    icon: Shield,
    tone: "blue",
    priority: 2,
    modules: ALL_MODULE_KEYS,
  },

  // ── Operations ──────────────────────────────────────────────────────────────
  {
    roleId: "pharmacist",
    name: "Pharmacist",
    description:
      "Dispenses medicines, handles prescriptions, and manages inventory and sales records.",
    category: "operations",
    type: "system",
    icon: Pill,
    tone: "green",
    priority: 2,
    modules: ALL_MODULE_KEYS,
  },

  // ── Sales & Finance ──────────────────────────────────────────────────────────
  {
    roleId: "cashier",
    name: "Cashier",
    description: "Runs POS billing, sales transactions, and payment collection at the counter.",
    category: "sales-finance",
    type: "system",
    icon: Receipt,
    tone: "teal",
    priority: 1,
    modules: ["dashboard", "medicines", "batches", "sales", "shortbook"],
  },

  // ── Inventory & Procurement ──────────────────────────────────────────────────
  {
    roleId: "store-keeper",
    name: "Store Keeper",
    description: "Receives stock, tracks batches, and handles inventory counts and movements.",
    category: "inventory-procurement",
    type: "system",
    icon: Store,
    tone: "orange",
    priority: 2,
    modules: [
      "dashboard",
      "medicines",
      "batches",
      "inventory",
      "expiry",
      "audit",
      "notifications",
      "shortbook",
    ],
  },
  {
    roleId: "inventory-manager",
    name: "Inventory Manager",
    description: "Owns inventory, batches, expiry, audits, and supplier purchase operations.",
    category: "inventory-procurement",
    type: "system",
    icon: Boxes,
    tone: "orange",
    priority: 1,
    modules: ALL_MODULE_KEYS,
  },
];

const FALLBACK_ROLE = {
  roleId: "custom-role",
  name: "Custom Role",
  description: "Custom access policy defined by organizational requirements.",
  category: "admin-compliance",
  type: "custom",
  icon: Shield,
  tone: "blue",
  priority: 3,
  modules: [],
};

export function getRoleTone(tone) {
  return TONES[tone] ?? TONES.blue;
}

export function getRoleByName(name) {
  return ROLE_CATALOG.find((r) => r.name === name) ?? FALLBACK_ROLE;
}

export function getRoleById(roleId) {
  return ROLE_CATALOG.find((r) => r.roleId === roleId) ?? FALLBACK_ROLE;
}

export function getRoleIcon(name) {
  return getRoleByName(name).icon;
}

export function getRoleDescription(name) {
  return getRoleByName(name).description;
}

export function categoryLabel(key) {
  return ROLE_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
