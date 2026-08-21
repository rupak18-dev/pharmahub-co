import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Activity,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  Columns3,
  Copy,
  Download,
  FileSpreadsheet,
  Filter,
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
import { apiRequest, getCachedResponse } from "@/lib/api";
import { computeBatchStatus } from "@/lib/stock";
import { cn } from "@/lib/utils";
import { exportBatchesCsv, exportBatchesPdf } from "@/lib/batch-export";
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

export const handle = { title: "Batches · PharmaHub" };

function BatchCheckboxItem(props) {
  return (
    <DropdownMenuCheckboxItem {...props} boxClassName="h-3.5 w-3.5" iconClassName="h-2.5 w-2.5" />
  );
}

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
    <span className={cn(chipCls, "max-w-full group/chip transition-colors hover:bg-primary/15")}>
      <Link to={`/batches/${batchId}`} className="min-w-0 truncate hover:underline">
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
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
        <Icon className="h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        <span className="truncate">{first.rackCode || first.locationType}</span>
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
        <DropdownMenuItem onClick={() => navigate(`/batches/${batch.id}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit batch
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("Move stock coming soon")}>
          <Move className="mr-2 h-4 w-4" /> Move stock
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/batches/${batch.id}/quarantine`)}>
          <ShieldAlert className="mr-2 h-4 w-4" /> Quarantine batch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function BatchCard({ row, checked, onToggle, onQr, onExport }) {
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
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "near_expiry", label: "Near expiry" },
  { value: "expired", label: "Expired" },
  { value: "sold_out", label: "Sold out" },
  { value: "quarantined", label: "Quarantined" },
];
const normalizeMeds = (medData) =>
  (medData ?? []).map((m) => ({
    id: m._id ?? m.id,
    ...m,
    generic: m.genericName ?? m.generic ?? "",
    brand: m.brandName ?? m.brand ?? "",
    manufacturerName: m.manufacturerId?.name ?? "",
  }));
