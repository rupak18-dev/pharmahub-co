import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Check,
  Copy,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Move,
  PackageOpen,
  Pencil,
  Plus,
  QrCode,
  Search,
  ShieldAlert,
  Snowflake,
  Tag,
  Timer,
  TrendingUp,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/lib/auth";
import { applyStockMovement, computeBatchStatus, logActivity } from "@/lib/stock";
import { cn } from "@/lib/utils";
import type { Batch, BatchStatus, LocationType, Medicine } from "@/lib/types";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { StatusBadge } from "@/components/pharmacy/StatusBadge";
import { KpiCard } from "@/components/pharmacy/KpiCard";
import { AddBatchSheet } from "@/components/pharmacy/AddBatchSheet";
import type { BatchFormValues } from "@/lib/batch-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard/batches")({
  head: () => ({ meta: [{ title: "Batches Â· PharmaHub" }] }),
  component: BatchesPage,
});

const safeFormat = (dateStr: string | undefined | null, fmt: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (!isValid(d)) return "—";
  return format(d, fmt);
};

const chipCls =
  "inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 font-mono text-xs font-semibold text-primary ring-1 ring-inset ring-primary/15";

const ACTIVE_REF_DAYS = 90;

type Row = {
  batch: Batch;
  med?: Medicine;
  status: BatchStatus;
  totalStock: number;
  locations: { locationType: LocationType; rackCode: string }[];
};

function BatchChip({ batchId, batchNumber }: { batchId: string; batchNumber: string }) {
  return (
    <span className={cn(chipCls, "group/chip transition-colors hover:bg-primary/15")}>
      <Link to="/dashboard/batches/$batchId" params={{ batchId }} className="hover:underline">
        {batchNumber}
      </Link>
      <button
        type="button"
        title="Copy batch code"
        onClick={() => {
          void navigator.clipboard?.writeText(batchNumber);
          toast(`Batch code ${batchNumber} copied`);
        }}
        className="rounded-sm text-primary/50 transition-colors hover:text-primary"
      >
        <Copy className="h-3 w-3" strokeWidth={1.5} />
      </button>
    </span>
  );
}

function MfgCell({ mfgDate }: { mfgDate: string }) {
  return (
    <span className="font-mono text-xs font-medium text-foreground">
      {safeFormat(mfgDate, "MM/yyyy")}
    </span>
  );
}

function ExpiryCell({ expiryDate }: { expiryDate: string }) {
  return (
    <span className="font-mono text-xs font-medium text-foreground">
      {safeFormat(expiryDate, "MM/yyyy")}
    </span>
  );
}

function LocationPill({
  locations,
}: {
  locations: { locationType: LocationType; rackCode: string }[];
}) {
  if (!locations.length) return <span className="text-xs text-muted-foreground">—</span>;
  const first = locations[0];
  const extra = locations.length - 1;
  const isCold = first.locationType === "Cold Storage";
  const Icon = isCold ? Snowflake : Tag;
  return (
    <div className="flex items-center gap-1">
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
        <Icon className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
        {first.rackCode || first.locationType}
      </span>
      {extra > 0 && <span className="text-[10px] text-muted-foreground">+{extra}</span>}
    </div>
  );
}

function StockLevel({ stock }: { stock: number }) {
  return (
    <span className="block text-center font-mono text-sm font-semibold tabular-nums">
      {stock}
    </span>
  );
}

function BatchActions({ batchId, batchNumber }: { batchId: string; batchNumber: string }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Batch actions"
          className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => navigate({ to: "/dashboard/batches/$batchId", params: { batchId } })}
        >
          <Pencil className="mr-2 h-4 w-4" /> View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("Edit coming soon")}>
          <Pencil className="mr-2 h-4 w-4" /> Edit batch
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast(`QR label for ${batchNumber} queued`)}>
          <QrCode className="mr-2 h-4 w-4" /> Print QR label
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("Move stock coming soon")}>
          <Move className="mr-2 h-4 w-4" /> Move stock
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("Quarantine coming soon")}>
          <ShieldAlert className="mr-2 h-4 w-4" /> Quarantine batch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BatchCard({ row }: { row: Row }) {
  const { batch, med, status, totalStock, locations } = row;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <BatchChip batchId={batch.id} batchNumber={batch.batchNumber} />
          <div className="mt-1.5 truncate text-sm font-medium text-foreground">
            {med?.name ?? "—"}
          </div>
          {med?.genericName && (
            <div className="truncate text-xs text-muted-foreground">{med.genericName}</div>
          )}
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3">
        <ExpiryCell expiryDate={batch.expiryDate} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <LocationPill locations={locations} />
        <div className="text-xs text-muted-foreground">Available: {totalStock}</div>
      </div>
    </div>
  );
}

