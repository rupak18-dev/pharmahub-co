import React from "react";
import {
  CreditCard,
  Package,
  Pill,
  CalendarClock,
  Truck,
  ShieldCheck,
  BarChart3,
  Printer,
  Bug,
  CircleHelp,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  UserCheck,
  Hourglass,
  Archive,
  Inbox,
  FileQuestion,
  Headset,
  MoreHorizontal,
} from "lucide-react";

/**
 * Common pharmacy issues in PharmaHub with professional Lucide vector icons
 * Completely free of emoji characters.
 */
export const ISSUE_TYPES = [
  {
    id: "billing_pos",
    label: "Billing, POS & Invoicing Issue",
    iconName: "CreditCard",
    icon: CreditCard,
    desc: "Cash register errors, discount discrepancies, tax calculation, thermal bill printing",
    badgeColor: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  {
    id: "inventory_stock",
    label: "Inventory & Stock Discrepancy",
    iconName: "Package",
    icon: Package,
    desc: "Physical stock vs system count mismatch, negative balance, rack placement",
    badgeColor: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  {
    id: "medicines_batches",
    label: "Medicine Catalog & Batch Tracking",
    iconName: "Pill",
    icon: Pill,
    desc: "Barcode/QR scan failure, batch number collision, missing HSN or salt details",
    badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    id: "expiry_returns",
    label: "Expiry & Returns Management",
    iconName: "CalendarClock",
    icon: CalendarClock,
    desc: "Near-expiry alerts, quarantine batch issue, credit note or vendor return error",
    badgeColor: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  },
  {
    id: "purchases_suppliers",
    label: "Purchase Orders & Supplier Sync",
    iconName: "Truck",
    icon: Truck,
    desc: "GRN creation failure, supplier ledger mismatch, purchase invoice upload issue",
    badgeColor: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  },
  {
    id: "user_access",
    label: "User Access & Permissions",
    iconName: "ShieldCheck",
    icon: ShieldCheck,
    desc: "Login failure, role capability restrictions, invitation link expired",
    badgeColor: "text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
  {
    id: "reports_export",
    label: "Reports & PDF/Excel Export",
    iconName: "BarChart3",
    icon: BarChart3,
    desc: "GST report generation error, Excel export broken, sales analytics discrepancies",
    badgeColor: "text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  },
  {
    id: "hardware_integrations",
    label: "Integrations & Hardware Setup",
    iconName: "Printer",
    icon: Printer,
    desc: "Thermal receipt printer, barcode reader, WhatsApp notification gateway",
    badgeColor: "text-cyan-700 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  },
  {
    id: "system_bug",
    label: "System Bug / Technical Error",
    iconName: "Bug",
    icon: Bug,
    desc: "Unexpected UI glitch, freeze, 500 error code, or performance lag",
    badgeColor: "text-red-700 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  },
  {
    id: "general_inquiry",
    label: "General Inquiry / Feature Feedback",
    iconName: "CircleHelp",
    icon: CircleHelp,
    desc: "How-to guidance, new pharmacy feature request, or process questions",
    badgeColor: "text-slate-700 bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800",
  },
  {
    id: "Other",
    label: "Other",
    iconName: "MoreHorizontal",
    icon: MoreHorizontal,
    desc: "",
    badgeColor: "text-gray-700 bg-gray-50 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-800",
  },
];

export const CATEGORY_ICON_MAP = {
  billing_pos: CreditCard,
  inventory_stock: Package,
  medicines_batches: Pill,
  expiry_returns: CalendarClock,
  purchases_suppliers: Truck,
  user_access: ShieldCheck,
  reports_export: BarChart3,
  hardware_integrations: Printer,
  system_bug: Bug,
  general_inquiry: CircleHelp,
  other: MoreHorizontal,
  Other: MoreHorizontal,
};

export function getCategoryConfig(id) {
  if (!id) return null;
  const match = ISSUE_TYPES.find(
    (c) => c.id === id || String(c.id).toLowerCase() === String(id).toLowerCase()
  );
  if (match) return match;
  return {
    id,
    label: String(id).replace(/_/g, " ") || "General Inquiry",
    icon: HelpCircle,
    desc: "",
    badgeColor: "text-muted-foreground bg-muted border-border",
  };
}

export function CategoryIcon({ id, className = "h-4 w-4", fallback = HelpCircle }) {
  const IconComponent = CATEGORY_ICON_MAP[id] || fallback;
  return <IconComponent className={className} />;
}

export const SEVERITY_LEVELS = [
  {
    id: "low",
    label: "Low",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
    desc: "Minor question or cosmetic issue. Pharmacy daily checkout and dispensing continue normally.",
    sla: "Resolution within 24-48 hours",
  },
  {
    id: "medium",
    label: "Medium",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
    desc: "Feature partially impaired, but manual workaround is available. Regular sales still proceed.",
    sla: "Resolution within 12-24 hours",
  },
  {
    id: "high",
    label: "High",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
    desc: "Major workflow bottleneck or report failure. Multiple staff members impacted.",
    sla: "Priority response within 4-8 hours",
  },
  {
    id: "critical",
    label: "Critical",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-600 animate-pulse",
    desc: "System down, point-of-sale completely stopped, or severe billing halt at the pharmacy counter.",
    sla: "Urgent emergency response < 1 hour",
  },
];

export const STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: CircleDot,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  acknowledged: {
    label: "Acknowledged",
    icon: CircleDot,
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    dotClass: "bg-sky-500",
  },
  assigned: {
    label: "Assigned",
    icon: UserCheck,
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    dotClass: "bg-indigo-500",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  waiting_for_user: {
    label: "Waiting for User",
    icon: Hourglass,
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-purple-500",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700",
    dotClass: "bg-emerald-600",
  },
  closed: {
    label: "Closed",
    icon: Archive,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-500",
  },
};

export const FAQS = [
  {
    category: "Hardware",
    q: "Barcode scanner not reading newly printed batch labels?",
    a: "Ensure the scanner is set to HID keyboard emulation mode and the label surface has no high-glare reflection. You can test scanning in any standard text input field.",
  },
  {
    category: "SLA",
    q: "How soon will a support specialist review my ticket?",
    a: "Critical counter-down issues receive an immediate response within 1 hour. High severity tickets are answered within 4 hours, and standard inquiries within 12-24 hours.",
  },
  {
    category: "Tracking",
    q: "Where do I track the progress and updates for my ticket?",
    a: "Click on 'My Tickets' in the left support menu. Every ticket raised from your pharmacy store displays real-time status updates and direct technician messages.",
  },
  {
    category: "Emergency",
    q: "Need urgent phone assistance for a pharmacy billing halt?",
    a: "You can dial our priority pharmacy support hotline at 1800-PHARMA-HELP, available 24x7 for critical point-of-sale failures.",
  },
];
