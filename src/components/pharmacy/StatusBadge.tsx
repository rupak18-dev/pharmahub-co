import { cn } from "@/lib/utils";
import type { BatchStatus } from "@/lib/types";

const map: Record<BatchStatus | "low" | "out" | "healthy", { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-success/15 text-success border-success/30" },
  near_expiry: {
    label: "Near expiry",
    cls: "bg-warning/20 text-warning-foreground border-warning/40",
  },
  expired: { label: "Expired", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  sold_out: { label: "Sold out", cls: "bg-muted text-muted-foreground border-border" },
  disposed: { label: "Disposed", cls: "bg-muted text-muted-foreground border-border" },
  low: { label: "Low stock", cls: "bg-warning/20 text-warning-foreground border-warning/40" },
  out: { label: "Out of stock", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  healthy: { label: "In stock", cls: "bg-success/15 text-success border-success/30" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: keyof typeof map;
  className?: string;
}) {
  const v = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        v.cls,
        className,
      )}
    >
      {v.label}
    </span>
  );
}
