import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CalendarClock, Zap } from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { differenceInDays, subDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard/ai")({
  head: () => ({ meta: [{ title: "AI Insights · PharmacyOS" }] }),
  component: AiPage,
});

function AiPage() {
  const data = useDb((d) => d);
  const currency = data.settings.currency;
  const medName = useMemo(() => {
    const m = new Map(data.medicines.map((x) => [x.id, x.name]));
    return (id: string) => m.get(id) ?? "—";
  }, [data.medicines]);

  const insights = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const last7 = subDays(new Date(), 7).getTime();
    const prev7 = subDays(new Date(), 14).getTime();

    const w1 = new Map<string, number>(); // last 7d
    const w2 = new Map<string, number>(); // 8-14d
    data.inventoryLedger.forEach((m) => {
      if (m.movementType === "Purchase Inward" || m.movementType === "Customer Return" || (m.movementType === "Adjustment" && m.quantityChange > 0)) return;
      const b = data.batches.find(b => b.id === m.batchId);
      if (!b) return;
      const q = Math.abs(m.quantityChange);
      const t = new Date(m.timestamp).getTime();
      if (t >= last7) w1.set(b.medicineId, (w1.get(b.medicineId) ?? 0) + q);
      else if (t >= prev7) w2.set(b.medicineId, (w2.get(b.medicineId) ?? 0) + q);
    });

    const trend: { id: string; delta: number; recent: number; prior: number }[] = [];
    const medIds = new Set([...w1.keys(), ...w2.keys()]);
    medIds.forEach((id) => {
      const r = w1.get(id) ?? 0;
      const p = w2.get(id) ?? 0;
      const delta = p === 0 ? (r > 0 ? 999 : 0) : ((r - p) / p) * 100;
      trend.push({ id, delta, recent: r, prior: p });
    });
    const gainers = [...trend].filter((t) => t.recent >= 5 && t.delta > 10).sort((a, b) => b.delta - a.delta).slice(0, 5);
    const losers = [...trend].filter((t) => t.prior >= 5 && t.delta < -10).sort((a, b) => a.delta - b.delta).slice(0, 5);

    const stockByMed = new Map<string, number>();
    data.inventoryStock.forEach((s) => {
      const b = data.batches.find(b => b.id === s.batchId);
      if (b) stockByMed.set(b.medicineId, (stockByMed.get(b.medicineId) ?? 0) + s.quantityOnHand);
    });
    const reorder = data.medicines
      .filter((m) => m.isActive)
      .map((m) => {
        const daily = (w1.get(m.id) ?? 0) / 7;
        const stock = stockByMed.get(m.id) ?? 0;
        const daysToZero = daily > 0 ? stock / daily : Infinity;
        return { m, stock, daily, daysToZero };
      })
      .filter((r) => r.daysToZero <= 14 && r.daily > 0)
      .sort((a, b) => a.daysToZero - b.daysToZero)
      .slice(0, 6);

    // Expiry risk: batches whose remaining days < projected days-to-sell
    const risk = data.batches
      .map((b) => {
        const stock = data.inventoryStock.filter(s => s.batchId === b.id).reduce((sum, s) => sum + s.quantityOnHand, 0);
        return { b, stock };
      })
      .filter(({ stock }) => stock > 0)
      .map(({ b, stock }) => {
        const daily = (w1.get(b.medicineId) ?? 0) / 7;
        const daysLeft = differenceInDays(new Date(b.expiryDate), new Date());
        const daysToSell = daily > 0 ? stock / daily : Infinity;
        return { b, daysLeft, daysToSell, daily };
      })
      .filter((r) => r.daysLeft > 0 && r.daysLeft < r.daysToSell && r.daysLeft < 180)
      .sort((a, b) => a.daysLeft - a.daysToSell - (b.daysLeft - b.daysToSell))
      .slice(0, 6);

    // Anomalies: today's sales > 3× rolling 14-day daily average
    const salesByDay = new Map<string, number>();
    data.sales.forEach((s) => {
      if (s.status === "voided") return;
      const key = new Date(s.createdAt).toDateString();
      salesByDay.set(key, (salesByDay.get(key) ?? 0) + s.grandTotal);
    });
    const last14 = Array.from({ length: 14 }, (_, i) => new Date(now - i * day).toDateString());
    const avg = last14.reduce((s, d) => s + (salesByDay.get(d) ?? 0), 0) / 14;
    const today = salesByDay.get(new Date().toDateString()) ?? 0;
    const anomaly = avg > 0 && today > 3 * avg ? { today, avg } : null;

    return { gainers, losers, reorder, risk, anomaly };
  }, [data]);

  const empty =
    !insights.gainers.length && !insights.losers.length && !insights.reorder.length && !insights.risk.length && !insights.anomaly;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description="Heuristic previews computed from your live data. ML models arrive in a later phase."
      />

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Heuristic preview
        </span>
        {" "}— these signals are computed from stock movements and won't replace an ML model.
      </div>

      {empty ? (
        <EmptyState title="Not enough data yet" description="Record a few sales and purchases so insights can compute." icon={Sparkles} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {insights.anomaly && (
            <Card icon={Zap} title="Sales anomaly">
              Today's revenue is{" "}
              <span className="font-mono font-semibold">{currency}{Math.round(insights.anomaly.today).toLocaleString()}</span>{" "}
              vs a 14-day average of{" "}
              <span className="font-mono">{currency}{Math.round(insights.anomaly.avg).toLocaleString()}</span>. Investigate if unexpected.
            </Card>
          )}

          <Card icon={TrendingUp} title="Trending up (last 7d vs prior 7d)">
            {insights.gainers.length ? (
              <ul className="space-y-1.5 text-sm">
                {insights.gainers.map((g) => (
                  <li key={g.id} className="flex items-center justify-between">
                    <span>{medName(g.id)}</span>
                    <span className="font-mono text-success">+{g.delta === 999 ? "new" : `${g.delta.toFixed(0)}%`}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No significant gainers.</p>}
          </Card>

          <Card icon={TrendingDown} title="Trending down">
            {insights.losers.length ? (
              <ul className="space-y-1.5 text-sm">
                {insights.losers.map((g) => (
                  <li key={g.id} className="flex items-center justify-between">
                    <span>{medName(g.id)}</span>
                    <span className="font-mono text-destructive">{g.delta.toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No significant losers.</p>}
          </Card>

          <Card icon={AlertTriangle} title="Suggested reorders">
            {insights.reorder.length ? (
              <ul className="space-y-1.5 text-sm">
                {insights.reorder.map((r) => (
                  <li key={r.m.id} className="flex items-center justify-between">
                    <span>{r.m.name}</span>
                    <span className="font-mono text-warning-foreground">
                      ~{Math.round(r.daysToZero)}d left · {r.stock} u
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No reorders projected in next 14 days.</p>}
          </Card>

          <Card icon={CalendarClock} title="Expiry risk (won't sell in time)">
            {insights.risk.length ? (
              <ul className="space-y-1.5 text-sm">
                {insights.risk.map((r) => (
                  <li key={r.b.id} className="flex items-center justify-between">
                    <span>{medName(r.b.medicineId)} · <span className="font-mono text-xs">{r.b.batchNumber}</span></span>
                    <span className="font-mono text-destructive">{r.daysLeft}d vs ~{Math.round(r.daysToSell)}d</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No expiry risk detected.</p>}
          </Card>
        </div>
      )}
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: typeof Sparkles; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
