import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Boxes,
  LayoutGrid,
  ScrollText,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { useDb } from "@/hooks/useDb";
import { useAuth } from "@/lib/auth";
import { computeOverview, formatINR, type FlowRange } from "@/lib/inventory";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import {
  InventoryTabBar,
  type InventoryTab,
} from "@/components/pharmacy/inventory/InventoryTabBar";
import { InventoryStatCard } from "@/components/pharmacy/inventory/InventoryStatCard";
import { MovementChart } from "@/components/pharmacy/inventory/MovementChart";
import { FefoGauge } from "@/components/pharmacy/inventory/FefoGauge";
import { ActivityFeed } from "@/components/pharmacy/inventory/ActivityFeed";
import { AddStockSheet } from "@/components/pharmacy/inventory/AddStockSheet";
import { StockDirectory } from "@/components/pharmacy/inventory/StockDirectory";
import { AlertActions } from "@/components/pharmacy/inventory/AlertActions";

export const Route = createFileRoute("/_authenticated/dashboard/inventory")({
  head: () => ({ meta: [{ title: "Inventory · PharmacyOS" }] }),
  component: InventoryPage,
});

const PLACEHOLDERS: Record<
  Exclude<InventoryTab, "overview">,
  { icon: LucideIcon; title: string; description: string }
> = {
  ledger: {
    icon: BookOpen,
    title: "Stock Ledger — coming soon",
    description: "Batch-wise stock lines with expiry, rack and movement history will live here.",
  },
  rack: {
    icon: LayoutGrid,
    title: "Rack Placement — coming soon",
    description: "Visual rack map for allocating inbound shipments to shelves and locations.",
  },
  audit: {
    icon: ScrollText,
    title: "Audit Logs — coming soon",
    description: "A full history of stock checks, counts and corrections will appear here.",
  },
  reports: {
    icon: BarChart3,
    title: "Reports — coming soon",
    description: "Exportable valuation, movement and expiry reports will live here.",
  },
};

function InventoryPage() {
  const d = useDb((db) => db);
  const { user } = useAuth();
  const [tab, setTab] = useState<InventoryTab>("overview");
  const [range, setRange] = useState<FlowRange>(6);

  const overview = useMemo(() => computeOverview(d, range), [d, range]);

  if (tab !== "overview") {
    const p = PLACEHOLDERS[tab];
    return (
      <div className="space-y-6">
        <InventoryTabBar active={tab} onChange={setTab} />
        <EmptyState icon={p.icon} title={p.title} description={p.description} />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const today = format(new Date(), "EEEE, d MMMM yyyy");
  const {
    totalProducts,
    stockValue,
    lowStock,
    nearExpiry,
    monthlySeries,
    fefo,
    matrix,
    alerts,
    feed,
  } = overview;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InventoryTabBar active={tab} onChange={setTab} />
        <AddStockSheet />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening with your pharmacy inventory today.
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-primary">{today}</p>
        </div>
        <div className="grid flex-1 gap-4 sm:grid-cols-3">
          <InventoryStatCard
            label="Total Products"
            value={totalProducts.toLocaleString("en-IN")}
            delta="+12%"
            deltaLabel="vs last month"
            icon={Boxes}
            iconCls="bg-info/10 text-info"
          />
          <InventoryStatCard
            label="Total Inventory Value"
            value={formatINR(stockValue)}
            delta="+8%"
            deltaLabel="margin vs last month"
            icon={TrendingUp}
            iconCls="bg-primary/10 text-primary"
          />
          <InventoryStatCard
            label="Low & Expiring Stock"
            value={(lowStock + nearExpiry).toLocaleString("en-IN")}
            delta="-15%"
            deltaTone="down"
            deltaLabel="reorder risk vs last month"
            icon={AlertTriangle}
            iconCls="bg-warning/15 text-warning-foreground"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MovementChart
          data={monthlySeries}
          range={range}
          onRangeChange={setRange}
          className="lg:col-span-2"
        />
        <FefoGauge fefo={fefo} className="lg:col-span-1" />
      </div>

      <StockDirectory items={matrix} />

      <div className="grid gap-4 md:grid-cols-2">
        <ActivityFeed items={feed} />
        <AlertActions alerts={alerts} />
      </div>
    </div>
  );
}