function BatchesPage() {
  const batches = useDb((d) => d.batches);
  const meds = useDb((d) => d.medicines);
  const manufacturers = useDb((d) => d.manufacturers);
  const inventoryStock = useDb((d) => d.inventoryStock);
  const settings = useDb((d) => d.settings);
  const has = usePermission();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [medFilter, setMedFilter] = useState("all");
  const [locFilter, setLocFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "near_expiry" | "expired" | "sold_out"
  >("all");
  const [view, setView] = useState<"table" | "grid">(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
      ? "grid"
      : "table",
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent) => setView(e.matches ? "grid" : "table");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    inventoryStock.forEach((s) => set.add(s.locationType));
    return Array.from(set).sort();
  }, [inventoryStock]);

  const manName = useMemo(() => new Map(manufacturers.map((m) => [m.id, m.name])), [manufacturers]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();

    const stockByBatch = new Map<string, number>();
    const locByBatch = new Map<string, { locationType: LocationType; rackCode: string }[]>();
    inventoryStock.forEach((stock) => {
      stockByBatch.set(
        stock.batchId,
        (stockByBatch.get(stock.batchId) || 0) + stock.quantityOnHand,
      );
      const arr = locByBatch.get(stock.batchId) || [];
      arr.push({ locationType: stock.locationType, rackCode: stock.rackCode });
      locByBatch.set(stock.batchId, arr);
    });

    return batches
      .map((b) => {
        const med = meds.find((m) => m.id === b.medicineId);
        const totalStock = stockByBatch.get(b.id) || 0;
        const status = computeBatchStatus(b, totalStock, settings.nearExpiryDays);
        const locations = locByBatch.get(b.id) || [];
        return { batch: b, med, status, totalStock, locations };
      })
      .filter(({ batch, med, status, totalStock, locations }) => {
        if (medFilter !== "all" && batch.medicineId !== medFilter) return false;
        if (locFilter !== "all" && !locations.some((l) => l.locationType === locFilter))
          return false;
        if (statusFilter !== "all") {
          const matches =
            statusFilter === "active"
              ? computeBatchStatus(batch, totalStock, ACTIVE_REF_DAYS) === "active"
              : status === statusFilter;
          if (!matches) return false;
        }
        if (!s) return true;
        const hay = `${batch.batchNumber} ${med?.name ?? ""} ${med?.genericName ?? ""} ${
          manName.get(med?.manufacturerId ?? "") ?? ""
        }`.toLowerCase();
        return hay.includes(s);
      })
      .sort((a, b) => (a.batch.expiryDate || "").localeCompare(b.batch.expiryDate || ""));
  }, [
    batches,
    meds,
    manName,
    inventoryStock,
    settings.nearExpiryDays,
    q,
    medFilter,
    locFilter,
    statusFilter,
  ]);

  const kpis = useMemo(() => {
    const stockMap = new Map<string, number>();
    inventoryStock.forEach((s) =>
      stockMap.set(s.batchId, (stockMap.get(s.batchId) ?? 0) + s.quantityOnHand),
    );
    let active = 0;
    let near = 0;
    let value = 0;
    const activeRefDays = 90;
    const activeMeds = new Set<string>();
    batches.forEach((b) => {
      const total = stockMap.get(b.id) ?? 0;
      if (computeBatchStatus(b, total, ACTIVE_REF_DAYS) === "active") {
        active++;
        activeMeds.add(b.medicineId);
      }
      if (computeBatchStatus(b, total, settings.nearExpiryDays) === "near_expiry") near++;
      value += total * (b.purchasePrice || 0);
    });
    return { active, near, value, medicineCount: activeMeds.size };
  }, [batches, inventoryStock, settings.nearExpiryDays]);

  const toggleStatus = (s: "active" | "near_expiry") =>
    setStatusFilter((cur) => (cur === s ? "all" : s));

  const setNearExpiryWindow = (days: number) => {
    db.set((d) => {
      d.settings.nearExpiryDays = days;
    });
    setQ("");
    setMedFilter("all");
    setLocFilter("all");
    setStatusFilter("near_expiry");
  };

  const submit = (v: BatchFormValues) => {
    const id = db.uid();
    const now = new Date().toISOString();
    db.set((d) => {
      d.batches.push({
        id,
        medicineId: v.medicineId,
        batchNumber: v.batchNumber,
        mfgDate: new Date(v.mfgDate).toISOString(),
        expiryDate: new Date(v.expiryDate).toISOString(),
        mrp: 0,
        purchasePrice: 0,
        sellingPrice: 0,
        supplierId: v.supplierId || undefined,
        currentStock: v.quantityReceived,
        createdAt: now,
      });
    });
    if (user) {
      applyStockMovement({
        batchId: id,
        locationType: v.locationType,
        rackCode: v.rackCode,
        movementType: "Purchase Inward",
        quantityChange: v.quantityReceived,
        userId: user.id,
        userName: user.name,
      });
      logActivity({
        userId: user.id,
        userName: user.name,
        action: `Added batch ${v.batchNumber}`,
        entityType: "batch",
        entityId: id,
      });
    }
    toast.success("Batch added");
    setSheetOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Every unit is tracked by batch â€” including MRP, cost, expiry and supplier."
        actions={
          has("batches", "create") && (
            <Button
              size="sm"
              onClick={() => setSheetOpen(true)}
              className="shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30"
            >
              <Plus className="mr-1 h-4 w-4" strokeWidth={1.5} /> Add batch
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Active Batches"
          value={kpis.active}
          hint={`Across ${kpis.medicineCount} medicines`}
          icon={Boxes}
          tone="default"
          onClick={() => toggleStatus("active")}
          selected={statusFilter === "active"}
        />
        <KpiCard
          label={`Expiring within ${settings.nearExpiryDays} days`}
          value={kpis.near}
          badge={`${kpis.near} Batches`}
          hint="Flagged for priority action"
          icon={Timer}
          tone="warning"
          onClick={() => toggleStatus("near_expiry")}
          selected={statusFilter === "near_expiry"}
          iconMenu={
            <>
              {[7, 30, 90].map((d) => (
                <DropdownMenuItem key={d} onSelect={() => setNearExpiryWindow(d)}>
                  <span className="flex w-4 shrink-0 justify-center">
                    {settings.nearExpiryDays === d && <Check className="h-4 w-4" />}
                  </span>
                  Expiring in {d} days
                </DropdownMenuItem>
              ))}
            </>
          }
        />
        <KpiCard
          label="Total Inventory Value"
          value={`${settings.currency}${Math.round(kpis.value).toLocaleString("en-IN")}`}
          hint="Purchase cost basis"
          icon={TrendingUp}
          tone="default"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            className="pl-9"
            placeholder="Search by batch number or medicineâ€¦"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-none">
          <Select value={medFilter} onValueChange={setMedFilter}>
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="Medicine Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All medicines</SelectItem>
              {meds.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locFilter} onValueChange={setLocFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Rack / Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All racks</SelectItem>
              {locationOptions.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="near_expiry">Near expiry</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="sold_out">Sold out</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
            <button
              type="button"
              title="Table view"
              onClick={() => setView("table")}
              className={cn(
                "grid h-7 w-7 place-items-center rounded",
                view === "table"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutList className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              title="Grid view"
              onClick={() => setView("grid")}
              className={cn(
                "grid h-7 w-7 place-items-center rounded",
                view === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        statusFilter === "near_expiry" ? (
          <EmptyState
            icon={Timer}
            title={`No batches expiring within ${settings.nearExpiryDays} days`}
            description={`No in-stock batches expire in the next ${settings.nearExpiryDays} days. Try a wider window.`}
          />
        ) : (
          <EmptyState title="No batches match" description="Adjust your filters or add a batch." />
        )
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <BatchCard key={row.batch.id} row={row} />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <table className="w-full table-fixed text-sm [&_th]:border-r [&_th:last-child]:border-r-0 [&_td]:border-r [&_td:last-child]:border-r-0">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="md:w-[160px] md:whitespace-nowrap px-3 py-2.5 text-left align-middle font-medium">
                    Batch Number
                  </th>
                  <th className="md:w-[240px] px-3 py-2.5 text-left align-middle font-medium">
                    Medicine
                  </th>
                  <th className="hidden md:table-cell md:w-[140px] md:whitespace-nowrap px-3 py-2.5 text-left align-middle font-medium">
                    Rack / Zone
                  </th>
                  <th className="md:w-[110px] md:whitespace-nowrap px-3 py-2.5 text-center align-middle font-medium">
                    Available Qty
                  </th>
                  <th className="hidden md:table-cell md:w-[110px] md:whitespace-nowrap px-3 py-2.5 text-center align-middle font-medium">
                    Mfg Date
                  </th>
                  <th className="md:w-[110px] md:whitespace-nowrap px-3 py-2.5 text-center align-middle font-medium">
                    Expiry Date
                  </th>
                  <th className="hidden md:table-cell md:w-[120px] md:whitespace-nowrap px-3 py-2.5 text-left align-middle font-medium">
                    Status
                  </th>
                  <th className="md:w-[64px] md:whitespace-nowrap px-3 py-2.5 text-right align-middle font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.batch.id} className="group hover:bg-accent/40">
                    <td className="md:whitespace-nowrap px-3 py-2.5 align-middle">
                      <BatchChip batchId={row.batch.id} batchNumber={row.batch.batchNumber} />
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#E6F4F1] text-[#007A5A]">
                          <PackageOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">
                            {row.med?.name ?? "—"}
                          </div>
                          {row.med?.genericName && (
                            <div className="truncate text-xs text-muted-foreground">
                              {row.med.genericName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell whitespace-nowrap px-3 py-2.5 align-middle">
                      <LocationPill locations={row.locations} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center align-middle">
                      <StockLevel stock={row.totalStock} />
                    </td>
                    <td className="px-4 py-3">{med?.name ?? "â€”"}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {format(new Date(batch.expiryDate), "dd MMM yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center align-middle">
                      <ExpiryCell expiryDate={row.batch.expiryDate} />
                    </td>
                    <td className="hidden md:table-cell whitespace-nowrap px-3 py-2.5 align-middle">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right align-middle">
                      <BatchActions batchId={row.batch.id} batchNumber={row.batch.batchNumber} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AddBatchSheet open={sheetOpen} onOpenChange={setSheetOpen} onSubmit={submit} />
    </div>
  );
}
