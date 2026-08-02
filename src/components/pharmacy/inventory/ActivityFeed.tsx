import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem, FeedTone } from "@/lib/inventory";
import { InventoryCard } from "./InventoryCard";

const TONE: Record<FeedTone, string> = {
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/15 text-warning-foreground",
  danger: "bg-destructive/10 text-destructive",
};

export function ActivityFeed({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <InventoryCard
      className={className}
      title="Stock Movement Log"
      icon={Clock}
      bodyClassName="divide-y divide-border"
    >
      {items.map((item) => (
        <div key={item.id} className="px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                TONE[item.tone],
              )}
            >
              {item.title}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{item.time}</span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{item.detail}</p>
        </div>
      ))}
    </InventoryCard>
  );
}
