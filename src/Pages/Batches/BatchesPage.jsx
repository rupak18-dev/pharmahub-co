import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Activity,
  Boxes,
  CalendarDays,
  Check,
  Columns3,
  Copy,
  Download,
  FileSpreadsheet,
  Info,
  LayoutList,
  MoreHorizontal,
  Move,
  PackageOpen,
  Pencil,
  Pill,
  Plus,
  Printer,
  QrCode,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Snowflake,
  Tag,
  Timer,
  TrendingUp,
  X,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { usePermission } from "@/hooks/usePermission";
import { apiRequest } from "@/lib/api";
import { computeBatchStatus } from "@/lib/stock";
import { cn } from "@/lib/utils";
import { exportBatchesCsv, exportBatchesPdf } from "@/lib/batch-export";
import { PageHeader } from "@/Components/shared/PageHeader";
import { EmptyState } from "@/Components/shared/EmptyState";
import { StatusBadge } from "@/Components/shared/StatusBadge";
import { KpiCard } from "@/Components/shared/KpiCard";
import { AddBatchSheet } from "@/Components/shared/AddBatchSheet";
import BatchQrSheet from "@/Components/shared/BatchQrSheet";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Checkbox } from "@/Components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/Components/ui/pagination";

export const handle = { title: "Batches · PharmaHub" };

const safeFormat = (dateStr, fmt) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (!isValid(d)) return "—";
  return format(d, fmt);
};
const chipCls =
  "inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 font-mono text-xs font-semibold text-primary";
const ACTIVE_REF_DAYS = 365;
const DEFAULT_SETTINGS = { currency: "₹", nearExpiryDays: 90 };

