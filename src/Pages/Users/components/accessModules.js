import {
  BarChart3,
  Bell,
  Boxes,
  CalendarClock,
  ClipboardCheck,
  LayoutDashboard,
  Layers,
  Pill,
  Receipt,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { ALL_MODULES } from "@/lib/permissions";

/* Central catalog of PharmaHub modules available for manual staff access
   assignment. Built once from the real module set in @/lib/permissions so
   the list is never duplicated across components. */
const MODULE_META = {
  dashboard: {
    description: "Overview of pharmacy performance and key metrics.",
    icon: LayoutDashboard,
  },
  medicines: {
    description: "Manage medicine records and dispensing information.",
    icon: Pill,
  },
  batches: {
    description: "Track medicine batches, expiry dates, and stock lots.",
    icon: Layers,
  },
  inventory: {
    description: "View and manage pharmacy stock and inventory.",
    icon: Boxes,
  },
  purchases: {
    description: "Manage suppliers, purchase orders, and goods received.",
    icon: ShoppingCart,
  },
  sales: {
    description: "Process point-of-sale transactions and customer billing.",
    icon: Receipt,
  },
  expiry: {
    description: "Monitor expiring stock and expiry alerts.",
    icon: CalendarClock,
  },
  audit: {
    description: "Review stock movements and audit records.",
    icon: ClipboardCheck,
  },
  users: {
    description: "Manage staff accounts and role assignments.",
    icon: Users,
  },
  reports: {
    description: "View operational and business reports.",
    icon: BarChart3,
  },
  notifications: {
    description: "View alerts and system notifications.",
    icon: Bell,
  },
  ai: {
    description: "Use AI-powered insights and recommendations.",
    icon: Sparkles,
  },
  admin: {
    description: "Manage profile and store settings.",
    icon: Settings,
  },
};

export const ACCESS_MODULES = ALL_MODULES.map((m) => ({
  id: m.key,
  name: m.label,
  description: MODULE_META[m.key]?.description ?? "PharmaHub module access.",
  icon: MODULE_META[m.key]?.icon ?? Boxes,
}));

export function getAccessModule(id) {
  return ACCESS_MODULES.find((m) => m.id === id);
}
