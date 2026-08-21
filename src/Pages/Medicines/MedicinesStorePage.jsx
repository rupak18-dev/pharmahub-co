import { Link, useNavigate, useSearchParams } from "react-router";
import { useState, useMemo, useEffect, Fragment } from "react";
import {
  Plus,
  Search,
  Pencil,
  Power,
  PowerOff,
  Eye,
  Filter,
  ChevronsUpDown,
  FileSpreadsheet,
  Download,
  LayoutGrid,
  List,
  Heart,
  ShieldCheck,
  Tag,
  Hourglass,
  Activity,
  ArrowDownUp,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { useWishlist } from "@/hooks/useWishlist";
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
import { getImageForMedicine } from "@/lib/utils";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/Components/ui/pagination";
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
    tab: urlSearchParams.get("tab") ?? "",
  };
  const medicines = useDb((d) => d.medicines);
  const categories = useDb((d) => d.categories);
  const manufacturers = useDb((d) => d.manufacturers);
  const batches = useDb((d) => d.batches);
  const suppliers = useDb((d) => d.suppliers);
  const has = usePermission();
  const settings = useDb((d) => d.settings);
  const currency = settings.currency;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { wishlist, toggleWishlist } = useWishlist();
  const navigateMedicines = (patch) => {
    const sp = new URLSearchParams();
    const merged = { ...searchParams, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v);
    }
    navigate(`/medicines${sp.toString() ? `?${sp.toString()}` : ""}`);
  };
  const [q, setQ] = useState(searchParams.q || "");
  const [showWishlist, setShowWishlist] = useState(false);
  useEffect(() => {
    setQ(searchParams.q || "");
  }, [searchParams.q]);
  const handleSearchChange = (val) => {
    setQ(val);
    navigateMedicines({ q: val || undefined });
  };
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [catFilter, setCatFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [genericFilter, setGenericFilter] = useState("all");
  useEffect(() => {
    if (searchParams.filter === "generic") {
      setGenericFilter("only");
      setBrandFilter("all");
      setCatFilter("all");
    } else if (searchParams.filter === "branded") {
      setBrandFilter("only");
      setGenericFilter("all");
      setCatFilter("all");
    } else if (searchParams.filter === "otc") {
      const otcCat = categories.find(
        (c) => c.name.toLowerCase().includes("otc") || c.name.toLowerCase().includes("fmcg"),
      );
      if (otcCat) {
        setCatFilter(otcCat.id);
        setBrandFilter("all");
        setGenericFilter("all");
      }
    }
  }, [searchParams.filter, categories]);
  useEffect(() => {
    if (searchParams.addNew === "true") {
      setEditing(null);
      setSheetOpen(true);
      navigateMedicines({ addNew: undefined });
    }
  }, [searchParams.addNew, navigate]);
  useEffect(() => {
    if (searchParams.focusSearch === "true") {
      const input = document.getElementById("catalog-search-input");
      if (input) {
        input.focus();
      }
      navigateMedicines({ focusSearch: undefined });
    }
  }, [searchParams.focusSearch, navigate]);
  const [therapeuticFilter, setTherapeuticFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [visibleFields, setVisibleFields] = useState([]);
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const CUSTOMIZABLE_FILTERS = [
    { id: "brand", label: "Brand" },
    { id: "genericName", label: "Generic Name" },
    { id: "saltComposition", label: "Salt / Composition" },
    { id: "category", label: "Category" },
    { id: "strength", label: "Strength" },
    { id: "form", label: "Form" },
    { id: "packSize", label: "Pack Size" },
    { id: "barcode", label: "GTIN / Barcode" },
    { id: "batch", label: "Active Batch" },
    { id: "mrp", label: "MRP" },
    { id: "ptr", label: "PTR" },
    { id: "purchasePrice", label: "Purchase Price" },
    { id: "sellingPrice", label: "Selling Price" },
    { id: "currentStock", label: "Current Stock" },
    { id: "minStock", label: "Min Stock" },
    { id: "expiryDate", label: "Expiry Date" },
    { id: "rack", label: "Rack" },
    { id: "supplier", label: "Supplier" },
    { id: "availability", label: "Availability" },
  ];
  const isFieldVisible = (id) => visibleFields.length === 0 || visibleFields.includes(id);
  const toggleField = (id) => {
    setVisibleFields((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };
  const [editing, setEditing] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Computed lists for dropdown filters
  const uniqueBrands = useMemo(() => {
    const brands = new Set(medicines.map((m) => m.brandName).filter(Boolean));
    return Array.from(brands);
  }, [medicines]);
  const uniqueSalts = useMemo(() => {
    const salts = new Set(medicines.map((m) => m.saltComposition).filter(Boolean));
    return Array.from(salts);
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
    const result = medicines.filter((m) => {
      if (showWishlist && !wishlist.includes(m.id)) return false;
      if (catFilter !== "all" && m.categoryId !== catFilter) {
        return false;
      }
      if (brandFilter === "only" && !m.brandName) return false;
      if (brandFilter !== "all" && brandFilter !== "only" && m.brandName !== brandFilter)
        return false;
      if (genericFilter === "only" && !m.genericName) return false;
      if (genericFilter !== "all" && genericFilter !== "only" && m.genericName !== genericFilter)
        return false;
      if (therapeuticFilter !== "all") {
        const catName = categories.find((c) => c.id === m.categoryId)?.name.toLowerCase() || "";
        if (
          therapeuticFilter === "pain" &&
          !catName.includes("pain") &&
          !catName.includes("relief")
        )
          return false;
        if (therapeuticFilter === "antibiotic" && !catName.includes("antibiotic")) return false;
        if (therapeuticFilter === "allergy" && !catName.includes("allergy")) return false;
        if (therapeuticFilter === "gastric" && !catName.includes("gastric")) return false;
        if (therapeuticFilter === "cough" && !catName.includes("cough")) return false;
      }
      const meta = stockByMed.get(m.id);
      const stockLevel = meta?.current || 0;
      const minLevel = meta?.min || 0;
      if (dateRangeFilter !== "all") {
        const date = new Date(m.createdAt);
        const now = new Date();
        if (dateRangeFilter === "today") {
          if (date.toDateString() !== now.toDateString()) return false;
        } else if (dateRangeFilter === "7days") {
          if (now.getTime() - date.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (dateRangeFilter === "30days") {
          if (now.getTime() - date.getTime() > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }
      if (statusFilter !== "all") {
        const isDraft =
          m.status === "draft" ||
          (!m.genericName && !m.brandName && !m.categoryId && !m.manufacturerId);
        if (statusFilter === "active" && (!m.isActive || stockLevel <= minLevel || isDraft))
          return false;
        if (statusFilter === "low" && (stockLevel > minLevel || stockLevel === 0 || isDraft))
          return false;
        if (statusFilter === "out" && (stockLevel > 0 || isDraft)) return false;
        if (statusFilter === "draft" && !isDraft) return false;
      }
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
    const sorted = [...result];
    if (sortBy === "newest") {
      // Backend already returns newest first, or we can explicitly sort by createdAt
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "name-asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "stock-asc") {
      sorted.sort(
        (a, b) => (stockByMed.get(a.id)?.current || 0) - (stockByMed.get(b.id)?.current || 0),
      );
    } else if (sortBy === "stock-desc") {
      sorted.sort(
        (a, b) => (stockByMed.get(b.id)?.current || 0) - (stockByMed.get(a.id)?.current || 0),
      );
    } else if (sortBy === "price-asc") {
      sorted.sort((a, b) => (stockByMed.get(a.id)?.mrp || 0) - (stockByMed.get(b.id)?.mrp || 0));
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => (stockByMed.get(b.id)?.mrp || 0) - (stockByMed.get(a.id)?.mrp || 0));
    }
    return sorted;
  }, [
    medicines,
    q,
    catFilter,
    brandFilter,
    genericFilter,
    therapeuticFilter,
    statusFilter,
    dateRangeFilter,
    sortBy,
    stockByMed,
    categories,
    showWishlist,
    wishlist,
  ]);
  useEffect(() => {
    setCurrentPage(1);
  }, [
    q,
    catFilter,
    brandFilter,
    genericFilter,
    therapeuticFilter,
    statusFilter,
    dateRangeFilter,
    sortBy,
    showWishlist,
  ]);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage]);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const handleExport = async (format) => {
    const columnsToExport = CUSTOMIZABLE_FILTERS.filter((f) => isFieldVisible(f.id));
    const headerRow = columnsToExport.map((c) => c.label);
    const rows = filtered.map((m) => {
      const meta = stockByMed.get(m.id);
      return columnsToExport.map((col) => {
        switch (col.id) {
          case "id":
            return m.id;
          case "name":
            return m.name;
          case "brand":
            return m.brandName || "—";
          case "generic":
            return m.genericName || "—";
          case "category":
            return categories.find((c) => c.id === m.categoryId)?.name || "—";
          case "type":
            return m.drugSchedule || "—";
          case "status":
            return m.isActive ? "Active" : "Inactive";
          case "dosage":
            return m.dosageForm || "—";
          case "strength":
            return m.strength || "—";
          case "manufacturer":
            return manufacturers.find((man) => man.id === m.manufacturerId)?.name || "—";
          case "packSize":
            return m.packSize || "—";
          case "barcode":
            return m.barcode || "—";
          case "batch":
            return meta?.batchNo || "—";
          case "mrp":
            return `${currency}${meta?.mrp || 0}`;
          case "ptr":
            return `${currency}${meta?.ptr || 0}`;
          case "purchasePrice":
            return `${currency}${meta?.pur || 0}`;
          case "sellingPrice":
            return `${currency}${meta?.sell || 0}`;
          case "currentStock":
            return (meta?.current || 0).toString();
          case "minStock":
            return (meta?.min || 0).toString();
          case "expiryDate":
            return meta?.expiry || "—";
          case "rack":
            return m.rackLocation || "—";
          case "supplier":
            return meta?.supplier || "—";
          case "availability":
            return (meta?.current || 0) > 0 ? "In Stock" : "Out of Stock";
          default:
            return "—";
        }
      });
    });
    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `PharmaHub_Medicines_${dateStr}`;
    if (format === "csv") {
      const csvContent = [
        headerRow.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported to CSV successfully!");
    } else {
      try {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        const doc = new jsPDF("landscape");
        doc.setFontSize(16);
        doc.text("PharmaHub - Medicines Catalog", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
        autoTable(doc, {
          head: [headerRow],
          body: rows,
          startY: 25,
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [0, 122, 135] },
        });
        doc.save(`${fileName}.pdf`);
        toast.success("Exported to PDF successfully!");
      } catch (err) {
        console.error("PDF generation failed:", err);
        toast.error("Failed to generate PDF. Please ensure jspdf is installed.");
      }
    }
    setIsExportModalOpen(false);
  };
  useEffect(() => {
    if (searchParams.tab && filtered.length > 0) {
      const firstMed = filtered[0];
      navigate(`/medicines/${firstMed.id}`);
    }
  }, [searchParams.tab, filtered, navigate]);
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
  const deleteMedicine = (m) => {
    db.set((d) => {
      d.medicines = d.medicines.filter((x) => x.id !== m.id);
    });
    if (user)
      logActivity({
        userId: user.id,
        userName: user.name,
        action: `Deleted medicine ${m.name}`,
        entityType: "medicine",
        entityId: m.id,
      });
    toast.success(`Medicine ${m.name} deleted`);
    setConfirmDelete(null);
  };
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Title section outside white container */}
      <div className="flex justify-between items-center px-1">
        <h1 className="text-2xl font-bold text-[#007A87]">
          {showWishlist ? "Your Wishlist" : "Medicines"}
        </h1>
        {showWishlist && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg gap-1 flex items-center shrink-0"
            onClick={() => setShowWishlist(false)}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
      </div>

      {/* Main white container */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-border/40 flex flex-col flex-1 overflow-hidden">
        {/* Top Controls Bar */}
        {!showWishlist && (
          <div className="p-4 border-b border-border/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left side filters */}
              <div className="flex flex-wrap items-center gap-3">
                <Select value={catFilter} onValueChange={setCatFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-white rounded-md border-border/80">
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-white rounded-md border-border/80">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-white rounded-md border-border/80">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="stock-asc">Stock Low-High</SelectItem>
                    <SelectItem value="stock-desc">Stock High-Low</SelectItem>
                    <SelectItem value="price-asc">Price Low-High</SelectItem>
                    <SelectItem value="price-desc">Price High-Low</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={statusFilter === "draft" ? "default" : "outline"}
                  className={`h-9 px-3 text-xs rounded-md gap-2 ${statusFilter === "draft" ? "bg-[#007A87] text-white hover:bg-[#007A87]/90" : "bg-white text-slate-700 border-border/80"}`}
                  onClick={() => setStatusFilter(statusFilter === "draft" ? "all" : "draft")}
                >
                  <Filter
                    className={`w-3.5 h-3.5 ${statusFilter === "draft" ? "text-white" : "text-muted-foreground"}`}
                  />
                  {statusFilter === "draft" ? "Drafts Only" : "Draft Medicine"}
                </Button>
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 px-3 text-xs bg-white text-slate-700 border-border/80 rounded-md gap-2"
                    >
                      <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                      Manage Column
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>Customize Filters</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {CUSTOMIZABLE_FILTERS.map((f) => (
                      <DropdownMenuCheckboxItem
                        key={f.id}
                        checked={visibleFields.includes(f.id)}
                        onCheckedChange={() => toggleField(f.id)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {f.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  className="h-9 px-3 text-xs bg-white text-slate-700 border-border/80 rounded-md gap-2"
                  onClick={() => setIsExportModalOpen(true)}
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  Export
                </Button>

                {has("medicines", "create") && (
                  <Button
                    onClick={openCreate}
                    className="h-9 px-4 text-xs bg-[#007A87] hover:bg-[#007A87]/90 text-white rounded-md gap-1 font-semibold"
                  >
                    <Plus className="h-4 w-4" /> Create medicine
                  </Button>
                )}

                <div className="flex items-center gap-3 border-l border-border/60 pl-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    {filtered.length}/{medicines.length}
                  </span>

                  <div className="flex items-center border border-border/80 rounded-md bg-white shadow-sm shrink-0 overflow-hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 rounded-none ${viewMode === "list" ? "bg-muted/50 text-foreground" : "text-muted-foreground hover:bg-muted/30"}`}
                      onClick={() => setViewMode("list")}
                      title="List view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <div className="w-[1px] h-4 bg-border/80"></div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 rounded-none ${viewMode === "grid" ? "bg-muted/50 text-foreground" : "text-muted-foreground hover:bg-muted/30"}`}
                      onClick={() => setViewMode("grid")}
                      title="Grid view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search bar row */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="catalog-search-input"
                className="pl-9 h-9 bg-white border-border/80 rounded-md text-sm focus-visible:ring-1 focus-visible:ring-[#007A87]"
                placeholder="Search medicines"
                value={q}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-0">
          {filtered.length === 0 ? (
            <EmptyState
              title={showWishlist ? "Your wishlist is empty" : "No medicines matched filters"}
              description={
                showWishlist
                  ? "You haven't added any medicines to your wishlist yet."
                  : "Refine your criteria or add a new medicine configuration to the master catalog."
              }
              action={
                has("medicines", "create") &&
                !showWishlist && (
                  <Button
                    onClick={openCreate}
                    className="bg-[#007A87] hover:bg-[#007A87]/90 text-white"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add medicine
                  </Button>
                )
              }
            />
          ) : (
            <>
              {viewMode === "list" ? (
                <>
                  {/* Desktop table view */}
                  <div className="hidden md:block overflow-x-auto border border-border/80 rounded-2xl shadow-sm bg-white">
                    <table className="w-full text-[13px] border-collapse whitespace-nowrap">
                      <thead className="border-b border-border/40 bg-white text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              Medicine Name <ArrowDownUp className="w-3 h-3 opacity-50" />
                            </div>
                          </th>
                          {isFieldVisible("brand") && (
                            <th className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                Brand <ArrowDownUp className="w-3 h-3 opacity-50" />
                              </div>
                            </th>
                          )}
                          {isFieldVisible("genericName") && (
                            <th className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                Generic Name <ArrowDownUp className="w-3 h-3 opacity-50" />
                              </div>
                            </th>
                          )}
                          {isFieldVisible("saltComposition") && (
                            <th className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                Salt / Composition <ArrowDownUp className="w-3 h-3 opacity-50" />
                              </div>
                            </th>
                          )}
                          {isFieldVisible("category") && (
                            <th className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                Category <Filter className="w-3 h-3 opacity-50" />
                              </div>
                            </th>
                          )}
                          {isFieldVisible("strength") && <th className="px-4 py-3">Strength</th>}
                          {isFieldVisible("form") && <th className="px-4 py-3">Form</th>}
                          {isFieldVisible("packSize") && <th className="px-4 py-3">Pack Size</th>}
                          {isFieldVisible("barcode") && (
                            <th className="px-4 py-3">GTIN / Barcode</th>
                          )}
                          {isFieldVisible("batch") && <th className="px-4 py-3">Active Batch</th>}
                          {isFieldVisible("mrp") && (
                            <th className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                MRP <ArrowDownUp className="w-3 h-3 opacity-50" />
                              </div>
                            </th>
                          )}
                          {isFieldVisible("ptr") && <th className="px-4 py-3 text-right">PTR</th>}
                          {isFieldVisible("purchasePrice") && (
                            <th className="px-4 py-3 text-right">Purchase Price</th>
                          )}
                          {isFieldVisible("sellingPrice") && (
                            <th className="px-4 py-3 text-right">Selling Price</th>
                          )}
                          {isFieldVisible("currentStock") && (
                            <th className="px-4 py-3 text-right">Current Stock</th>
                          )}
                          {isFieldVisible("minStock") && (
                            <th className="px-4 py-3 text-right">Min Stock</th>
                          )}
                          {isFieldVisible("expiryDate") && (
                            <th className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                Expiry Date <ArrowDownUp className="w-3 h-3 opacity-50" />
                              </div>
                            </th>
                          )}
                          {isFieldVisible("rack") && <th className="px-4 py-3">Rack</th>}
                          {isFieldVisible("supplier") && <th className="px-4 py-3">Supplier</th>}
                          {isFieldVisible("availability") && (
                            <th className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                Status <Filter className="w-3 h-3 opacity-50" />
                              </div>
                            </th>
                          )}
                          <th className="px-4 py-3 text-center sticky right-0 bg-white border-l border-border/40">
                            <div className="flex items-center justify-center gap-1">
                              Actions <Activity className="w-3 h-3 opacity-50" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/80">
                        {paginatedData.map((m) => {
                          const meta = stockByMed.get(m.id);
                          const stockTone =
                            (meta?.current || 0) === 0
                              ? "out"
                              : (meta?.current || 0) <= (meta?.min || 0)
                                ? "low"
                                : "healthy";
                          return (
                            <tr
                              key={m.id}
                              className="group hover:bg-muted/10 transition-colors duration-200 bg-white border-b border-border/40 last:border-b-0"
                            >
                              {/* Medicine Info */}
                              <td className="px-4 py-3 font-semibold text-foreground group-hover:text-[#007A87] transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-border/40 select-none overflow-hidden">
                                    <img
                                      src={getImageForMedicine(m.id, m.dosageForm)}
                                      alt={`${m.name} packaging`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <Link
                                      to={`/medicines/${m.id}`}
                                      className="truncate block text-sm font-bold"
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
                              {isFieldVisible("brand") && (
                                <td className="px-4 py-3 text-muted-foreground">
                                  {m.brandName || "—"}
                                </td>
                              )}

                              {/* Generic */}
                              {isFieldVisible("genericName") && (
                                <td className="px-4 py-3 text-muted-foreground">
                                  {m.genericName || "—"}
                                </td>
                              )}

                              {/* Salt */}
                              {isFieldVisible("saltComposition") && (
                                <td
                                  className="px-4 py-3 text-muted-foreground max-w-[200px] truncate"
                                  title={m.saltComposition}
                                >
                                  {m.saltComposition || "—"}
                                </td>
                              )}

                              {/* Category */}
                              {isFieldVisible("category") && (
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-600 px-2.5 py-0.5 text-xs font-semibold border border-blue-100">
                                    {categories.find((c) => c.id === m.categoryId)?.name ?? "—"}
                                  </span>
                                </td>
                              )}

                              {/* Strength */}
                              {isFieldVisible("strength") && (
                                <td className="px-4 py-3 text-muted-foreground">
                                  {m.strength || "—"}
                                </td>
                              )}

                              {/* Form */}
                              {isFieldVisible("form") && (
                                <td className="px-4 py-3 text-muted-foreground">
                                  {m.dosageForm || "—"}
                                </td>
                              )}

                              {/* Pack */}
                              {isFieldVisible("packSize") && (
                                <td className="px-4 py-3 text-muted-foreground">
                                  {m.packSize || "—"}
                                </td>
                              )}

                              {/* GTIN / Barcode */}
                              {isFieldVisible("barcode") && (
                                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                                  <div>G: {m.gtin || "—"}</div>
                                  <div>B: {m.barcode || "—"}</div>
                                </td>
                              )}

                              {/* Active Batch */}
                              {isFieldVisible("batch") && (
                                <td className="px-4 py-3 font-mono text-xs">
                                  {meta?.batchNo || "—"}
                                </td>
                              )}

                              {/* MRP */}
                              {isFieldVisible("mrp") && (
                                <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                                  {currency}
                                  {meta?.mrp?.toFixed(2) || "0.00"}
                                </td>
                              )}

                              {/* PTR */}
                              {isFieldVisible("ptr") && (
                                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                  {currency}
                                  {m.ptr?.toFixed(2) || "0.00"}
                                </td>
                              )}

                              {/* Purchase */}
                              {isFieldVisible("purchasePrice") && (
                                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                  {currency}
                                  {meta?.pur?.toFixed(2) || "0.00"}
                                </td>
                              )}

                              {/* Selling */}
                              {isFieldVisible("sellingPrice") && (
                                <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">
                                  {currency}
                                  {meta?.sell?.toFixed(2) || "0.00"}
                                </td>
                              )}

                              {/* Stock */}
                              {isFieldVisible("currentStock") && (
                                <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                                  {meta?.current} units
                                </td>
                              )}

                              {/* Min Stock */}
                              {isFieldVisible("minStock") && (
                                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                  {m.reorderThreshold} units
                                </td>
                              )}

                              {/* Expiry */}
                              {isFieldVisible("expiryDate") && (
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
                              )}

                              {/* Rack */}
                              {isFieldVisible("rack") && (
                                <td className="px-4 py-3 text-muted-foreground font-mono">
                                  {m.rackLocation || "—"}
                                </td>
                              )}

                              {/* Supplier */}
                              {isFieldVisible("supplier") && (
                                <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">
                                  {meta?.supplier || "—"}
                                </td>
                              )}

                              {/* Availability */}
                              {isFieldVisible("availability") && (
                                <td className="px-4 py-3">
                                  {m.isActive ? (
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                        stockTone === "out"
                                          ? "bg-red-50 text-red-700 border-red-100"
                                          : stockTone === "low"
                                            ? "bg-amber-50 text-amber-700 border-amber-100"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                      }`}
                                    >
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                          stockTone === "out"
                                            ? "bg-red-500"
                                            : stockTone === "low"
                                              ? "bg-amber-500"
                                              : "bg-emerald-500"
                                        }`}
                                      />
                                      {stockTone === "out"
                                        ? "Out of Stock"
                                        : stockTone === "low"
                                          ? "Low Stock"
                                          : "Active"}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-0.5 text-xs font-semibold">
                                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                      Inactive
                                    </span>
                                  )}
                                </td>
                              )}

                              {/* Actions */}
                              <td className="px-4 py-3 text-center sticky right-0 bg-white border-l border-border/40">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2.5 text-xs text-slate-600 hover:text-slate-900 border-border/60 hover:bg-slate-50 rounded-md gap-1 font-medium"
                                    title="View details"
                                  >
                                    <Link to={`/medicines/${m.id}`}>
                                      <Eye className="h-3.5 w-3.5" /> View
                                    </Link>
                                  </Button>
                                  {has("medicines", "update") && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7 text-slate-600 border-border/60 hover:bg-slate-50 hover:text-slate-900 rounded-md"
                                      onClick={() => openEdit(m)}
                                      title="Edit Configuration"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {has("medicines", "delete") && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7 text-destructive border-border/60 hover:bg-destructive/10 rounded-md"
                                      onClick={() => setConfirmDelete(m)}
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3 w-3" />
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
                              <span className="text-muted-foreground block text-[10px]">
                                Stock Level
                              </span>
                              <span className="font-semibold text-foreground font-mono">
                                {meta?.current} units
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px]">
                                Rack Location
                              </span>
                              <span className="font-semibold text-foreground font-mono">
                                {m.rackLocation || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px]">
                                Selling Price
                              </span>
                              <span className="font-semibold text-emerald-600 font-mono">
                                {currency}
                                {meta?.sell?.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px]">
                                Expiry
                              </span>
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
                                onClick={() => setConfirmDelete(m)}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {paginatedData.map((m) => {
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
                        className="bg-white border border-border/80 rounded-2xl p-5 shadow-sm space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative flex flex-col justify-between overflow-hidden group"
                      >
                        <div>
                          {/* Top Actions */}
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {m.id.slice(0, 8).toUpperCase()}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 rounded-full ${wishlist.includes(m.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleWishlist(m.id);
                                if (!wishlist.includes(m.id))
                                  toast.success(`${m.name} added to favorites`);
                              }}
                            >
                              <Heart
                                className="h-4 w-4"
                                fill={wishlist.includes(m.id) ? "currentColor" : "none"}
                              />
                            </Button>
                          </div>

                          {/* Medicine Visual Representation */}
                          <div className="w-full h-32 bg-slate-50 rounded-xl flex items-center justify-center mb-4 border border-border/40 relative overflow-hidden">
                            <img
                              src={getImageForMedicine(m.id, m.dosageForm)}
                              alt={`${m.name} packaging`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>

                          {/* Details */}
                          <div className="space-y-1">
                            <Link
                              to={`/medicines/${m.id}`}
                              className="font-bold text-foreground hover:underline text-base truncate block"
                            >
                              {m.name}
                            </Link>
                            <p className="text-xs text-muted-foreground font-medium truncate">
                              {m.brandName || "No Brand"}
                            </p>

                            {/* Category badge */}
                            <div className="pt-1.5 flex flex-wrap gap-1">
                              <span className="rounded-md bg-[#007A87]/10 text-[#007A87] px-2 py-0.5 text-[10px] font-semibold">
                                {categories.find((c) => c.id === m.categoryId)?.name ??
                                  "Uncategorized"}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground pt-1.5 font-medium">
                              {m.strength || "—"} | {m.packSize || "—"}
                            </p>
                          </div>
                        </div>

                        <div>
                          {/* Prices & Stocks */}
                          <div className="flex justify-between items-end border-t border-border/40 pt-3 mt-3">
                            <div>
                              <span className="text-[10px] text-muted-foreground block font-medium">
                                Price (MRP)
                              </span>
                              <span className="font-extrabold text-slate-800 text-sm">
                                {currency}
                                {meta?.mrp?.toFixed(2) || "0.00"}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground block font-medium">
                                Stock Level
                              </span>
                              <span
                                className={`text-xs font-black ${
                                  stockTone === "out"
                                    ? "text-red-500"
                                    : stockTone === "low"
                                      ? "text-amber-500"
                                      : "text-emerald-600"
                                }`}
                              >
                                {meta?.current || 0} units
                              </span>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="flex gap-2 mt-4 pt-1">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs gap-1 rounded-xl h-9 border-[#007A87]/20 text-[#007A87] hover:bg-[#007A87]/5"
                            >
                              <Link to={`/medicines/${m.id}`}>
                                <Eye className="h-3.5 w-3.5" /> View Details
                              </Link>
                            </Button>
                            {has("medicines", "update") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 w-9 p-0 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground"
                                onClick={() => openEdit(m)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto py-2">
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-slate-500 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} medicines
            </span>
            <div className="flex items-center gap-2 border border-border/60 rounded-md bg-white px-2.5 py-1.5 cursor-not-allowed opacity-70">
              <span className="text-[13px] text-slate-600 font-medium">10 per page</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
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

      {/* RENDER SHEET DRAWER FORM */}
      <MedicineFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        onSubmit={submit}
      />

      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Medicines Catalog</DialogTitle>
            <DialogDescription>
              Choose the format you would like to export to. Only the currently visible columns
              based on your filters will be exported.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-4 py-4">
            <Button
              variant="outline"
              className="flex-1 h-24 flex flex-col gap-2 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleExport("csv")}
            >
              <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
              <span className="font-semibold">Excel (CSV)</span>
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-24 flex flex-col gap-2 hover:border-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleExport("pdf")}
            >
              <Download className="h-8 w-8 text-red-600" />
              <span className="font-semibold">PDF Document</span>
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="ghost" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION POPUP */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete medicine?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medicine? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => confirmDelete && deleteMedicine(confirmDelete)}
            >
              Delete
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
          categoryId:
            (typeof editing.categoryId === "object"
              ? editing.categoryId?._id
              : editing.categoryId) ?? "",
          manufacturerId:
            (typeof editing.manufacturerId === "object"
              ? editing.manufacturerId?._id
              : editing.manufacturerId) ?? "",
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
          id="medicine-form"
          onSubmit={handleSubmit(
            (v) => {
              onSubmit(v);
              reset();
            },
            (errors) => {
              const firstError = Object.values(errors)[0];
              if (firstError) {
                toast.error(`Validation Error: ${firstError.message}`);
              } else {
                toast.error("Please fill all required fields correctly.");
              }
            },
          )}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
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
              className="flex-1 bg-[#007A87] hover:bg-[#007A87]/90 text-white rounded-lg"
            >
              {editing ? "Save Changes" : "Register Medicine"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
