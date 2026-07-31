import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  onClick?: () => void;
}) {
  const toneCls =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning-foreground"
        : tone === "danger"
          ? "text-destructive"
          : tone === "info"
            ? "text-info"
            : "text-primary";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex w-full flex-col rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-colors",
        onClick && "hover:border-primary/40 hover:bg-accent/40 cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className={cn("h-4 w-4", toneCls)} />}
      </div>
      <span className={cn("mt-2 text-2xl font-semibold tabular-nums", toneCls)}>{value}</span>
      {hint && <span className="mt-1 text-xs text-muted-foreground">{hint}</span>}
    </button>
  );
}
