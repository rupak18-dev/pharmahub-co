import {
  BarChart3,
  CalendarClock,
  ClipboardCheck,
  LayoutDashboard,
  Layers,
  ListChecks,
  Pill,
  Plug,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { ALL_MODULES } from "@/lib/permissions";

/* Central catalog of PharmaHub modules available for manual staff access
   assignment. Built once from the real module set in @/lib/permissions so
   the list is never duplicated across components. Keys mirror the sidebar. */
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
  expiry: {
    description: "Monitor expiring stock and expiry alerts.",
    icon: CalendarClock,
  },
  audit: {
    description: "Review stock movements and monitor inventory levels.",
    icon: ClipboardCheck,
  },
  purchases: {
    description: "Manage suppliers, purchase orders, and goods received.",
    icon: ShoppingCart,
  },
  sales: {
    description: "Process point-of-sale transactions and customer billing.",
    icon: Receipt,
  },
  shortbook: {
    description: "Track credit sales and customer due payments.",
    icon: ListChecks,
  },
  users: {
    description: "Manage staff accounts and role assignments.",
    icon: Users,
  },
  reports: {
    description: "View operational and business reports.",
    icon: BarChart3,
  },
  admin: {
    description: "Manage profile and store settings.",
    icon: Settings,
  },
  integrations: {
    description: "Connect third-party services and data imports.",
    icon: Plug,
  },
};

export const ACCESS_MODULES = ALL_MODULES.map((m) => ({
  id: m.key,
  name: m.label,
  description: MODULE_META[m.key]?.description ?? "PharmaHub module access.",
  icon: MODULE_META[m.key]?.icon ?? Settings,
}));

export function getAccessModule(id) {
  return ACCESS_MODULES.find((m) => m.id === id);
}
