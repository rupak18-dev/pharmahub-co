import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { downloadCsv } from "@/lib/csv";
import { subDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports · PharmaHub" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const data = useDb((d) => d);
  const currency = data.settings.currency;

  const [from, setFrom] = useState(subDays(new Date(), 30).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const range = useMemo(() => {
    const f = new Date(from).getTime();
    const t = new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1;
    return { f, t };
  }, [from, to]);

  const salesInRange = data.sales.filter((s) => {
    if (s.status === "voided") return false;
    const c = new Date(s.createdAt).getTime();
    return c >= range.f && c <= range.t;
  });

  const grnsInRange = data.grns.filter((g) => {
    const c = new Date(g.createdAt).getTime();
    return c >= range.f && c <= range.t;
  });

  // Sales summary
  const revenue = salesInRange.reduce((a, b) => a + b.grandTotal, 0);
  const invoices = salesInRange.length;
  const avgBasket = invoices ? revenue / invoices : 0;

  // Top medicines
  const medMap = new Map(data.medicines.map((m) => [m.id, m.name]));
  const topByRev = new Map<string, { units: number; revenue: number }>();
  salesInRange.forEach((s) => s.items.forEach((it) => {
    const cur = topByRev.get(it.medicineId) ?? { units: 0, revenue: 0 };
    cur.units += it.quantity;
    cur.revenue += it.lineTotal;
    topByRev.set(it.medicineId, cur);
  }));
  const top10Revenue = Array.from(topByRev, ([id, v]) => ({ name: medMap.get(id) ?? "—", ...v }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const top10Units = [...top10Revenue].sort((a, b) => b.units - a.units).slice(0, 10);

  // Stock valuation by category
  const stockMap = new Map<string, number>();
  data.inventoryStock.forEach((s) => stockMap.set(s.batchId, (stockMap.get(s.batchId) ?? 0) + s.quantityOnHand));

  const catMap = new Map(data.categories.map((c) => [c.id, c.name]));
  const catVal = new Map<string, number>();
  data.batches.forEach((b) => {
    const med = data.medicines.find((m) => m.id === b.medicineId);
    if (!med) return;
    const key = med.categoryId ?? "uncat";
    const stock = stockMap.get(b.id) ?? 0;
    catVal.set(key, (catVal.get(key) ?? 0) + stock * b.purchasePrice);
  });
  const catRows = Array.from(catVal, ([id, v]) => ({
    category: catMap.get(id) ?? "Uncategorized",
    valueAtCost: Math.round(v),
  })).sort((a, b) => b.valueAtCost - a.valueAtCost);

  // GST summary
  const gstByRate = new Map<number, { taxable: number; tax: number }>();
  salesInRange.forEach((s) => s.items.forEach((it) => {
    const cur = gstByRate.get(it.gstRate) ?? { taxable: 0, tax: 0 };
    const taxable = it.lineTotal / (1 + it.gstRate / 100);
    cur.taxable += taxable;
    cur.tax += it.lineTotal - taxable;
    gstByRate.set(it.gstRate, cur);
  }));
  const gstRows = Array.from(gstByRate, ([rate, v]) => ({
    rate: `${rate}%`,
    taxable: v.taxable.toFixed(2),
    tax: v.tax.toFixed(2),
  }));

  // Supplier purchase summary
  const supMap = new Map(data.suppliers.map((s) => [s.id, s.name]));
  const supPurch = new Map<string, { grns: number; value: number }>();
  grnsInRange.forEach((g) => {
    const cur = supPurch.get(g.supplierId) ?? { grns: 0, value: 0 };
    cur.grns += 1;
    cur.value += g.totalValue;
    supPurch.set(g.supplierId, cur);
  });
  const supRows = Array.from(supPurch, ([id, v]) => ({
    supplier: supMap.get(id) ?? "—",
    grns: v.grns,
    value: Math.round(v.value),
  })).sort((a, b) => b.value - a.value);

  // Dead stock: batches with stock but no outgoing movement in deadStockDays
  const deadMs = data.settings.deadStockDays * 24 * 60 * 60 * 1000;
  const nowT = Date.now();
  const lastOut = new Map<string, number>();
  data.inventoryLedger.forEach((m) => {
    if (m.movementType === "Purchase Inward" || m.movementType === "Customer Return" || (m.movementType === "Adjustment" && m.quantityChange >= 0)) return;
    const t = new Date(m.timestamp).getTime();
    const prev = lastOut.get(m.batchId) ?? 0;
    if (t > prev) lastOut.set(m.batchId, t);
  });
  const deadStock = data.batches
    .filter((b) => b.currentStock > 0 && b.status !== "disposed")
    .filter((b) => nowT - (lastOut.get(b.id) ?? new Date(b.createdAt).getTime()) > deadMs)
    .map((b) => ({
      medicine: medMap.get(b.medicineId) ?? "—",
      batch: b.batchNumber,
      stock,
      valueAtCost: Math.round(stock * b.purchasePrice),
    }))
    .sort((a, b) => b.valueAtCost - a.valueAtCost)
    .slice(0, 50);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Ready-to-export views for finance, GST filing, and stock health." />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="space-y-1.5"><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <p className="ml-auto text-xs text-muted-foreground">Applies to sales, GST, and purchases reports.</p>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="top">Top movers</TabsTrigger>
          <TabsTrigger value="stock">Stock valuation</TabsTrigger>
          <TabsTrigger value="gst">GST</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="dead">Dead stock</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Revenue" value={`${currency}${Math.round(revenue).toLocaleString()}`} />
            <Kpi label="Invoices" value={invoices} />
            <Kpi label="Avg basket" value={`${currency}${Math.round(avgBasket).toLocaleString()}`} />
          </div>
        </TabsContent>

        <TabsContent value="top" className="mt-4 space-y-4">
          <ReportTable
            title="Top 10 by revenue"
            headers={["Medicine", "Units", "Revenue"]}
            rows={top10Revenue.map((r) => [r.name, r.units, `${currency}${r.revenue.toFixed(0)}`])}
            csv={() => downloadCsv("top-revenue.csv", top10Revenue)}
          />
          <ReportTable
            title="Top 10 by units"
            headers={["Medicine", "Units", "Revenue"]}
            rows={top10Units.map((r) => [r.name, r.units, `${currency}${r.revenue.toFixed(0)}`])}
            csv={() => downloadCsv("top-units.csv", top10Units)}
          />
        </TabsContent>

        <TabsContent value="stock" className="mt-4">
          <ReportTable
            title="Stock valuation by category"
            headers={["Category", "Value at cost"]}
            rows={catRows.map((r) => [r.category, `${currency}${r.valueAtCost.toLocaleString()}`])}
            csv={() => downloadCsv("stock-by-category.csv", catRows)}
          />
        </TabsContent>

        <TabsContent value="gst" className="mt-4">
          <ReportTable
            title="GST summary"
            headers={["Rate", "Taxable", "Tax collected"]}
            rows={gstRows.map((r) => [r.rate, `${currency}${r.taxable}`, `${currency}${r.tax}`])}
            csv={() => downloadCsv("gst-summary.csv", gstRows)}
          />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <ReportTable
            title="Purchases by supplier"
            headers={["Supplier", "GRNs", "Value"]}
            rows={supRows.map((r) => [r.supplier, r.grns, `${currency}${r.value.toLocaleString()}`])}
            csv={() => downloadCsv("purchases-by-supplier.csv", supRows)}
          />
        </TabsContent>

        <TabsContent value="dead" className="mt-4">
          <ReportTable
            title={`Dead stock (no sale in ${data.settings.deadStockDays} days)`}
            headers={["Medicine", "Batch", "Stock", "Value at cost"]}
            rows={deadStock.map((r) => [r.medicine, r.batch, r.stock, `${currency}${r.valueAtCost.toLocaleString()}`])}
            csv={() => downloadCsv("dead-stock.csv", deadStock)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ReportTable({
  title, headers, rows, csv,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  csv: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button variant="outline" size="sm" onClick={csv} disabled={!rows.length}>
          <Download className="mr-1 h-3.5 w-3.5" /> CSV
        </Button>
      </div>
      {!rows.length ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No data in this range.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>{headers.map((h, i) => <th key={i} className={`px-4 py-2.5 font-medium ${i > 0 ? "text-right" : ""}`}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-muted/30">
                {r.map((cell, j) => (
                  <td key={j} className={`px-4 py-2.5 ${j > 0 ? "text-right font-mono" : ""}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
