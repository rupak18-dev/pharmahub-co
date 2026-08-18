import {
  Shield,
  Store,
  Stethoscope,
  Pill,
  Syringe,
  Boxes,
  Receipt,
  Settings,
} from "lucide-react";

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
];

/**
 * ROLE_CATALOG — the single source of truth for all system roles.
 * Only 7 pharmacy-specific roles are defined here. Custom roles are handled
 * separately via the CreateCustomRoleDialog without modifying this catalog.
 */
export const ROLE_CATALOG = [
  // ── Operations ──────────────────────────────────────────────────────────────
  {
    roleId: "pharmacy-manager",
    name: "Pharmacy Manager",
    description:
      "Oversees overall pharmacy and store operations, manages staff, monitors inventory, and has full access to sales and reporting.",
    category: "operations",
    type: "system",
    icon: Store,
    tone: "green",
    priority: 1,
    modules: ALL_MODULE_KEYS,
  },
  {
    roleId: "senior-pharmacist",
    name: "Senior Pharmacist",
    description:
      "Handles prescription processing, medicine dispensing and records, stock review, and supervises other pharmacists.",
    category: "operations",
    type: "system",
    icon: Stethoscope,
    tone: "green",
    priority: 2,
    modules: [
      "dashboard",
      "medicines",
      "batches",
      "inventory",
      "purchases",
      "sales",
      "expiry",
      "audit",
      "reports",
      "notifications",
      "ai",
      "admin",
    ],
  },
  {
    roleId: "pharmacist",
    name: "Pharmacist",
    description:
      "Responsible for medicine dispensing, prescription handling, medicine records, and basic inventory access.",
    category: "operations",
    type: "system",
    icon: Pill,
    tone: "green",
    priority: 2,
    modules: [
      "dashboard",
      "medicines",
      "batches",
      "inventory",
      "sales",
      "expiry",
      "reports",
      "notifications",
      "ai",
    ],
  },
  {
    roleId: "pharmacy-technician",
    name: "Pharmacy Technician",
    description:
      "Supports medicine dispensing, handles inventory updates and stock movement, and has basic medicine records access.",
    category: "operations",
    type: "system",
    icon: Syringe,
    tone: "green",
    priority: 2,
    modules: ["dashboard", "medicines", "batches", "inventory", "sales", "expiry", "notifications"],
  },

  // ── Inventory & Procurement ──────────────────────────────────────────────────
  {
    roleId: "inventory-manager",
    name: "Inventory Manager",
    description:
      "Manages all inventory, monitors stock levels, tracks batches and expiry, and handles purchase/stock management.",
    category: "inventory-procurement",
    type: "system",
    icon: Boxes,
    tone: "orange",
    priority: 1,
    modules: [
      "dashboard",
      "medicines",
      "batches",
      "inventory",
      "purchases",
      "expiry",
      "audit",
      "reports",
      "notifications",
      "ai",
    ],
  },

  // ── Sales & Finance ──────────────────────────────────────────────────────────
  {
    roleId: "cashier-sales-executive",
    name: "Cashier / Sales Executive",
    description:
      "Handles sales, POS billing, customer transactions, payment collection, and sales history.",
    category: "sales-finance",
    type: "system",
    icon: Receipt,
    tone: "teal",
    priority: 1,
    modules: ["dashboard", "medicines", "batches", "sales", "notifications"],
  },

  // ── Administration ───────────────────────────────────────────────────────────
  {
    roleId: "store-administrator",
    name: "Store Administrator",
    description:
      "Manages users and roles, staff access control, organization settings, and all administrative operations.",
    category: "admin-compliance",
    type: "system",
    icon: Settings,
    tone: "purple",
    priority: 3,
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
