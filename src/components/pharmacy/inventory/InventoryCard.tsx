import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function InventoryCard({
  title,
  icon: Icon,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