function BatchChip({ batchId, batchNumber }) {
  return (
    <span className={cn(chipCls, "group/chip transition-colors hover:bg-primary/15")}>
      <Link to={`/batches/${batchId}`} className="hover:underline">
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
function MfgCell({ mfgDate }) {
  return (
    <span className="font-mono text-xs font-medium text-foreground">
      {safeFormat(mfgDate, "MM/yyyy")}
    </span>
  );
}
function ExpiryCell({ expiryDate }) {
  return (
    <span className="font-mono text-xs font-medium text-foreground">
      {safeFormat(expiryDate, "MM/yyyy")}
    </span>
  );
}
function LocationPill({ locations }) {
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
function StockLevel({ stock }) {
  return (
    <span className="block text-center font-mono text-sm font-semibold tabular-nums">{stock}</span>
  );
}
function BatchActions({ row, onQr, onExport }) {
  const navigate = useNavigate();
  const { batch } = row;
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
        <DropdownMenuItem onClick={() => navigate(`/batches/${batch.id}`)}>
          <Info className="mr-2 h-4 w-4" /> View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onQr(row)}>
          <QrCode className="mr-2 h-4 w-4" /> Print QR label
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onExport(row, "csv")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport(row, "pdf")}>
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toast("Edit coming soon")}>
          <Pencil className="mr-2 h-4 w-4" /> Edit batch
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
function BatchCard({ row, checked, onToggle }) {
  const { batch, med, status, totalStock, locations } = row;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <Checkbox
            checked={checked}
            onCheckedChange={onToggle}
            className="mt-0.5"
            aria-label={`Select ${batch.batchNumber}`}
          />
          <div className="min-w-0">
            <BatchChip batchId={batch.id} batchNumber={batch.batchNumber} />
            <div className="mt-1.5 truncate text-sm font-medium text-foreground">
              {med?.name ?? "—"}
            </div>
            {med?.generic && (
              <div className="truncate text-xs text-muted-foreground">{med.generic}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <StatusBadge status={status} />
          <BatchActions row={row} onQr={onQr} onExport={onExport} />
        </div>
      </div>
      <div className="mt-3">
        <ExpiryCell expiryDate={batch.dates?.expiryDate} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <LocationPill locations={locations} />
        <div className="text-xs text-muted-foreground">Available: {totalStock}</div>
      </div>
    </div>
  );
}

const COLUMN_DEFS = [
  { key: "active", title: "Active", filter: (s) => s === "active" },
  { key: "near_expiry", title: "Near expiry", filter: (s) => s === "near_expiry" },
  {
    key: "action_required",
    title: "Action required",
    filter: (s) => s === "expired" || s === "quarantined",
  },
];
const TABLE_COLUMNS = [
  { id: "batchNumber", label: "Batch Number" },
  { id: "medicine", label: "Medicine" },
  { id: "rack", label: "Rack / Zone" },
  { id: "quantity", label: "Available Qty" },
  { id: "mfg", label: "Mfg Date" },
  { id: "expiry", label: "Expiry Date" },
  { id: "status", label: "Status" },
];
function ColumnView({ rows, selected, onToggle }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMN_DEFS.map((col) => {
        const items = rows.filter((r) => col.filter(r.status));
        return (
          <div key={col.key} className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {col.title}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs tabular-nums text-foreground">
                {items.length}
              </span>
            </div>
            <div className="space-y-3 p-3">
              {items.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No batches</p>
              ) : (
                items.map((row) => (
                  <BatchCard
                    key={row.batch.id}
                    row={row}
                    checked={selected.has(row.batch.id)}
                    onToggle={() => onToggle(row.batch.id)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default function BatchesPage() {
  const rawSettings = useDb((d) => d.settings);
  const settings = { ...DEFAULT_SETTINGS, ...(rawSettings ?? {}) };
  const has = usePermission();
  const [q, setQ] = useState("");
  const [medFilter, setMedFilter] = useState("all");
  const [locFilter, setLocFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleFields, setVisibleFields] = useState([]);
  const isFieldVisible = (id) => visibleFields.length === 0 || visibleFields.includes(id);
  const toggleField = (id) => {
    setVisibleFields((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };
  const [view, setView] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
      ? "column"
      : "table",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [meds, setMeds] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const loadedRef = useRef(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [batchData, medData, supplierData] = await Promise.all([
        apiRequest("/batches"),
        apiRequest("/medicines"),
        apiRequest("/suppliers").catch(() => []),
      ]);
      setBatches(batchData ?? []);
      setMeds(
        (medData ?? []).map((m) => ({
          id: m._id ?? m.id,
          ...m,
          generic: m.genericName ?? m.generic ?? "",
          brand: m.brandName ?? m.brand ?? "",
          manufacturerName: m.manufacturerId?.name ?? "",
        })),
      );
      setSuppliers(supplierData ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      loadedRef.current = true;
    }
  };

  useEffect(() => {
    if (loadedRef.current) return;
    load();
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = (e) => setView(e.matches ? "column" : "table");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  const locationOptions = useMemo(() => {
    const set = new Set();
    batches.forEach((b) => b.warehouse?.locationType && set.add(b.warehouse.locationType));
    return Array.from(set).sort();
  }, [batches]);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return batches
      .map((b) => {
        const med = meds.find((m) => m.id === b.medicineId);
        const totalStock = b.stock?.quantityOnHand ?? 0;
        const status = computeBatchStatus(b, totalStock, settings.nearExpiryDays);
        const locations = b.warehouse
          ? [{ locationType: b.warehouse.locationType, rackCode: b.warehouse.rackCode }]
          : [];
        return { batch: b, med, status, totalStock, locations };
      })
      .filter(({ batch, med, status, locations }) => {
        if (medFilter !== "all" && batch.medicineId !== medFilter) return false;
        if (locFilter !== "all" && !locations.some((l) => l.locationType === locFilter))
          return false;
        if (statusFilter !== "all") {
          const matches =
            statusFilter === "active"
              ? computeBatchStatus(batch, batch.stock?.quantityOnHand ?? 0, ACTIVE_REF_DAYS) ===
                "active"
              : status === statusFilter;
          if (!matches) return false;
        }
        if (!s) return true;
        const hay =
          `${batch.batchNumber} ${med?.name ?? ""} ${med?.generic ?? ""} ${med?.brand ?? ""} ${med?.manufacturerName ?? ""}`.toLowerCase();
        return hay.includes(s);
      })
      .sort((a, b) =>
        (a.batch.dates?.expiryDate || "").localeCompare(b.batch.dates?.expiryDate || ""),
      );
  }, [batches, meds, settings.nearExpiryDays, q, medFilter, locFilter, statusFilter]);
  const [selected, setSelected] = useState(() => new Set());
  const [qrOpen, setQrOpen] = useState(false);
  const [qrItems, setQrItems] = useState([]);
  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.batch.id)),
    [rows, selected],
  );
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.batch.id));
  const someSelected = selected.size > 0;
  const toggleRow = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(() => {
      if (allSelected) return new Set();
      return new Set(rows.map((r) => r.batch.id));
    });
  const clearSelection = () => setSelected(new Set());
  const openQr = (items) => {
    setQrItems(items);
    setQrOpen(true);
  };
  const handleExport = async (dataRows, format) => {
    try {
      const ok =
        format === "csv"
          ? exportBatchesCsv(dataRows, visibleFields)
          : await exportBatchesPdf(dataRows, visibleFields);
      if (ok) {
        toast.success(
          `Exported ${dataRows.length} batch${dataRows.length === 1 ? "" : "es"} to ${format.toUpperCase()}`,
        );
      } else {
        toast.error("Nothing to export");
      }
    } catch (err) {
      toast.error(err.message || "Export failed");
    }
  };
  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const paginatedData = rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  useEffect(() => {
    setCurrentPage(1);
    setSelected(new Set());
  }, [q, medFilter, locFilter, statusFilter, view]);
  const kpis = useMemo(() => {
    let active = 0;
    let near = 0;
    let value = 0;
    const activeMeds = new Set();
    batches.forEach((b) => {
      const total = b.stock?.quantityOnHand ?? 0;
      if (computeBatchStatus(b, total, ACTIVE_REF_DAYS) === "active") {
        active++;
        activeMeds.add(b.medicineId);
      }
      if (computeBatchStatus(b, total, settings.nearExpiryDays) === "near_expiry") near++;
      value += total * (b.pricing?.purchasePrice ?? 0);
    });
    return { active, near, value, medicineCount: activeMeds.size };
  }, [batches, settings.nearExpiryDays]);
  const toggleStatus = (s) => setStatusFilter((cur) => (cur === s ? "all" : s));
  const setNearExpiryWindow = (days) => {
    db.set((d) => {
      d.settings.nearExpiryDays = days;
    });
    setQ("");
    setMedFilter("all");
    setLocFilter("all");
    setStatusFilter("near_expiry");
  };
  const submit = async (v) => {
    const now = new Date().toISOString();
    const isQuarantine = v.locationType === "Quarantine";
    setSubmitting(true);
    try {
      await apiRequest("/batches", {
        method: "POST",
        body: JSON.stringify({
          medicineId: v.medicineId,
          supplierId: v.supplierId || null,
          batchNumber: v.batchNumber,
          batchType: v.batchType,
          dates: {
            manufacturingDate: new Date(v.mfgDate).toISOString(),
            expiryDate: new Date(v.expiryDate).toISOString(),
            quarantineUntil: isQuarantine
              ? new Date(Date.now() + 14 * 86400000).toISOString()
              : null,
          },
          pricing: { purchasePrice: 0, mrp: 0, sellingPrice: 0, gstRate: 0 },
          status: {
            isRecalled: false,
            state: isQuarantine ? "QUARANTINED" : "ACTIVE",
            quarantineReason: isQuarantine ? "Awaiting QC" : null,
          },
          stock: {
            uom: v.unit || "Units",
            quantityOnHand: isQuarantine ? 0 : Number(v.quantityReceived),
            reservedQuantity: 0,
            quarantined: isQuarantine ? Number(v.quantityReceived) : 0,
          },
          warehouse: { locationType: v.locationType, rackCode: v.rackCode },
          audit: { createdAt: now, updatedAt: now },
          version: 1,
        }),
      });
      toast.success("Batch added");
      setSheetOpen(false);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Real-time lot tracking, visual shelf-life countdowns, and automated expiration risk management."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-muted-foreground">
                  <Download className="h-4 w-4" strokeWidth={1.5} />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  Export {rows.length} batch{rows.length === 1 ? "" : "es"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport(rows, "csv")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(rows, "pdf")}>
                  <Download className="mr-2 h-4 w-4" /> Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {has("batches", "create") && (
              <Button
                size="sm"
                onClick={() => setSheetOpen(true)}
                className="shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30"
              >
                <Plus className="mr-1 h-4 w-4" strokeWidth={1.5} /> Add batch
              </Button>
            )}
          </>
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
          icon={CalendarDays}
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
            placeholder="Search by batch code, medicine name, or manufacturer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={medFilter} onValueChange={setMedFilter}>
            <SelectTrigger className="sm:w-52">
              <Pill className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <SelectValue className="flex-1" placeholder="Medicine Filter" />
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
              <Tag className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <SelectValue className="flex-1" placeholder="Rack / Zone" />
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
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
            <SelectTrigger className="sm:w-40">
              <Activity
                className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                strokeWidth={1.5}
              />
              <SelectValue className="flex-1" placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="near_expiry">Near expiry</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="sold_out">Sold out</SelectItem>
              <SelectItem value="quarantined">Quarantined</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                Filters
                {visibleFields.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                    {visibleFields.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Show / hide columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TABLE_COLUMNS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={isFieldVisible(col.id)}
                  onCheckedChange={() => toggleField(col.id)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setVisibleFields([])}
                className="justify-center text-xs"
              >
                Show all columns
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="col-span-2 flex justify-center sm:col-span-1 sm:flex-none">
            <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
              <button
                type="button"
                title="Table view"
                onClick={() => setView("table")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded",
                  view === "table"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutList className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                title="Column view"
                onClick={() => setView("column")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded",
                  view === "column"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Columns3 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {someSelected && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="text-sm font-medium text-foreground">
            {selected.size} batch{selected.size === 1 ? "" : "es"} selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => openQr(selectedRows)}>
              <QrCode className="mr-1.5 h-4 w-4" strokeWidth={1.5} /> Generate QR labels
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              <X className="mr-1.5 h-4 w-4" strokeWidth={1.5} /> Clear
            </Button>
          </div>
        </div>
      )}

      {loading && batches.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed border-border bg-card py-16 text-sm text-muted-foreground">
          Loading batches…
        </div>
      ) : error ? (
        <EmptyState
          title="Couldn't load batches"
          description={error}
          action={
            <Button size="sm" onClick={() => load()}>
              Retry
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        statusFilter === "near_expiry" ? (
          <EmptyState
            icon={Timer}
            title={`No batches expiring within ${settings.nearExpiryDays} days`}
            description={`No in-stock batches expire in the next ${settings.nearExpiryDays} days. Try a wider window.`}
          />
        ) : (
          <EmptyState title="No batches match" description="Adjust your filters or add a batch." />
        )
      ) : view === "column" ? (
        <ColumnView rows={paginatedData} selected={selected} onToggle={toggleRow} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <table className="w-full table-fixed text-sm [&_th]:border-r [&_th:last-child]:border-r-0 [&_td]:border-r [&_td:last-child]:border-r-0">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="md:w-[56px] md:whitespace-nowrap px-1 py-2.5 text-center align-middle">
                    <label className="flex cursor-pointer flex-col items-center gap-1">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={toggleAll}
                        aria-label="Select all batches"
                      />
                      <span className="font-medium normal-case leading-none text-muted-foreground">
                        Select all
                      </span>
                    </label>
                  </th>
                  {isFieldVisible("batchNumber") && (
                    <th className="md:w-[160px] md:whitespace-nowrap px-3 py-2.5 text-left align-middle font-medium">
                      Batch Number
                    </th>
                  )}
                  {isFieldVisible("medicine") && (
                    <th className="md:w-[240px] px-3 py-2.5 text-left align-middle font-medium">
                      Medicine
                    </th>
                  )}
                  {isFieldVisible("rack") && (
                    <th className="hidden md:table-cell md:w-[140px] md:whitespace-nowrap px-3 py-2.5 text-left align-middle font-medium">
                      Rack / Zone
                    </th>
                  )}
                  {isFieldVisible("quantity") && (
                    <th className="md:w-[110px] md:whitespace-nowrap px-3 py-2.5 text-center align-middle font-medium">
                      Available Qty
                    </th>
                  )}
                  {isFieldVisible("mfg") && (
                    <th className="hidden md:table-cell md:w-[110px] md:whitespace-nowrap px-3 py-2.5 text-center align-middle font-medium">
                      Mfg Date
                    </th>
                  )}
                  {isFieldVisible("expiry") && (
                    <th className="md:w-[110px] md:whitespace-nowrap px-3 py-2.5 text-center align-middle font-medium">
                      Expiry Date
                    </th>
                  )}
                  {isFieldVisible("status") && (
                    <th className="hidden md:table-cell md:w-[120px] md:whitespace-nowrap px-3 py-2.5 text-left align-middle font-medium">
                      Status
                    </th>
                  )}
                  <th className="md:w-[64px] md:whitespace-nowrap px-3 py-2.5 text-right align-middle font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedData.map((row) => (
                  <tr key={row.batch.id} className="group hover:bg-accent/40">
                    <td className="px-1 py-2.5 text-center align-middle">
                      <Checkbox
                        checked={selected.has(row.batch.id)}
                        onCheckedChange={() => toggleRow(row.batch.id)}
                        aria-label={`Select ${row.batch.batchNumber}`}
                        className="mx-auto"
                      />
                    </td>
                    {isFieldVisible("batchNumber") && (
                      <td className="md:whitespace-nowrap px-3 py-2.5 align-middle">
                        <BatchChip batchId={row.batch.id} batchNumber={row.batch.batchNumber} />
                      </td>
                    )}
                    {isFieldVisible("medicine") && (
                      <td className="px-3 py-2.5 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#E6F4F1] text-[#007A5A]">
                            <PackageOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {row.med?.name ?? "—"}
                            </div>
                            {row.med?.generic && (
                              <div className="truncate text-xs text-muted-foreground">
                                {row.med.generic}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    {isFieldVisible("rack") && (
                      <td className="hidden md:table-cell whitespace-nowrap px-3 py-2.5 align-middle">
                        <LocationPill locations={row.locations} />
                      </td>
                    )}
                    {isFieldVisible("quantity") && (
                      <td className="whitespace-nowrap px-3 py-2.5 text-center align-middle">
                        <StockLevel stock={row.totalStock} />
                      </td>
                    )}
                    {isFieldVisible("mfg") && (
                      <td className="hidden md:table-cell whitespace-nowrap px-3 py-2.5 text-center align-middle">
                        <MfgCell mfgDate={row.batch.dates?.manufacturingDate} />
                      </td>
                    )}
                    {isFieldVisible("expiry") && (
                      <td className="whitespace-nowrap px-3 py-2.5 text-center align-middle">
                        <ExpiryCell expiryDate={row.batch.dates?.expiryDate} />
                      </td>
                    )}
                    {isFieldVisible("status") && (
                      <td className="hidden md:table-cell whitespace-nowrap px-3 py-2.5 align-middle">
                        <StatusBadge status={row.status} />
                      </td>
                    )}
                    <td className="whitespace-nowrap px-3 py-2.5 text-right align-middle">
                      <BatchActions
                        row={row}
                        onQr={(r) => openQr([{ batch: r.batch, med: r.med }])}
                        onExport={(r, fmt) => handleExport([r], fmt)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="mt-8 border-t border-border/40 pt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, i, arr) => (
                  <Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === p}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(p);
                        }}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  </Fragment>
                ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                  }}
                  className={
                    currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AddBatchSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSubmit={submit}
        meds={meds}
        batches={batches}
        suppliers={suppliers}
      />
      <BatchQrSheet open={qrOpen} onOpenChange={setQrOpen} items={qrItems} />
    </div>
  );
}
