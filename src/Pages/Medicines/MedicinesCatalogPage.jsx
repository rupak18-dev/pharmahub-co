import { Link, useNavigate, useSearchParams } from "react-router";
import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Power, PowerOff, Eye, Filter, FileSpreadsheet } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { usePermission } from "@/hooks/usePermission";
import { logActivity } from "@/lib/stock";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/Components/shared/PageHeader";
import { EmptyState } from "@/Components/shared/EmptyState";
import { StatusBadge } from "@/Components/shared/StatusBadge";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/Components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
export const handle = { title: "Master Catalog · PharmaHub" };
const schema = z.object({
  name: z.string().trim().min(2, "Required").max(120),
  genericName: z.string().trim().max(120).optional().or(z.literal("")),
  brandName: z.string().trim().max(120).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  manufacturerId: z.string().optional().or(z.literal("")),
  hsnCode: z.string().trim().max(20).optional().or(z.literal("")),
  gstRate: z.coerce.number().min(0).max(100),
  storageRequirements: z.string().trim().max(200).optional().or(z.literal("")),
  barcode: z.string().trim().max(64).optional().or(z.literal("")),
  reorderThreshold: z.coerce.number().min(0).max(100000),
  // New enterprise inputs
  saltComposition: z.string().trim().max(200).optional().or(z.literal("")),
  strength: z.string().trim().max(50).optional().or(z.literal("")),
  dosageForm: z.string().trim().max(50).optional().or(z.literal("")),
  packSize: z.string().trim().max(50).optional().or(z.literal("")),
  gtin: z.string().trim().max(50).optional().or(z.literal("")),
  drugSchedule: z.string().trim().max(50).optional().or(z.literal("")),
  dosageInfo: z.string().trim().max(300).optional().or(z.literal("")),
  usageInstructions: z.string().trim().max(500).optional().or(z.literal("")),
  contraindications: z.string().trim().max(500).optional().or(z.literal("")),
  sideEffects: z.string().trim().max(500).optional().or(z.literal("")),
  maxStockLevel: z.coerce.number().min(0).max(100000).optional(),
  ptr: z.coerce.number().min(0).max(100000).optional(),
  rackLocation: z.string().trim().max(50).optional().or(z.literal("")),
  reservedQuantity: z.coerce.number().min(0).max(100000).optional(),
});
export default function MedicinesCatalogPage() {
  const [urlSearchParams] = useSearchParams();
  const searchParams = {
    q: urlSearchParams.get("q") ?? "",
    addNew: urlSearchParams.get("addNew") ?? "",
    focusSearch: urlSearchParams.get("focusSearch") ?? "",
    filter: urlSearchParams.get("filter") ?? "",
  };
  const medicines = useDb((d) => d.medicines);
  const categories = useDb((d) => d.categories);
  const manufacturers = useDb((d) => d.manufacturers);
  const batches = useDb((d) => d.batches);
  const suppliers = useDb((d) => d.suppliers);
  const has = usePermission();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState(searchParams.q || "");
  useEffect(() => {
    setQ(searchParams.q || "");
  }, [searchParams.q]);
  const handleSearchChange = (val) => {
    setQ(val);
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) sp.set(k, v);
    }
    if (val) sp.set("q", val);
    else sp.delete("q");
    navigate(`/medicines/catalog${sp.toString() ? `?${sp.toString()}` : ""}`);
  };
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [catFilter, setCatFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [genericFilter, setGenericFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [rackFilter, setRackFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [expiryStatusFilter, setExpiryStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  // Trigger Sheet open if query param dictates it
  useEffect(() => {
    if (searchParams.addNew === "true") {
      setEditing(null);
      setSheetOpen(true);
      // clear query params so it doesn't open on reload
      navigate("/medicines/catalog");
    }
  }, [searchParams.addNew]);
  // Handle focus search param
  useEffect(() => {
    if (searchParams.focusSearch === "true") {
      const el = document.getElementById("catalog-search-input");
      if (el) el.focus();
    }
  }, [searchParams.focusSearch]);
  // Apply quick filters from sidebar (e.g. ?filter=generic)
  useEffect(() => {
    if (searchParams.filter) {
      if (searchParams.filter === "generic") {
        setGenericFilter("only");
        setBrandFilter("all");
      } else if (searchParams.filter === "branded") {
        setBrandFilter("only");
        setGenericFilter("all");
      } else if (searchParams.filter === "otc") {
        setCatFilter("vitamins"); // Simulate OTC filter
      }
    } else {
      setGenericFilter("all");
      setBrandFilter("all");
      setCatFilter("all");
    }
  }, [searchParams.filter]);
  // Computed lists for dropdown filters
  const uniqueBrands = useMemo(() => {
    const brands = new Set(medicines.map((m) => m.brandName).filter(Boolean));
    return Array.from(brands);
  }, [medicines]);
  const uniqueGenerics = useMemo(() => {
    const generics = new Set(medicines.map((m) => m.genericName).filter(Boolean));
    return Array.from(generics);
  }, [medicines]);
  const uniqueRacks = useMemo(() => {
    const racks = new Set(medicines.map((m) => m.rackLocation).filter(Boolean));
    return Array.from(racks);
  }, [medicines]);
  // Map inventory details
  const stockByMed = useMemo(() => {
    const m = new Map();
    // Seed default based on medicines
    medicines.forEach((med) => {
      m.set(med.id, {
        current: 0,
        min: med.reorderThreshold,
        expired: false,
        nearExp: false,
        mrp: 0,
        ptr: med.ptr || 0,
        pur: 0,
        sell: 0,
        batchNo: "—",
        expiry: "—",
        supplier: "—",
      });
    });
    // Populate from actual batches
    batches.forEach((b) => {
      const prev = m.get(b.medicineId);
      if (prev) {
        const expTime = new Date(b.expiryDate).getTime();
        const nearMs = 90 * 24 * 60 * 60 * 1000;
        const isExpired = expTime < Date.now();
        const isNear = !isExpired && expTime - Date.now() <= nearMs;
        const supplierName = suppliers.find((s) => s.id === b.supplierId)?.name || "—";
        m.set(b.medicineId, {
          current: prev.current + b.currentStock,
          min: prev.min,
          expired: prev.expired || isExpired,
          nearExp: prev.nearExp || isNear,
          mrp: b.mrp,
          ptr: prev.ptr,
          pur: b.purchasePrice,
          sell: b.sellingPrice,
          batchNo: b.batchNumber,
          expiry: b.expiryDate,
          supplier: supplierName,
        });
      }
    });
    return m;
  }, [batches, medicines, suppliers]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return medicines.filter((m) => {
      // Basic Active filter
      if (activeFilter === "active" && !m.isActive) return false;
      if (activeFilter === "inactive" && m.isActive) return false;
      // Dropdown filters
      if (catFilter !== "all") {
        if (catFilter === "vitamins") {
          const vitCat = categories.find((c) => c.name.toLowerCase().includes("vitamin"));
          if (m.categoryId !== vitCat?.id) return false;
        } else if (m.categoryId !== catFilter) {
          return false;
        }
      }
      if (brandFilter !== "all") {
        if (brandFilter === "only" && !m.brandName) return false;
        if (brandFilter !== "only" && m.brandName !== brandFilter) return false;
      }
      if (genericFilter !== "all") {
        if (genericFilter === "only" && !m.genericName) return false;
        if (genericFilter !== "only" && m.genericName !== genericFilter) return false;
      }
      if (rackFilter !== "all" && m.rackLocation !== rackFilter) return false;
      const meta = stockByMed.get(m.id);
      if (supplierFilter !== "all" && meta?.supplier !== supplierFilter) return false;
      // Stock status filter
      if (stockStatusFilter !== "all") {
        if (stockStatusFilter === "out" && (meta?.current || 0) > 0) return false;
        if (
          stockStatusFilter === "low" &&
          ((meta?.current || 0) > (meta?.min || 0) || (meta?.current || 0) === 0)
        )
          return false;
        if (stockStatusFilter === "over" && (meta?.current || 0) <= (m.maxStockLevel || 1000))
          return false;
      }
      // Expiry status filter
      if (expiryStatusFilter !== "all") {
        if (expiryStatusFilter === "expired" && !meta?.expired) return false;
        if (expiryStatusFilter === "near" && !meta?.nearExp) return false;
      }
      // Search matches name, generic name, brand name, composition, barcode, GTIN
      if (!s) return true;
      return (
        m.name.toLowerCase().includes(s) ||
        (m.genericName ?? "").toLowerCase().includes(s) ||
        (m.brandName ?? "").toLowerCase().includes(s) ||
        (m.saltComposition ?? "").toLowerCase().includes(s) ||
        (m.barcode ?? "").toLowerCase().includes(s) ||
        (m.gtin ?? "").toLowerCase().includes(s)
      );
    });
  }, [
    medicines,
    q,
    catFilter,
    brandFilter,
    genericFilter,
    rackFilter,
    supplierFilter,
    stockStatusFilter,
    expiryStatusFilter,
    activeFilter,
    stockByMed,
  ]);
  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (m) => {
    setEditing(m);
    setSheetOpen(true);
  };
  const submit = (values) => {
    if (editing) {
      db.set((d) => {
        const m = d.medicines.find((x) => x.id === editing.id);
        if (!m) return;
        Object.assign(m, {
          ...values,
          genericName: values.genericName || undefined,
          brandName: values.brandName || undefined,
          categoryId: values.categoryId || undefined,
          manufacturerId: values.manufacturerId || undefined,
          hsnCode: values.hsnCode || undefined,
          storageRequirements: values.storageRequirements || undefined,
          barcode: values.barcode || undefined,
          saltComposition: values.saltComposition || undefined,
          strength: values.strength || undefined,
          dosageForm: values.dosageForm || undefined,
          packSize: values.packSize || undefined,
          gtin: values.gtin || undefined,
          drugSchedule: values.drugSchedule || undefined,
          dosageInfo: values.dosageInfo || undefined,
          usageInstructions: values.usageInstructions || undefined,
          contraindications: values.contraindications || undefined,
          sideEffects: values.sideEffects || undefined,
          rackLocation: values.rackLocation || undefined,
        });
      });
      if (user)
        logActivity({
          userId: user.id,
          userName: user.name,
          action: `Updated medicine ${values.name} details`,
          entityType: "medicine",
          entityId: editing.id,
        });
      toast.success("Medicine details updated");
    } else {
      const id = db.uid();
      const now = new Date().toISOString();
      db.set((d) => {
        d.medicines.push({
          id,
          isActive: true,
          createdAt: now,
          ...values,
          genericName: values.genericName || undefined,
          brandName: values.brandName || undefined,
          categoryId: values.categoryId || undefined,
          manufacturerId: values.manufacturerId || undefined,
          hsnCode: values.hsnCode || undefined,
          storageRequirements: values.storageRequirements || undefined,
          barcode: values.barcode || `PH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          saltComposition: values.saltComposition || undefined,
          strength: values.strength || undefined,
          dosageForm: values.dosageForm || undefined,
          packSize: values.packSize || undefined,
          gtin: values.gtin || undefined,
          drugSchedule: values.drugSchedule || undefined,
          dosageInfo: values.dosageInfo || undefined,
          usageInstructions: values.usageInstructions || undefined,
          contraindications: values.contraindications || undefined,
          sideEffects: values.sideEffects || undefined,
          rackLocation: values.rackLocation || undefined,
        });
      });
      if (user)
        logActivity({
          userId: user.id,
          userName: user.name,
          action: `Added new medicine ${values.name} to catalog`,
          entityType: "medicine",
          entityId: id,
        });
      toast.success("Medicine added to catalog");
    }
    setSheetOpen(false);
  };
  const toggleActive = (m) => {
    db.set((d) => {
      const t = d.medicines.find((x) => x.id === m.id);
      if (t) t.isActive = !t.isActive;
    });
    if (user)
      logActivity({
        userId: user.id,
        userName: user.name,
        action: `${m.isActive ? "Deactivated" : "Activated"} medicine ${m.name}`,
        entityType: "medicine",
        entityId: m.id,
      });
    toast.success(`Medicine ${m.isActive ? "deactivated" : "activated"}`);
    setConfirmDeactivate(null);
  };
  const currency = useDb((d) => d.settings.currency);
  return (
    <div className="space-y-6 pb-12 bg-white h-full p-6 rounded-2xl shadow-sm border border-border/40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/65 pb-5">
        <PageHeader
          title="Medicine Master Catalog"
          description="Enterprise inventory catalog containing composition details, layout tracks, barcodes, and live pricing metrics."
        />
        <div className="flex items-center gap-2">
          {has("medicines", "create") && (
            <Button
              size="sm"
              onClick={openCreate}
              className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg gap-1"
            >
              <Plus className="h-4 w-4" /> Add medicine
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg gap-1"
            onClick={() => toast.info("Exporting Excel report...")}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Sheet
          </Button>
        </div>
      </div>

      {/* FILTERS PANEL */}
      <div className="bg-muted/20 border border-border/60 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Workspace Filters
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="md:hidden text-xs font-semibold text-[#2563EB] border border-[#2563EB]/20 rounded-md px-2 py-1 hover:bg-[#2563EB]/5"
            >
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={() => {
                setCatFilter("all");
                setBrandFilter("all");
                setGenericFilter("all");
                setSupplierFilter("all");
                setRackFilter("all");
                setStockStatusFilter("all");
                setExpiryStatusFilter("all");
                setActiveFilter("all");
                setQ("");
              }}
              className="text-xs text-[#2563EB] hover:underline px-1"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Global search input (always visible) */}
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="catalog-search-input"
            className="pl-9 bg-white"
            placeholder="Search Name, Generic, Salt, Barcode..."
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Dropdown Filters (collapsible on mobile) */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 ${showMobileFilters ? "grid" : "hidden md:grid"}`}
        >
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="only">Only Branded</SelectItem>
              {uniqueBrands.map((b, idx) => (
                <SelectItem key={idx} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={genericFilter} onValueChange={setGenericFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Generic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Generics</SelectItem>
              <SelectItem value="only">Only Generic</SelectItem>
              {uniqueGenerics.map((g, idx) => (
                <SelectItem key={idx} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={rackFilter} onValueChange={setRackFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Rack Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Racks</SelectItem>
              {uniqueRacks.map((r, idx) => (
                <SelectItem key={idx} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock Statuses</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="over">Overstock Alert</SelectItem>
            </SelectContent>
          </Select>

          <Select value={expiryStatusFilter} onValueChange={setExpiryStatusFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Expiry Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expiries</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="near">Near Expiry</SelectItem>
            </SelectContent>
          </Select>

          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Catalog Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Catalog Statuses</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No medicines matched filters"
          description="Refine your criteria or add a new medicine configuration to the master catalog."
          action={
            has("medicines", "create") && (
              <Button onClick={openCreate} className="bg-[#2563EB] hover:bg-blue-700">
                <Plus className="mr-1 h-4 w-4" /> Add medicine
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto border border-border/80 rounded-2xl shadow-sm bg-white">
            <table className="w-full text-[13px] border-collapse min-w-[2000px]">
              <thead className="border-b border-border/80 bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Medicine Info</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Generic Name</th>
                  <th className="px-4 py-3">Salt / Composition</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Strength</th>
                  <th className="px-4 py-3">Form</th>
                  <th className="px-4 py-3">Pack Size</th>
                  <th className="px-4 py-3">GTIN / Barcode</th>
                  <th className="px-4 py-3">Active Batch</th>
                  <th className="px-4 py-3 text-right">MRP</th>
                  <th className="px-4 py-3 text-right">PTR</th>
                  <th className="px-4 py-3 text-right">Purchase Price</th>
                  <th className="px-4 py-3 text-right">Selling Price</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3 text-right">Min Stock</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Rack</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3 text-center sticky right-0 bg-white shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.05)] border-l border-border/80">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {filtered.map((m) => {
                  const meta = stockByMed.get(m.id);
                  const stockTone =
                    (meta?.current || 0) === 0
                      ? "out"
                      : (meta?.current || 0) <= (meta?.min || 0)
                        ? "low"
                        : "healthy";
                  return (
                    <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                      {/* Medicine Info */}
                      <td className="px-4 py-3 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-muted/60 flex items-center justify-center text-[10px] text-muted-foreground shrink-0 border border-border/40">
                            {m.dosageForm?.charAt(0) || "💊"}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/medicines/${m.id}`}
                              className="hover:underline hover:text-[#2563EB] truncate block"
                            >
                              {m.name}
                            </Link>
                            <span className="text-[10px] font-mono text-muted-foreground block">
                              {m.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="px-4 py-3 text-muted-foreground">{m.brandName || "—"}</td>

                      {/* Generic */}
                      <td className="px-4 py-3 text-muted-foreground">{m.genericName || "—"}</td>

                      {/* Salt */}
                      <td
                        className="px-4 py-3 text-muted-foreground max-w-[200px] truncate"
                        title={m.saltComposition}
                      >
                        {m.saltComposition || "—"}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {categories.find((c) => c.id === m.categoryId)?.name ?? "—"}
                      </td>

                      {/* Strength */}
                      <td className="px-4 py-3 text-muted-foreground">{m.strength || "—"}</td>

                      {/* Form */}
                      <td className="px-4 py-3 text-muted-foreground">{m.dosageForm || "—"}</td>

                      {/* Pack */}
                      <td className="px-4 py-3 text-muted-foreground">{m.packSize || "—"}</td>

                      {/* GTIN / Barcode */}
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        <div>G: {m.gtin || "—"}</div>
                        <div>B: {m.barcode || "—"}</div>
                      </td>

                      {/* Active Batch */}
                      <td className="px-4 py-3 font-mono text-xs">{meta?.batchNo || "—"}</td>

                      {/* MRP */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                        {currency}
                        {meta?.mrp?.toFixed(2) || "0.00"}
                      </td>

                      {/* PTR */}
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {currency}
                        {m.ptr?.toFixed(2) || "0.00"}
                      </td>

                      {/* Purchase */}
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {currency}
                        {meta?.pur?.toFixed(2) || "0.00"}
                      </td>

                      {/* Selling */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">
                        {currency}
                        {meta?.sell?.toFixed(2) || "0.00"}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                        {meta?.current} units
                      </td>

                      {/* Min Stock */}
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {m.reorderThreshold} units
                      </td>

                      {/* Expiry */}
                      <td className="px-4 py-3">
                        <span
                          className={
                            meta?.expired
                              ? "text-destructive font-bold"
                              : meta?.nearExp
                                ? "text-amber-500 font-semibold"
                                : "text-muted-foreground"
                          }
                        >
                          {meta?.expiry !== "—"
                            ? new Date(meta?.expiry || "").toLocaleDateString(undefined, {
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </td>

                      {/* Rack */}
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {m.rackLocation || "—"}
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">
                        {meta?.supplier || "—"}
                      </td>

                      {/* Availability */}
                      <td className="px-4 py-3">
                        {m.isActive ? (
                          <StatusBadge status={stockTone} />
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-800 px-2 py-0.5 text-xs font-semibold">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center sticky right-0 bg-white shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.05)] border-l border-border/80">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#2563EB]"
                            title="View details"
                          >
                            <Link to={`/medicines/${m.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {has("medicines", "update") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-[#2563EB]"
                              onClick={() => openEdit(m)}
                              title="Edit Configuration"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {has("medicines", "delete") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10"
                              onClick={() => setConfirmDeactivate(m)}
                              title={m.isActive ? "Deactivate" : "Activate"}
                            >
                              {m.isActive ? (
                                <PowerOff className="h-4 w-4 text-destructive" />
                              ) : (
                                <Power className="h-4 w-4 text-emerald-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile responsive card list view */}
          <div className="md:hidden space-y-4">
            {filtered.map((m) => {
              const meta = stockByMed.get(m.id);
              const stockTone =
                (meta?.current || 0) === 0
                  ? "out"
                  : (meta?.current || 0) <= (meta?.min || 0)
                    ? "low"
                    : "healthy";
              return (
                <div
                  key={m.id}
                  className="bg-white border border-border/80 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded bg-muted/60 flex items-center justify-center text-sm border shrink-0">
                        {m.dosageForm?.charAt(0) || "💊"}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/medicines/${m.id}`}
                          className="font-bold text-foreground hover:underline text-sm truncate block"
                        >
                          {m.name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {m.genericName || "Generic"}
                        </span>
                      </div>
                    </div>
                    {m.isActive ? (
                      <StatusBadge status={stockTone} />
                    ) : (
                      <span className="rounded-full bg-gray-100 text-gray-800 px-2 py-0.5 text-[10px] font-semibold">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-b py-2 my-2">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Stock Level</span>
                      <span className="font-semibold text-foreground font-mono">
                        {meta?.current} units
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Rack Location</span>
                      <span className="font-semibold text-foreground font-mono">
                        {m.rackLocation || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Selling Price</span>
                      <span className="font-semibold text-emerald-600 font-mono">
                        {currency}
                        {meta?.sell?.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Expiry</span>
                      <span
                        className={`font-semibold font-mono ${meta?.expired ? "text-destructive" : meta?.nearExp ? "text-amber-500" : "text-muted-foreground"}`}
                      >
                        {meta?.expiry !== "—"
                          ? new Date(meta?.expiry || "").toLocaleDateString(undefined, {
                              month: "short",
                              year: "2-digit",
                            })
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs gap-1 rounded-lg h-9"
                    >
                      <Link to={`/medicines/${m.id}`}>
                        <Eye className="h-3.5 w-3.5" /> View Specs
                      </Link>
                    </Button>
                    {has("medicines", "update") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(m)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {has("medicines", "delete") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDeactivate(m)}
                      >
                        {m.isActive ? (
                          <PowerOff className="h-3.5 w-3.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* RENDER SHEET DRAWER FORM */}
      <MedicineFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        onSubmit={submit}
      />

      {/* CONFIRMATION POPUP */}
      <AlertDialog
        open={!!confirmDeactivate}
        onOpenChange={(o) => !o && setConfirmDeactivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDeactivate?.isActive ? "Deactivate" : "Activate"} master config?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeactivate?.isActive
                ? "This medicine will be hidden from sales forms and stock reports. Active batches will remain registered but unavailable."
                : "Re-activating this medicine makes it selectable in billing forms immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#2563EB] hover:bg-blue-700"
              onClick={() => confirmDeactivate && toggleActive(confirmDeactivate)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
// FORM SHEETS DEFINITION
function MedicineFormSheet({ open, onOpenChange, editing, onSubmit }) {
  const categories = useDb((d) => d.categories);
  const manufacturers = useDb((d) => d.manufacturers);
  const settings = useDb((d) => d.settings);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    values: editing
      ? {
          name: editing.name,
          genericName: editing.genericName ?? "",
          brandName: editing.brandName ?? "",
          categoryId: editing.categoryId ?? "",
          manufacturerId: editing.manufacturerId ?? "",
          hsnCode: editing.hsnCode ?? "",
          gstRate: editing.gstRate,
          storageRequirements: editing.storageRequirements ?? "",
          barcode: editing.barcode ?? "",
          reorderThreshold: editing.reorderThreshold,
          saltComposition: editing.saltComposition ?? "",
          strength: editing.strength ?? "",
          dosageForm: editing.dosageForm ?? "",
          packSize: editing.packSize ?? "",
          gtin: editing.gtin ?? "",
          drugSchedule: editing.drugSchedule ?? "",
          dosageInfo: editing.dosageInfo ?? "",
          usageInstructions: editing.usageInstructions ?? "",
          contraindications: editing.contraindications ?? "",
          sideEffects: editing.sideEffects ?? "",
          maxStockLevel: editing.maxStockLevel || 1000,
          ptr: editing.ptr || 0,
          rackLocation: editing.rackLocation ?? "",
        }
      : {
          name: "",
          genericName: "",
          brandName: "",
          categoryId: "",
          manufacturerId: "",
          hsnCode: "",
          gstRate: settings.gstDefault,
          storageRequirements: "",
          barcode: "",
          reorderThreshold: settings.lowStockDefault,
          saltComposition: "",
          strength: "",
          dosageForm: "",
          packSize: "",
          gtin: "",
          drugSchedule: "",
          dosageInfo: "",
          usageInstructions: "",
          contraindications: "",
          sideEffects: "",
          maxStockLevel: 1000,
          ptr: 0,
          rackLocation: "",
        },
  });
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col h-full bg-white">
        <SheetHeader className="border-b border-border/60 pb-3">
          <SheetTitle className="text-lg font-bold text-foreground">
            {editing ? "Modify Medicine Master Config" : "Add Medicine Config to Catalog"}
          </SheetTitle>
          <SheetDescription>
            Input detailed composition data, drug schedules, and layout placement values.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit((v) => {
            onSubmit(v);
            reset();
          })}
          className="flex-1 overflow-y-auto space-y-5 py-4 pr-1"
        >
          {/* GENERAL INFO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1">
              General Details
            </h4>
            <div className="space-y-2">
              <Label htmlFor="name">Medicine Trade Name *</Label>
              <Input id="name" {...register("name")} placeholder="e.g. Crocin 500mg" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand name</Label>
                <Input id="brandName" {...register("brandName")} placeholder="e.g. Crocin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genericName">Generic / Salt Name</Label>
                <Input
                  id="genericName"
                  {...register("genericName")}
                  placeholder="e.g. Paracetamol"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saltComposition">Full Salt Composition Details</Label>
              <Input
                id="saltComposition"
                {...register("saltComposition")}
                placeholder="e.g. Paracetamol IP 500mg + Caffeine 30mg"
              />
            </div>
          </div>

          {/* CLINICAL DATA */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1">
              Clinical Settings
            </h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="strength">Strength</Label>
                <Input id="strength" {...register("strength")} placeholder="e.g. 500 mg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosageForm">Dosage Form</Label>
                <Input
                  id="dosageForm"
                  {...register("dosageForm")}
                  placeholder="e.g. Tablet, Syrup"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packSize">Pack Size</Label>
                <Input id="packSize" {...register("packSize")} placeholder="e.g. 10 Tablets" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={watch("categoryId") || ""}
                  onValueChange={(v) => setValue("categoryId", v)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Drug Schedule</Label>
                <Select
                  value={watch("drugSchedule") || ""}
                  onValueChange={(v) => setValue("drugSchedule", v)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select Schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OTC">OTC / General</SelectItem>
                    <SelectItem value="Schedule H">Schedule H (Rx Only)</SelectItem>
                    <SelectItem value="Schedule H1">Schedule H1 (Controlled)</SelectItem>
                    <SelectItem value="Schedule X">Schedule X (Narcotics)</SelectItem>
                    <SelectItem value="Schedule G">Schedule G</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* INVENTORY & WAREHOUSE */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1">
              Stock Rules & Storage
            </h4>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2 col-span-2">
                <Label>Manufacturer</Label>
                <Select
                  value={watch("manufacturerId") || ""}
                  onValueChange={(v) => setValue("manufacturerId", v)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ptr">PTR ({settings.currency})</Label>
                <Input id="ptr" type="number" step="0.01" {...register("ptr")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rackLocation">Rack Location</Label>
                <Input id="rackLocation" {...register("rackLocation")} placeholder="e.g. A-12" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="hsnCode">HSN Code</Label>
                <Input id="hsnCode" {...register("hsnCode")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstRate">GST %</Label>
                <Input id="gstRate" type="number" step="0.5" {...register("gstRate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderThreshold">Reorder Min</Label>
                <Input id="reorderThreshold" type="number" {...register("reorderThreshold")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStockLevel">Max Stock</Label>
                <Input id="maxStockLevel" type="number" {...register("maxStockLevel")} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gtin">GTIN (Global Trade Number)</Label>
                <Input id="gtin" {...register("gtin")} placeholder="e.g. 08901234567890" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode / SKU</Label>
                <Input
                  id="barcode"
                  placeholder="Leave empty for auto-generate"
                  {...register("barcode")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storageRequirements">Storage requirements</Label>
              <Textarea
                id="storageRequirements"
                rows={2}
                placeholder="e.g. Store below 25°C, protect from direct sunlight"
                {...register("storageRequirements")}
              />
            </div>
          </div>

          {/* PATIENT MONOGRAPHS */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1">
              Safety & Drug Monographs
            </h4>
            <div className="space-y-2">
              <Label htmlFor="dosageInfo">Standard Dosage Information</Label>
              <Textarea
                id="dosageInfo"
                rows={2}
                placeholder="Standard adult and pediatric dosages..."
                {...register("dosageInfo")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usageInstructions">Usage Instructions</Label>
              <Textarea
                id="usageInstructions"
                rows={2}
                placeholder="Directions for taking the drug safely..."
                {...register("usageInstructions")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contraindications">Contraindications</Label>
              <Textarea
                id="contraindications"
                rows={2}
                placeholder="When NOT to take this medicine..."
                {...register("contraindications")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sideEffects">Side Effects</Label>
              <Textarea
                id="sideEffects"
                rows={2}
                placeholder="Common or severe reactions..."
                {...register("sideEffects")}
              />
            </div>
          </div>

          <SheetFooter className="mt-4 border-t border-border/60 pt-4 flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg"
            >
              {editing ? "Save Changes" : "Register Medicine"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
