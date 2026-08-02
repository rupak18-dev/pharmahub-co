import { createFileRoute, Link } from "@tanstack/react-router";
import {
  IndianRupee,
  ShoppingCart,
  Receipt,
  Boxes,
  AlertTriangle,
  PackageX,
  CalendarClock,
  Skull,
  Sparkles,
  Activity,
} from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { KpiCard } from "@/components/pharmacy/KpiCard";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard · PharmacyOS" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const data = useDb((d) => d);

  const stats = useMemo(() => {
    const stockValue = data.batches.reduce((sum, b) => sum + b.currentStock * b.purchasePrice, 0);
    const now = Date.now();
    const nearMs = data.settings.nearExpiryDays * 24 * 60 * 60 * 1000;

    const perMedicine = new Map<string, number>();
    data.batches.forEach((b) => {
      perMedicine.set(b.medicineId, (perMedicine.get(b.medicineId) ?? 0) + b.currentStock);
    });

    let low = 0;
    let out = 0;
    data.medicines
      .filter((m) => m.isActive)
      .forEach((m) => {
        const total = perMedicine.get(m.id) ?? 0;
        if (total <= 0) out++;
        else if (total <= m.reorderThreshold) low++;
      });

    const near = data.batches.filter((b) => {
      const t = new Date(b.expiryDate).getTime();
      return b.currentStock > 0 && t > now && t - now <= nearMs;
    }).length;

    const expired = data.batches.filter(
      (b) => new Date(b.expiryDate).getTime() <= now && b.currentStock > 0,
    ).length;

    return {
      stockValue,
      low,
      out,
      near,
      expired,
      todaysSales: 0,
      todaysPurchases: 0,
    };
  }, [data]);

  const currency = data.settings.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A live view of your pharmacy's operational health."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Stock value"
          value={`${currency}${Math.round(stats.stockValue).toLocaleString()}`}
          hint="Sum of current stock × purchase price"
          icon={Boxes}
          tone="default"
        />
        <KpiCard
          label="Today's revenue"
          value={`${currency}${stats.todaysSales.toLocaleString()}`}
          hint="Wired to POS in Phase 2"
          icon={IndianRupee}
          tone="success"
        />
        <KpiCard
          label="Today's sales"
          value={stats.todaysSales}
          hint="Invoices generated today"
          icon={Receipt}
          tone="info"
        />
        <KpiCard
          label="Today's purchases"
          value={stats.todaysPurchases}
          hint="GRN entries today"
          icon={ShoppingCart}
          tone="info"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Low stock"
          value={stats.low}
          hint="Below reorder threshold"
          icon={AlertTriangle}
          tone="warning"
        />
        <KpiCard
          label="Out of stock"
          value={stats.out}
          hint="Active medicines with zero units"
          icon={PackageX}
          tone="danger"
        />
        <KpiCard
          label="Near expiry"
          value={stats.near}
          hint={`Within ${data.settings.nearExpiryDays} days`}
          icon={CalendarClock}
          tone="warning"
        />
        <KpiCard
          label="Expired"
          value={stats.expired}
          hint="Batches past expiry with stock"
          icon={Skull}
          tone="danger"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Recent activity</h3>
            </div>
            <Link
              to="/dashboard/inventory"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View inventory →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {data.activityLogs.slice(0, 20).map((log) => (
              <li key={log.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{log.action}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {log.userName} · {log.entityType}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </span>
              </li>
            ))}
            {data.activityLogs.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No activity yet.
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-gradient-to-br from-accent/40 to-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">AI Insights</h3>
            <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Phase 4
            </span>
          </div>
          <div className="space-y-3 p-4 text-sm">
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Demand forecast
              </div>
              <p className="mt-1 text-foreground">
                Paracetamol 500mg trending +18% week-over-week — consider a reorder.
              </p>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Expiry risk
              </div>
              <p className="mt-1 text-foreground">
                {stats.near} batches likely to expire before turnover — review Expiry module.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Real ML wiring lands in Phase 4. This panel already reads live data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
