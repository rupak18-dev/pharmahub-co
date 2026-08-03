import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  badge,
  onClick,
  selected = false,
  iconMenu,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  badge?: string;
  onClick?: () => void;
  selected?: boolean;
  iconMenu?: ReactNode;
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
        "flex w-full flex-col rounded-lg border border-border bg-card p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-colors",
        onClick && "cursor-pointer hover:border-primary/40 hover:bg-accent/40",
        selected && "border-primary/60 ring-2 ring-primary/25",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground">{label}</span>
        {Icon &&
          (iconMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") e.stopPropagation();
                  }}
                  className="rounded-md p-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className={cn("h-4 w-4", toneCls)} strokeWidth={1.5} />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {iconMenu}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Icon className={cn("h-4 w-4", toneCls)} strokeWidth={1.5} />
          ))}
      </div>
      {badge ? (
        <span className="mt-2 inline-flex w-fit items-center rounded-md bg-[#FEF3C7] px-2.5 py-1 text-base font-semibold text-[#D97706]">
          {badge}
        </span>
      ) : (
        <span className={cn("mt-2 text-2xl font-semibold tabular-nums", toneCls)}>{value}</span>
      )}
      {hint && <span className="mt-1 text-xs text-muted-foreground">{hint}</span>}
    </button>
  );
}
