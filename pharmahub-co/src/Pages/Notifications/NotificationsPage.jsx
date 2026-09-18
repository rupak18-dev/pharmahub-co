import { Link } from "react-router";
import { useMemo } from "react";
import { AlertTriangle, PackageX, CalendarClock, Skull, CheckCheck } from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { PageHeader } from "@/Components/shared/PageHeader";
import { EmptyState } from "@/Components/shared/EmptyState";
import { Button } from "@/Components/ui/button";
import { differenceInDays } from "date-fns";
export const handle = { title: "Notifications · PharmaHub" };
export default function NotificationsPage() {
  const data = useDb((d) => d);
  const readSet = useMemo(() => new Set(data.notificationsRead), [data.notificationsRead]);
  const alerts = useMemo(() => {
    const list = [];
    const now = Date.now();
    const stockMap = new Map();
    data.inventoryStock.forEach((s) => {
      stockMap.set(s.batchId, (stockMap.get(s.batchId) ?? 0) + s.quantityOnHand);
    });
    // Aggregate stock per medicine
    const perMed = new Map();
    data.batches.forEach((b) => {
      perMed.set(b.medicineId, (perMed.get(b.medicineId) ?? 0) + (stockMap.get(b.id) ?? 0));
    });
    data.medicines
      .filter((m) => m.isActive)
      .forEach((m) => {
        const stock = perMed.get(m.id) ?? 0;
        if (stock <= 0) {
          list.push({
            id: `out-${m.id}`,
            severity: "critical",
            icon: PackageX,
            title: `${m.name} is out of stock`,
            detail: "Reorder immediately to avoid lost sales.",
            href: "/inventory",
          });
        } else if (stock <= m.reorderThreshold) {
          list.push({
            id: `low-${m.id}`,
            severity: "warning",
            icon: AlertTriangle,
            title: `${m.name} is low`,
            detail: `${stock} units left (reorder at ${m.reorderThreshold}).`,
            href: "/inventory",
          });
        }
      });
    data.batches.forEach((b) => {
      const stock = stockMap.get(b.id) ?? 0;
      if (stock <= 0) return;
      const days = differenceInDays(new Date(b.expiryDate), new Date());
      const med = data.medicines.find((m) => m.id === b.medicineId);
      if (days < 0) {
        list.push({
          id: `expired-${b.id}`,
          severity: "critical",
          icon: Skull,
          title: `${med?.name ?? "Batch"} · ${b.batchNumber} expired`,
          detail: `${b.currentStock} units still in stock.`,
          href: "/expiry",
        });
      } else if (days <= data.settings.nearExpiryDays) {
        list.push({
          id: `near-${b.id}`,
          severity: "warning",
          icon: CalendarClock,
          title: `${med?.name ?? "Batch"} · ${b.batchNumber} expiring in ${days}d`,
          detail: `${b.currentStock} units.`,
          href: "/expiry",
        });
      }
      void now;
    });
    // Sort: critical → warning → info
    const order = { critical: 0, warning: 1, info: 2 };
    return list.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [data]);
  const unread = alerts.filter((a) => !readSet.has(a.id));
  const grouped = {
    critical: alerts.filter((a) => a.severity === "critical"),
    warning: alerts.filter((a) => a.severity === "warning"),
    info: alerts.filter((a) => a.severity === "info"),
  };
  const markAll = () => {
    db.set((d) => {
      const ids = new Set(d.notificationsRead);
      alerts.forEach((a) => ids.add(a.id));
      d.notificationsRead = Array.from(ids);
    });
  };
  const markOne = (id) => {
    db.set((d) => {
      if (!d.notificationsRead.includes(id)) d.notificationsRead.push(id);
    });
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Live operational alerts derived from your current inventory state."
        actions={
          alerts.length > 0 && (
            <Button variant="outline" size="sm" onClick={markAll}>
              <CheckCheck className="mr-1 h-4 w-4" /> Mark all read
            </Button>
          )
        }
      />

      {alerts.length === 0 ? (
        <EmptyState title="All clear" description="No active alerts. Everything looks healthy." />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{unread.length}</span> unread ·{" "}
            {grouped.critical.length} critical · {grouped.warning.length} warnings
          </p>
          {["critical", "warning", "info"].map((sev) => {
            const list = grouped[sev];
            if (!list.length) return null;
            return (
              <section key={sev}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {sev}
                </h3>
                <ul className="space-y-2">
                  {list.map((a) => {
                    const Icon = a.icon;
                    const isRead = readSet.has(a.id);
                    return (
                      <li
                        key={a.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 ${
                          sev === "critical"
                            ? "border-destructive/30 bg-destructive/5"
                            : sev === "warning"
                              ? "border-warning/40 bg-warning/5"
                              : "border-border bg-card"
                        } ${isRead ? "opacity-60" : ""}`}
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.detail}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={a.href}>Open</Link>
                          </Button>
                          {!isRead && (
                            <Button variant="ghost" size="sm" onClick={() => markOne(a.id)}>
                              Mark read
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