function ColumnView({ rows, selected, onToggle, onQr, onExport }) {
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
                    onQr={onQr}
                    onExport={onExport}
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
  const [searchInput, setSearchInput] = useState("");
  const [medFilters, setMedFilters] = useState([]);
  const [locFilters, setLocFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);
  const [visibleFields, setVisibleFields] = useState(() => TABLE_COLUMNS.map((c) => c.id));
  const isFieldVisible = (id) => visibleFields.includes(id);
  const toggleField = (id) => {
    setVisibleFields((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };
  const allColumnsSelected = visibleFields.length === TABLE_COLUMNS.length;
  const someColumnsSelected = visibleFields.length > 0 && !allColumnsSelected;
  const toggleAllColumns = () =>
    setVisibleFields((prev) =>
      prev.length === TABLE_COLUMNS.length ? [] : TABLE_COLUMNS.map((c) => c.id),
    );
  const makeToggler = (setter) => (v) =>
    setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const toggleMed = makeToggler(setMedFilters);
  const toggleLoc = makeToggler(setLocFilters);
  const toggleStatusValue = makeToggler(setStatusFilters);
  const [view, setView] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
      ? "column"
      : "table",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [batches, setBatches] = useState(() => getCachedResponse("/batches")?.data ?? []);
  const [meds, setMeds] = useState(() => normalizeMeds(getCachedResponse("/medicines")?.data));
  const [suppliers, setSuppliers] = useState(() => getCachedResponse("/suppliers")?.data ?? []);
  const [loading, setLoading] = useState(() => !getCachedResponse("/batches"));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const loadedRef = useRef(false);

  const applyMeds = (medData) => setMeds(normalizeMeds(medData));

  const loadBatches = async () => {
    const data = await apiRequest("/batches");
    setBatches(data ?? []);
  };

  const load = () => {
    setLoading(true);
    setError(null);
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
        loadedRef.current = true;
      }
    };
    loadBatches()
      .catch((e) => setError(e.message))
      .finally(finish);
    apiRequest("/medicines")
      .then(applyMeds)
      .catch(() => {});
    apiRequest("/suppliers")
      .then((d) => setSuppliers(d ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    if (loadedRef.current) return;
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

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
  const medMap = useMemo(() => new Map(meds.map((m) => [m.id, m])), [meds]);
  const sortedMeds = useMemo(
    () =>
      [...meds].sort((a, b) =>
        String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
          sensitivity: "base",
        }),
      ),
    [meds],
  );
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return batches
      .map((b) => {
        const med = medMap.get(b.medicineId);
        const totalStock = b.stock?.quantityOnHand ?? 0;
        const status = computeBatchStatus(b, totalStock, settings.nearExpiryDays);
        const locations = b.warehouse
          ? [{ locationType: b.warehouse.locationType, rackCode: b.warehouse.rackCode }]
          : [];
        return { batch: b, med, status, totalStock, locations };
      })
      .filter(({ batch, med, status, locations }) => {
        if (medFilters.length > 0 && !medFilters.includes(batch.medicineId)) return false;
        if (locFilters.length > 0 && !locations.some((l) => locFilters.includes(l.locationType)))
          return false;
        if (statusFilters.length > 0) {
          const matches = statusFilters.some((f) =>
            f === "active"
              ? computeBatchStatus(batch, batch.stock?.quantityOnHand ?? 0, ACTIVE_REF_DAYS) ===
                "active"
              : status === f,
          );
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
  }, [batches, medMap, settings.nearExpiryDays, q, medFilters, locFilters, statusFilters]);
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
      if (visibleFields.length === 0) {
        toast.error("Nothing to export");
        return;
      }
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
  }, [q, medFilters, locFilters, statusFilters, view]);
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
  const toggleStatus = (s) =>
    setStatusFilters((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const setNearExpiryWindow = (days) => {
    db.set((d) => {
      d.settings.nearExpiryDays = days;
    });
    setSearchInput("");
    setQ("");
    setMedFilters([]);
    setLocFilters([]);
    setStatusFilters(["near_expiry"]);
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
      try {
        await loadBatches();
      } catch {
        toast.error("Batch saved, but couldn't refresh the list");
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center px-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Batches</h1>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Active Batches"
          value={kpis.active}
          hint={`Across ${kpis.medicineCount} medicines`}
          icon={Boxes}
          tone="default"
          onClick={() => toggleStatus("active")}
          selected={statusFilters.includes("active")}
        />
        <KpiCard
          label={`Expiring within ${settings.nearExpiryDays} days`}
          value={kpis.near}
          badge={`${kpis.near} Batches`}
          hint="Flagged for priority action"
          icon={CalendarDays}
          tone="warning"
          onClick={() => toggleStatus("near_expiry")}
          selected={statusFilters.includes("near_expiry")}
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

      {/* Main white container */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-border/40 flex flex-col flex-1 overflow-hidden">
        {/* Top Controls Bar */}
        <div className="p-4 border-b border-border/40">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-9 bg-white border-border/80 rounded-md text-sm focus-visible:ring-1 focus-visible:ring-[#007A87]"
                placeholder="Search by batch code, medicine name, or manufacturer…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[150px] h-9 justify-between px-3 text-xs bg-white rounded-md border-border/80 font-normal"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Pill
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                    <span className="truncate">
                      {medFilters.length === 0
                        ? "All medicines"
                        : medFilters.length === 1
                          ? (medMap.get(medFilters[0])?.name ?? "1 medicine")
                          : `${medFilters.length} medicines`}
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 max-h-72 overflow-y-auto">
                {sortedMeds.map((m) => (
                  <BatchCheckboxItem
                    key={m.id}
                    checked={medFilters.includes(m.id)}
                    onCheckedChange={() => toggleMed(m.id)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {m.name}
                  </BatchCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setMedFilters([])}
                  disabled={medFilters.length === 0}
                  className="justify-center text-xs"
                >
                  All medicines
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] h-9 justify-between px-3 text-xs bg-white rounded-md border-border/80 font-normal"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Activity
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                    <span className="truncate">
                      {statusFilters.length === 0
                        ? "All statuses"
                        : statusFilters.length === 1
                          ? (STATUS_OPTIONS.find((o) => o.value === statusFilters[0])?.label ??
                            "Status")
                          : `${statusFilters.length} statuses`}
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {STATUS_OPTIONS.map((o) => (
                  <BatchCheckboxItem
                    key={o.value}
                    checked={statusFilters.includes(o.value)}
                    onCheckedChange={() => toggleStatusValue(o.value)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {o.label}
                  </BatchCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setStatusFilters([])}
                  disabled={statusFilters.length === 0}
                  className="justify-center text-xs"
                >
                  All statuses
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 px-3 text-xs bg-white text-slate-700 border-border/80 rounded-md gap-2"
                >
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  Manage filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Customize Filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <BatchCheckboxItem
                  checked={
                    allColumnsSelected ? true : someColumnsSelected ? "indeterminate" : false
                  }
                  onCheckedChange={toggleAllColumns}
                  onSelect={(e) => e.preventDefault()}
                  className="font-semibold"
                >
                  Select All
                </BatchCheckboxItem>
                <DropdownMenuSeparator />
                {TABLE_COLUMNS.map((col) => (
                  <BatchCheckboxItem
                    key={col.id}
                    checked={isFieldVisible(col.id)}
                    onCheckedChange={() => toggleField(col.id)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {col.label}
                  </BatchCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-auto flex items-center gap-0.5 rounded-md border border-border/80 bg-white shadow-sm overflow-hidden">
              <button
                type="button"
                title="Table view"
                onClick={() => setView("table")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-none",
                  view === "table"
                    ? "bg-muted/50 text-foreground"
                    : "text-muted-foreground hover:bg-muted/30",
                )}
              >
                <LayoutList className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <div className="w-[1px] h-4 bg-border/80"></div>
              <button
                type="button"
                title="Column view"
                onClick={() => setView("column")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-none",
                  view === "column"
                    ? "bg-muted/50 text-foreground"
                    : "text-muted-foreground hover:bg-muted/30",
                )}
              >
                <Columns3 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {someSelected && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-primary/5 px-4 py-2">
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

        <div className="flex-1 overflow-y-auto p-0">
          {loading && batches.length === 0 ? (
            <div className="grid place-items-center py-16 text-sm text-muted-foreground">
              Loading batches…
            </div>
          ) : error ? (
            <div className="py-16">
              <EmptyState
                title="Couldn't load batches"
                description={error}
                action={
                  <Button size="sm" onClick={() => load()}>
                    Retry
                  </Button>
                }
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16">
              {statusFilters.includes("near_expiry") ? (
                <EmptyState
                  icon={Timer}
                  title={`No batches expiring within ${settings.nearExpiryDays} days`}
                  description={`No in-stock batches expire in the next ${settings.nearExpiryDays} days. Try a wider window.`}
                />
              ) : (
                <EmptyState
                  title="No batches match"
                  description="Adjust your filters or add a batch."
                />
              )}
            </div>
          ) : view === "column" ? (
            <div className="p-4">
              <ColumnView
                rows={paginatedData}
                selected={selected}
                onToggle={toggleRow}
                onQr={(r) => openQr([{ batch: r.batch, med: r.med }])}
                onExport={(r, fmt) => handleExport([r], fmt)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/80 rounded-2xl shadow-sm bg-white m-4">
              <table className="w-full min-w-[900px] text-[13px] border-collapse whitespace-nowrap">
                <thead className="border-b border-border/40 bg-white text-left text-[11px] font-bold uppercase tracking-wider text-[#007A87]">
                  <tr>
                    <th className="w-14 px-2 py-3 align-middle text-center">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={toggleAll}
                        aria-label="Select all batches"
                        title="Select all"
                        className="mx-auto cursor-pointer"
                      />
                    </th>
                    {isFieldVisible("batchNumber") && (
                      <th className="w-40 px-4 py-3">Batch Number</th>
                    )}
                    {isFieldVisible("medicine") && <th className="w-72 px-4 py-3">Medicine</th>}
                    {isFieldVisible("rack") && (
                      <th className="hidden md:table-cell w-32 px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          Rack / Zone
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                title="Filter by rack / zone"
                                className="grid h-5 w-5 cursor-pointer place-items-center rounded hover:bg-muted/50"
                              >
                                <Tag
                                  className={cn(
                                    "h-2.5 w-2.5",
                                    locFilters.length > 0
                                      ? "text-[#007A87]"
                                      : "text-muted-foreground",
                                  )}
                                  strokeWidth={1.5}
                                />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-52 max-h-64 overflow-y-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {locationOptions.map((loc) => (
                                <BatchCheckboxItem
                                  key={loc}
                                  checked={locFilters.includes(loc)}
                                  onCheckedChange={() => toggleLoc(loc)}
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  {loc}
                                </BatchCheckboxItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => setLocFilters([])}
                                disabled={locFilters.length === 0}
                                className="justify-center text-xs"
                              >
                                All racks
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </th>
                    )}
                    {isFieldVisible("quantity") && (
                      <th className="w-36 px-4 py-3 text-right">Available Qty</th>
                    )}
                    {isFieldVisible("mfg") && (
                      <th className="hidden md:table-cell w-28 px-4 py-3 text-center">Mfg Date</th>
                    )}
                    {isFieldVisible("expiry") && (
                      <th className="w-32 px-4 py-3 text-center">Expiry Date</th>
                    )}
                    {isFieldVisible("status") && (
                      <th className="hidden md:table-cell w-28 px-4 py-3">Status</th>
                    )}
                    <th className="w-14 px-2 py-3 text-center sticky right-0 bg-white border-l border-border/40">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/80">
                  {paginatedData.map((row) => (
                    <tr
                      key={row.batch.id}
                      className="group hover:bg-muted/10 transition-colors duration-200 bg-white border-b border-border/40 last:border-b-0"
                    >
                      <td className="px-2 py-3 text-center align-middle">
                        <Checkbox
                          checked={selected.has(row.batch.id)}
                          onCheckedChange={() => toggleRow(row.batch.id)}
                          aria-label={`Select ${row.batch.batchNumber}`}
                          className="mx-auto cursor-pointer"
                        />
                      </td>
                      {isFieldVisible("batchNumber") && (
                        <td className="whitespace-nowrap max-w-[176px] overflow-hidden px-4 py-3 align-middle font-semibold text-foreground group-hover:text-[#007A87] transition-colors">
                          <BatchChip batchId={row.batch.id} batchNumber={row.batch.batchNumber} />
                        </td>
                      )}
                      {isFieldVisible("medicine") && (
                        <td className="max-w-[320px] overflow-hidden px-4 py-3 align-middle">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#E6F4F1] text-[#007A5A]">
                              <PackageOpen className="h-4 w-4" strokeWidth={1.5} />
                            </span>
                            <div className="min-w-0">
                              <div className="truncate font-medium text-foreground group-hover:text-[#007A87] transition-colors">
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
                        <td className="hidden md:table-cell whitespace-nowrap px-4 py-3 align-middle">
                          <LocationPill locations={row.locations} />
                        </td>
                      )}
                      {isFieldVisible("quantity") && (
                        <td className="whitespace-nowrap px-4 py-3 text-right align-middle font-semibold tabular-nums">
                          {row.totalStock}
                        </td>
                      )}
                      {isFieldVisible("mfg") && (
                        <td className="hidden md:table-cell whitespace-nowrap px-4 py-3 text-center align-middle">
                          <MfgCell mfgDate={row.batch.dates?.manufacturingDate} />
                        </td>
                      )}
                      {isFieldVisible("expiry") && (
                        <td className="whitespace-nowrap px-4 py-3 text-center align-middle">
                          <ExpiryCell expiryDate={row.batch.dates?.expiryDate} />
                        </td>
                      )}
                      {isFieldVisible("status") && (
                        <td className="hidden md:table-cell whitespace-nowrap px-4 py-3 align-middle">
                          <StatusBadge status={row.status} />
                        </td>
                      )}
                      <td className="whitespace-nowrap px-2 py-3 text-center sticky right-0 bg-white border-l border-border/40 align-middle">
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
          )}
        </div>
      </div>

      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 bg-white border-t border-border/40 mt-auto">
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-slate-500 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, rows.length)} of {rows.length} batches
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(val) => {
                setItemsPerPage(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[115px] text-[13px] font-medium bg-white border-border/60">
                <SelectValue placeholder="10 per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage((p) => Math.max(1, p - 1));
              }}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-[13px] font-medium text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:text-slate-900"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, i, arr) => (
                <Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="px-2 text-slate-400">...</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(p);
                    }}
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-bold transition-colors ${
                      currentPage === p
                        ? "bg-[#007A87] text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                </Fragment>
              ))}

            <button
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage((p) => Math.min(totalPages, p + 1));
              }}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-[13px] font-medium text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:text-slate-900"
            >
              Next
            </button>
          </div>
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
