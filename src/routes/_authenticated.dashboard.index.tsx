import { createFileRoute } from "@tanstack/react-router";
import {
  IndianRupee,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  CalendarClock,
  PackageOpen,
  Users,
  TrendingUp,
} from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { KpiCard } from "@/components/pharmacy/KpiCard";
import { useMemo, useState } from "react";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard Â· PharmaHub" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const data = useDb((d) => d);
  const [showCharts, setShowCharts] = useState(false);

  const stats = useMemo(() => {
    const now = Date.now();
    const nearMs = data.settings.nearExpiryDays * 24 * 60 * 60 * 1000;

    let totalStock = 0;
    const perMedicine = new Map<string, number>();
    data.batches.forEach((b) => {
      totalStock += b.currentStock;
      perMedicine.set(b.medicineId, (perMedicine.get(b.medicineId) ?? 0) + b.currentStock);
    });

    let lowStock = 0;
    data.medicines
      .filter((m) => m.isActive)
      .forEach((m) => {
        const total = perMedicine.get(m.id) ?? 0;
        if (total <= m.reorderThreshold) lowStock++;
      });

    const nearExpiry = data.batches.filter((b) => {
      const t = new Date(b.expiryDate).getTime();
      return b.currentStock > 0 && t > now && t - now <= nearMs;
    }).length;

    // Sales data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todaysSales = 0;
    let monthlyRevenue = 0;
    let costOfGoodsSold = 0; // For gross profit

    data.sales.forEach((s) => {
      const saleDate = new Date(s.createdAt);
      if (saleDate.getTime() >= today.getTime()) {
        todaysSales += 1;
      }
      
      // If sale is in the current month
      if (saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear()) {
        monthlyRevenue += s.grandTotal;
        // Approximate COGS by finding the batch cost (if available, else approximate 70% margin)
        s.items.forEach(item => {
          const batch = data.batches.find(b => b.id === item.batchId);
          if (batch) {
             costOfGoodsSold += (batch.purchasePrice * item.quantity);
          } else {
             costOfGoodsSold += (item.lineTotal * 0.7); // Fallback
          }
        });
      }
    });

    const grossProfit = monthlyRevenue - costOfGoodsSold;

    const pendingOrders = data.purchaseOrders.filter(po => po.status === "placed" || po.status === "draft").length;
    
    const uniqueCustomers = new Set(data.sales.filter(s => s.customerName).map(s => s.customerName)).size;

    return {
      totalStock,
      lowStock,
      nearExpiry,
      todaysSales,
      monthlyRevenue,
      grossProfit,
      pendingOrders,
      activeCustomers: uniqueCustomers,
    };
  }, [data]);

  const currency = data.settings.currency;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Dashboard"
        description="Comprehensive overview of your pharmacy operations and business performance."
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCharts(!showCharts)}
            className="rounded-lg text-[#2563EB] hover:text-[#2563EB]/80 border-[#2563EB]/30 hover:bg-[#2563EB]/5"
          >
            {showCharts ? "Hide charts and reports" : "Show charts and reports"}
          </Button>
        }
      />

      <QuickActions />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Today's sales"
          value={stats.todaysSales}
          hint="Invoices generated today"
          icon={ShoppingCart}
          tone="default"
        />
        <KpiCard
          label="Monthly revenue"
          value={`${currency}${stats.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          hint="Total gross sales this month"
          icon={IndianRupee}
          tone="default"
        />
        <KpiCard
          label="Gross profit"
          value={`${currency}${stats.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          hint="Estimated margin this month"
          icon={TrendingUp}
          tone="default"
        />
        <KpiCard
          label="Active customers"
          value={stats.activeCustomers}
          hint="Total unique customers"
          icon={Users}
          tone="default"
        />
        <KpiCard
          label="Medicines in stock"
          value={stats.totalStock.toLocaleString()}
          hint="Total physical units"
          icon={Boxes}
          tone="default"
        />
        <KpiCard
          label="Low stock count"
          value={stats.lowStock}
          hint="Below reorder threshold"
          icon={AlertTriangle}
          tone="default"
        />
        <KpiCard
          label="Near expiry"
          value={stats.nearExpiry}
          hint={`Within ${data.settings.nearExpiryDays} days`}
          icon={CalendarClock}
          tone="default"
        />
        <KpiCard
          label="Pending orders"
          value={stats.pendingOrders}
          hint="PO awaiting fulfillment"
          icon={PackageOpen}
          tone="default"
        />
      </div>

      {showCharts && <DashboardCharts db={data} />}
      
      <div className="border-t border-border/40 pt-4">
        <h3 className="text-sm font-bold text-muted-foreground tracking-wider mb-4">Operations widgets</h3>
        <DashboardWidgets db={data} />
      </div>
    </div>
  );
}
