import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function InventoryStatCard({
  label,
  value,
  delta,
  deltaLabel,
  deltaTone = "up",
  icon: Icon,
  iconCls,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaLabel?: string;
  deltaTone?: "up" | "down";
  icon: LucideIcon;
  iconCls: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className={cn("grid h-11 w-11 place-items-center rounded-full", iconCls)}>
          <Icon className="h-5 w-5" />
        </div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              deltaTone === "up"
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {deltaTone === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta}
          </span>
        )}
      </div>
      <div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
        {deltaLabel && <div className="mt-1 text-xs text-muted-foreground">{deltaLabel}</div>}
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}
