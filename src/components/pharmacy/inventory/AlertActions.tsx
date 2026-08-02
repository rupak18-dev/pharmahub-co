import { Link } from "@tanstack/react-router";
import { CalendarClock, ChevronRight, ClipboardCheck, PackageSearch, PackageX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertKind, InventoryAlert } from "@/lib/inventory";
import { InventoryCard } from "./InventoryCard";

const STYLE: Record<AlertKind, { icon: LucideIcon; cls: string }> = {
  out: { icon: PackageX, cls: "bg-muted text-muted-foreground" },
  expiring: { icon: CalendarClock, cls: "bg-warning/15 text-warning-foreground" },
  rack: { icon: PackageSearch, cls: "bg-info/10 text-info" },
  audit: { icon: ClipboardCheck, cls: "bg-success/10 text-success" },
};

export function AlertActions({
  alerts,
  className,
}: {
  alerts: InventoryAlert[];
  className?: string;
}) {
  return (
    <InventoryCard
      className={className}
      title="Alerts & Direct Actions"
      bodyClassName="flex flex-col gap-2.5 p-4"
    >
      {alerts.map((a) => {
        const { icon: Icon, cls } = STYLE[a.kind];
        return (
          <Link
            key={a.kind}
            to={a.href}
            className="group flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-accent/50"
          >
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", cls)}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{a.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{a.detail}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </Link>
        );
      })}
    </InventoryCard>
  );
}
