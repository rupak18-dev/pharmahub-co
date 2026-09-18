import { Bell, CalendarClock, CheckCheck, Clock3, PackageX, RotateCcw, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
const groupIcons = {
  "Expiring today": PackageX,
  "Expiring soon": Clock3,
  "Expiring in 30 days": CalendarClock,
  "Return window": Wallet,
  "Return deadline": RotateCcw,
  "High value": Wallet,
};
const dot = {
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
};
export function NotificationsPopover({
  notifications,
  readIds,
  onMarkRead,
  onMarkAllRead,
  onJump,
}) {
  const unread = notifications.filter((n) => !readIds.has(n.id)).length;
  const groups = [];
  for (const n of notifications) {
    const g = groups.find((x) => x.label === n.group);
    if (g) g.items.push(n);
    else groups.push({ label: n.group, items: [n] });
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">
            Alerts
            {unread > 0 && (
              <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                {unread} new
              </span>
            )}
          </p>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onMarkAllRead}>
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No urgent alerts. Everything is clear.
            </p>
          ) : (
            groups.map((g) => {
              const Icon = groupIcons[g.label] ?? Clock3;
              return (
                <div key={g.label} className="border-b border-border last:border-0">
                  <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    {g.label}
                  </div>
                  {g.items.map((n) => {
                    const isRead = readIds.has(n.id);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          onMarkRead(n.id);
                          onJump(n.batchId);
                        }}
                        className={cn(
                          "flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent",
                          !isRead && "bg-accent/40",
                        )}
                      >
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot[n.tone])} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{n.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {n.detail}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
