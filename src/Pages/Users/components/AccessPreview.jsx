import { useMemo } from "react";
import {
  LayoutDashboard,
  Pill,
  Layers,
  Boxes,
  ShoppingCart,
  Receipt,
  CalendarClock,
  ClipboardCheck,
  Users,
  BarChart3,
  Bell,
  Sparkles,
  Settings,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { ALL_MODULES } from "@/lib/permissions";
const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { key: "dashboard", title: "Dashboard", icon: LayoutDashboard },
      { key: "medicines", title: "Medicines", icon: Pill },
      { key: "batches", title: "Batches", icon: Layers },
      { key: "inventory", title: "Inventory", icon: Boxes },
    ],
  },
  {
    label: "Commerce",
    items: [
      { key: "purchases", title: "Purchases", icon: ShoppingCart },
      { key: "sales", title: "Sales & POS", icon: Receipt },
    ],
  },
  {
    label: "Compliance",
    items: [
      { key: "expiry", title: "Expiry", icon: CalendarClock },
      { key: "audit", title: "Stock Audit", icon: ClipboardCheck },
      { key: "reports", title: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { key: "users", title: "Users & Roles", icon: Users },
      { key: "notifications", title: "Notifications", icon: Bell },
      { key: "ai", title: "AI Insights", icon: Sparkles },
      { key: "admin", title: "System Admin", icon: Settings },
    ],
  },
];
export function AccessPreview({ roleName, permissions }) {
  const visibleCount = useMemo(() => {
    return ALL_MODULES.filter((m) => permissions[m.key]?.view).length;
  }, [permissions]);
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live Access Preview
            </span>
            {roleName && (
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {roleName} Scope
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time preview of navigation & access permissions after sign-in.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-mono text-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>{visibleCount} / 13 Modules Visible</span>
        </div>
      </div>

      {/* Miniature Sidebar Mockup */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3 font-sans text-xs">
        {/* Brand Header */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-2 px-1">
          <div className="h-4 w-4 rounded bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
            +
          </div>
          <span className="font-semibold text-foreground tracking-tight text-xs">PharmaHub</span>
        </div>

        {/* Grouped Links */}
        <div className="space-y-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const canView = permissions[item.key]?.view ?? false;
                  const canCreate = permissions[item.key]?.create ?? false;
                  const canEdit = permissions[item.key]?.update ?? false;
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between rounded-md px-2 py-1.5 transition-all ${
                        canView
                          ? "bg-card text-foreground border border-border/80 shadow-2xs"
                          : "bg-muted/40 text-muted-foreground/50 border border-transparent opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon
                          className={`h-3.5 w-3.5 ${canView ? "text-primary" : "text-muted-foreground/40"}`}
                        />
                        <span
                          className={`truncate text-xs ${canView ? "font-medium" : "line-through"}`}
                        >
                          {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {canView ? (
                          <div className="flex items-center gap-1">
                            {canCreate && (
                              <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                                +Add
                              </span>
                            )}
                            {canEdit && (
                              <span className="rounded bg-blue-500/10 px-1 py-0.2 text-[9px] font-medium text-blue-600 dark:text-blue-400">
                                Edit
                              </span>
                            )}
                          </div>
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground/40" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-2.5">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Active module view
        </span>
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3 text-muted-foreground/60" /> Restricted access
        </span>
      </div>
    </div>
  );
}
