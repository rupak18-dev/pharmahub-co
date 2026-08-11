import {
  Crown,
  Shield,
  ShieldCheck,
  Store,
  Stethoscope,
  Pill,
  Syringe,
  Package,
  Boxes,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  Wallet,
  Warehouse,
  ShieldAlert,
  ClipboardCheck,
} from "lucide-react";

export const ROLE_CATEGORIES = [
  { key: "operations", label: "Operations" },
  { key: "inventory-procurement", label: "Inventory & Procurement" },
  { key: "sales-finance", label: "Sales & Finance" },
  { key: "admin-compliance", label: "Administration & Compliance" },
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
  amber: {
    tileBg: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30",
    iconColor: "text-amber-600 dark:text-amber-400",
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

export const ROLE_CATALOG = [
  {
    roleId: "owner",
    name: "Owner",
    description:
      "Full unrestricted access across all operational, financial, and security modules.",
    category: "admin-compliance",
    type: "system",
    icon: Crown,
    tone: "blue",
    priority: 3,
    modules: ALL_MODULE_KEYS,
  },
  {
    roleId: "administrator",
    name: "Administrator",
    description: "Manages the team, roles, access policies, and all operational modules.",
    category: "admin-compliance",
    type: "system",
    icon: ShieldCheck,
    tone: "blue",
    priority: 3,
    modules: ALL_MODULE_KEYS,
  },
  {
    roleId: "pharmacy-manager",
    name: "Pharmacy Manager",
    description:
      "Oversees daily pharmacy operations, staff activity, dispensing workflows, and store performance.",
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
      "Leads clinical dispensing, verifies prescriptions, and supervises pharmacy staff workflows.",
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
      "Handles medicine dispensing, prescriptions, medicine records, stock review, and pharmacy sales.",
    category: "operations",
    type: "system",
    icon: Pill,
    tone: "green",
    priority: 1,
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
      "Supports dispensing, maintains medicine records, and assists with stock movement and labeling.",
    category: "operations",
    type: "system",
    icon: Syringe,
    tone: "green",
    priority: 2,
    modules: ["dashboard", "medicines", "batches", "inventory", "sales", "expiry", "notifications"],
  },
  {
    roleId: "store-keeper",
    name: "Store Keeper",
    description: "Receives stock, manages batches, and handles physical inventory movements.",
    category: "inventory-procurement",
    type: "system",
    icon: Package,
    tone: "orange",
    priority: 1,
    modules: ["dashboard", "medicines", "batches", "inventory", "expiry", "audit", "notifications"],
  },
  {
    roleId: "inventory-manager",
    name: "Inventory Manager",
    description: "Manages stock levels, batches, stock movements, and inventory control.",
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
      "admin",
    ],
  },
  {
    roleId: "procurement-manager",
    name: "Procurement / Purchase Manager",
    description: "Manages suppliers, purchase orders, procurement records, and goods received.",
    category: "inventory-procurement",
    type: "system",
    icon: ShoppingCart,
    tone: "orange",
    priority: 1,
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
    roleId: "sales-pos-executive",
    name: "Sales & POS Executive",
    description: "Processes point-of-sale transactions, customer billing, and sales returns.",
    category: "sales-finance",
    type: "system",
    icon: ShoppingBag,
    tone: "teal",
    priority: 1,
    modules: ["dashboard", "medicines", "batches", "inventory", "sales", "notifications"],
  },
  {
    roleId: "cashier-billing-executive",
    name: "Cashier / Billing Executive",
    description: "Handles billing, payments, receipts, and point-of-sale transactions.",
    category: "sales-finance",
    type: "system",
    icon: Receipt,
    tone: "teal",
    priority: 1,
    modules: ["dashboard", "medicines", "batches", "sales"],
  },
  {
    roleId: "accounts-finance-manager",
    name: "Accounts / Finance Manager",
    description:
      "Manages financial records, payment reconciliation, GST-related records, and financial reporting.",
    category: "sales-finance",
    type: "system",
    icon: Wallet,
    tone: "teal",
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
      "users",
      "reports",
      "notifications",
      "ai",
      "admin",
    ],
  },
  {
    roleId: "warehouse-manager",
    name: "Warehouse Manager",
    description: "Manages warehouse stock, dispatch, batch storage, and space planning.",
    category: "inventory-procurement",
    type: "system",
    icon: Warehouse,
    tone: "orange",
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
      "admin",
    ],
  },
  {
    roleId: "quality-compliance-officer",
    name: "Quality & Compliance Officer",
    description:
      "Monitors expiry, compliance records, audit activities, and pharmacy quality controls.",
    category: "admin-compliance",
    type: "system",
    icon: ShieldAlert,
    tone: "amber",
    priority: 3,
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
    roleId: "auditor",
    name: "Auditor",
    description:
      "Reviews operational records, transactions, access activity, and audit information.",
    category: "admin-compliance",
    type: "system",
    icon: ClipboardCheck,
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
  tone: "neutral",
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
