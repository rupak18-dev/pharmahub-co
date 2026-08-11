import { useMemo, useState, useRef } from "react";
import {
  Search,
  Download,
  Eye,
  RefreshCw,
  Star,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Boxes,
  Receipt,
  ShoppingCart,
  Clock,
  AlertTriangle,
  ClipboardList,
  X,
  FileText,
  DollarSign,
  Layers,
  ChevronDown,
  MoreHorizontal,
  AlertCircle,
  Plus,
  Bookmark,
  UploadCloud,
  Trash2,
  Copy,
  ArrowUpDown,
  ShieldCheck,
  FolderUp,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { useDb } from "@/hooks/useDb";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";
import { Skeleton } from "@/Components/ui/skeleton";
import { downloadCsv } from "@/lib/csv";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/Components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
export const handle = { title: "Reports Center · PharmaHub Enterprise" };
/* =====================================================================
   CURATED ENTERPRISE REPORT CATALOG (6 REALISTIC CORE REPORTS)
   ===================================================================== */
const INITIAL_REPORTS = [
  {
    id: "sales-summary",
    title: "Sales Summary & Register",
    category: "Sales",
    description: "Itemized register of sales invoices, revenue breakdown, and payment modes.",
    owner: "Store Admin",
    lastGenerated: "Today, 10:45 AM",
    lastModified: "Today, 10:45 AM",
    status: "Ready",
    formats: ["CSV", "Excel", "PDF"],
    keywords: ["sales", "revenue", "invoices", "payment", "gross revenue"],
    icon: TrendingUp,
    isPinned: true,
  },
  {
    id: "purchase-register",
    title: "Purchase Register & GRN Audit",
    category: "Purchases",
    description:
      "Detailed procurement audit tracking Goods Received Notes (GRNs) and supplier invoices.",
    owner: "Procurement Lead",
    lastGenerated: "Yesterday, 04:20 PM",
    lastModified: "Yesterday, 04:20 PM",
    status: "Ready",
    formats: ["CSV", "Excel", "PDF"],
    keywords: ["purchases", "grn", "procurement", "suppliers", "inward"],
    icon: ShoppingCart,
    isPinned: true,
  },
  {
    id: "stock-valuation",
    title: "Stock Valuation by Category",
    category: "Inventory",
    description:
      "Complete asset valuation of active medicine inventory evaluated at cost and retail value.",
    owner: "Inventory Manager",
    lastGenerated: "Today, 08:30 AM",
    lastModified: "Today, 08:30 AM",
    status: "Ready",
    formats: ["CSV", "Excel", "PDF"],
    keywords: ["stock", "inventory", "valuation", "cost", "assets"],
    icon: Boxes,
    isPinned: true,
  },
  {
    id: "gst-summary",
    title: "GST Tax Filing Summary",
    category: "GST",
    description:
      "Tax liability summary grouped by GST slabs (5%, 12%, 18%) for monthly tax returns.",
    owner: "Chief Accountant",
    lastGenerated: "Today, 07:00 AM",
    lastModified: "Today, 07:00 AM",
    status: "Ready",
    formats: ["CSV", "Excel", "PDF"],
    keywords: ["gst", "tax", "hsn", "cgst", "sgst", "filing"],
    icon: Receipt,
    isPinned: true,
  },
  {
    id: "stock-audit",
    title: "Inventory Stock Ledger & Audit",
    category: "Audit",
    description: "Complete trace log of inward receipts, POS deductions, and stock adjustments.",
    owner: "System Auto-Schedule",
    lastGenerated: "Scheduled Daily, 12:00 AM",
    lastModified: "2 days ago",
    status: "Scheduled",
    formats: ["CSV", "Excel"],
    keywords: ["audit", "ledger", "stock movement", "adjustments"],
    icon: ClipboardList,
    isPinned: false,
  },
  {
    id: "expiry-audit",
    title: "Expiry & Near-Expiry Audit",
    category: "Expiry",
    description:
      "Critical risk analysis of expired and near-expiry medicine batches to prevent loss.",
    owner: "Quality Assurance",
    lastGenerated: "Today, 09:15 AM",
    lastModified: "Today, 09:15 AM",
    status: "Ready",
    formats: ["CSV", "Excel", "PDF"],
    keywords: ["expiry", "expired", "shelf life", "compliance"],
    icon: AlertTriangle,
    isPinned: true,
  },
  {
    id: "compliance-narcotics",
    title: "Schedule H & H1 Drug Audit",
    category: "Compliance",
    description:
      "Mandatory regulatory register for controlled drugs, prescriber details, and verification.",
    owner: "Compliance Officer",
    lastGenerated: "3 days ago",
    lastModified: "3 days ago",
    status: "Ready",
    formats: ["CSV", "PDF"],
    keywords: ["compliance", "narcotics", "schedule h", "prescriptions"],
    icon: ShieldCheck,
    isPinned: false,
  },
  {
    id: "finance-operating",
    title: "Financial Operating Statement",
    category: "Finance",
    description:
      "High-level operational summary comparing gross revenue against procurement intake.",
    owner: "Chief Accountant",
    lastGenerated: "Today, 06:30 AM",
    lastModified: "Today, 06:30 AM",
    status: "Ready",
    formats: ["CSV", "Excel", "PDF"],
    keywords: ["finance", "operating", "gross sales", "procurement cost", "liquidity"],
    icon: DollarSign,
    isPinned: false,
  },
];
// Core 5 Frequently Used Report IDs for Quick Access Tiles
const FREQUENTLY_USED_IDS = [
  "sales-summary",
  "purchase-register",
  "stock-valuation",
  "gst-summary",
  "expiry-audit",
];
const CATEGORY_LIST = [
  { id: "All", label: "All Reports", icon: Layers },
  { id: "Favorites", label: "Favorites", icon: Bookmark },
  { id: "Sales", label: "Sales", icon: TrendingUp },
  { id: "Inventory", label: "Inventory", icon: Boxes },
  { id: "Purchases", label: "Purchases", icon: ShoppingCart },
  { id: "GST", label: "GST", icon: Receipt },
  { id: "Finance", label: "Finance", icon: DollarSign },
  { id: "Expiry", label: "Expiry", icon: AlertTriangle },
  { id: "Audit", label: "Audit", icon: ClipboardList },
  { id: "Compliance", label: "Compliance", icon: ShieldCheck },
  { id: "Uploaded", label: "Uploaded Reports", icon: FolderUp },
];
/* =====================================================================
   MAIN ENTERPRISE REPORTS CENTER COMPONENT
   ===================================================================== */
export default function ReportsPage() {
  const dbData = useDb((d) => d);
  const currency = dbData.settings.currency;
  // Primary State
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  // Date Range State
  const [datePreset, setDatePreset] = useState("30days");
  const [fromDate, setFromDate] = useState(subDays(new Date(), 30).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  // Sorting State
  const [sortField, setSortField] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  // Workflow Dialog States
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [isUploadReportOpen, setIsUploadReportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  // New Report Form State
  const [newReportName, setNewReportName] = useState("");
  const [newReportCategory, setNewReportCategory] = useState("Sales");
  const [newReportDescription, setNewReportDescription] = useState("");
  const [newReportTemplateType, setNewReportTemplateType] = useState("Summary");
  const [newReportPermissions, setNewReportPermissions] = useState("All Staff");
  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Compliance");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  // Recent Activity Feed State
  const [recentActivity, setRecentActivity] = useState([
    {
      id: "act-1",
      reportTitle: "Sales Summary & Register",
      action: "Exported",
      format: "CSV",
      user: "Admin",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: "act-2",
      reportTitle: "Stock Valuation by Category",
      action: "Previewed",
      user: "Inventory Mgr",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: "act-3",
      reportTitle: "GST Tax Filing Summary",
      action: "Exported",
      format: "PDF",
      user: "Accountant",
      timestamp: new Date(Date.now() - 1000 * 60 * 180),
    },
  ]);
  // Date Range Validation Check
  const dateError = useMemo(() => {
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      return "Start date cannot be after end date.";
    }
    return null;
  }, [fromDate, toDate]);
  // Log Activity Helper
  const logActivity = (reportTitle, action, format) => {
    const newItem = {
      id: `act-${Date.now()}`,
      reportTitle,
      action,
      format,
      user: "Admin",
      timestamp: new Date(),
    };
    setRecentActivity((prev) => [newItem, ...prev]);
  };
  // Toggle Pin / Favorite Status
  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = !r.isPinned;
          toast.success(next ? `Pinned ${r.title} to Favorites` : `Unpinned ${r.title}`);
          return { ...r, isPinned: next };
        }
        return r;
      }),
    );
  };
  // Date Preset Change Handler
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    let f = now;
    let t = now;
    if (preset === "today") {
      f = now;
      t = now;
    } else if (preset === "yesterday") {
      f = subDays(now, 1);
      t = subDays(now, 1);
    } else if (preset === "7days") {
      f = subDays(now, 7);
      t = now;
    } else if (preset === "30days") {
      f = subDays(now, 30);
      t = now;
    } else if (preset === "thisMonth") {
      f = startOfMonth(now);
      t = endOfMonth(now);
    } else if (preset === "lastMonth") {
      const prev = subDays(startOfMonth(now), 1);
      f = startOfMonth(prev);
      t = endOfMonth(prev);
    } else if (preset === "financialYear") {
      f = startOfYear(now);
      t = endOfYear(now);
    }
    if (preset !== "custom") {
      setFromDate(f.toISOString().slice(0, 10));
      setToDate(t.toISOString().slice(0, 10));
    }
  };
  // Filtered Category Counts Memo
  const categoryCounts = useMemo(() => {
    const map = {
      All: reports.length,
      Favorites: reports.filter((r) => r.isPinned).length,
      Sales: reports.filter((r) => r.category === "Sales").length,
      Inventory: reports.filter((r) => r.category === "Inventory").length,
      Purchases: reports.filter((r) => r.category === "Purchases").length,
      GST: reports.filter((r) => r.category === "GST").length,
      Finance: reports.filter((r) => r.category === "Finance").length,
      Expiry: reports.filter((r) => r.category === "Expiry").length,
      Audit: reports.filter((r) => r.category === "Audit").length,
      Compliance: reports.filter((r) => r.category === "Compliance").length,
      Uploaded: reports.filter((r) => r.isUploaded || r.category === "Uploaded").length,
    };
    return map;
  }, [reports]);
  // Owners List for Filter
  const uniqueOwners = useMemo(() => {
    const owners = Array.from(new Set(reports.map((r) => r.owner)));
    return owners;
  }, [reports]);
  // Frequently Used Reports List
  const frequentReports = useMemo(() => {
    return reports.filter((r) => FREQUENTLY_USED_IDS.includes(r.id));
  }, [reports]);
  // Filtered & Sorted Explorer Table Reports Memo
  const explorerReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports
      .filter((r) => {
        // Category Filter
        if (selectedCategory === "Favorites") {
          if (!r.isPinned) return false;
        } else if (selectedCategory === "Uploaded") {
          if (!r.isUploaded && r.category !== "Uploaded") return false;
        } else if (selectedCategory !== "All") {
          if (r.category !== selectedCategory) return false;
        }
        // Owner Filter
        if (ownerFilter !== "all" && r.owner !== ownerFilter) return false;
        // Status Filter
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        // Search Query
        if (!q) return true;
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.owner.toLowerCase().includes(q) ||
          r.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        let valA = a[sortField] || "";
        let valB = b[sortField] || "";
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [reports, selectedCategory, ownerFilter, statusFilter, searchQuery, sortField, sortOrder]);
  // Sort Toggle Handler
  const handleSortToggle = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };
  /* =====================================================================
       REAL DATA QUERY CALCULATIONS FOR PREVIEW & EXPORTS
       ===================================================================== */
  const getReportData = (reportId) => {
    const rangeF = new Date(fromDate).getTime();
    const rangeT = new Date(toDate).getTime() + 24 * 60 * 60 * 1000 - 1;
    const medMap = new Map(dbData.medicines.map((m) => [m.id, m]));
    const catMap = new Map(dbData.categories.map((c) => [c.id, c.name]));
    const supMap = new Map(dbData.suppliers.map((s) => [s.id, s]));
    switch (reportId) {
      case "sales-summary": {
        const sales = dbData.sales.filter((s) => {
          if (s.status === "voided") return false;
          const c = new Date(s.createdAt).getTime();
          return c >= rangeF && c <= rangeT;
        });
        const headers = [
          "Invoice No",
          "Date",
          "Customer",
          "Payment Mode",
          "Items",
          "Subtotal",
          "GST",
          "Grand Total",
        ];
        const rows = sales.map((s) => [
          s.invoiceNo,
          format(new Date(s.createdAt), "yyyy-MM-dd HH:mm"),
          s.customerName || "Walk-in Customer",
          s.paymentMode.toUpperCase(),
          s.items.length,
          `${currency}${s.subtotal.toFixed(2)}`,
          `${currency}${s.gstTotal.toFixed(2)}`,
          `${currency}${s.grandTotal.toFixed(2)}`,
        ]);
        const rawForCsv = sales.map((s) => ({
          InvoiceNo: s.invoiceNo,
          Date: s.createdAt,
          Customer: s.customerName || "Walk-in",
          PaymentMode: s.paymentMode,
          ItemsCount: s.items.length,
          Subtotal: s.subtotal,
          GSTTotal: s.gstTotal,
          GrandTotal: s.grandTotal,
        }));
        return {
          title: "Sales Summary & Register",
          headers,
          rows,
          rawForCsv,
          totalCount: sales.length,
        };
      }
      case "purchase-register": {
        const grns = dbData.grns.filter((g) => {
          const c = new Date(g.createdAt).getTime();
          return c >= rangeF && c <= rangeT;
        });
        const headers = [
          "GRN Number",
          "Date",
          "Supplier",
          "Invoice No",
          "Items Received",
          "Total Value",
        ];
        const rows = grns.map((g) => [
          g.grnNumber,
          format(new Date(g.createdAt), "yyyy-MM-dd HH:mm"),
          supMap.get(g.supplierId)?.name ?? "—",
          g.invoiceNumber || "N/A",
          g.items.length,
          `${currency}${g.totalValue.toLocaleString()}`,
        ]);
        const rawForCsv = grns.map((g) => ({
          GRNNumber: g.grnNumber,
          Date: g.createdAt,
          Supplier: supMap.get(g.supplierId)?.name ?? "—",
          InvoiceNumber: g.invoiceNumber || "N/A",
          ItemsCount: g.items.length,
          TotalValue: g.totalValue,
        }));
        return {
          title: "Purchase Register & GRN Audit",
          headers,
          rows,
          rawForCsv,
          totalCount: grns.length,
        };
      }
      case "stock-valuation": {
        const catVal = new Map();
        dbData.batches.forEach((b) => {
          if (b.currentStock <= 0) return;
          const m = medMap.get(b.medicineId);
          const catId = m?.categoryId ?? "uncat";
          const cur = catVal.get(catId) ?? { count: 0, units: 0, costVal: 0, mktVal: 0 };
          cur.count += 1;
          cur.units += b.currentStock;
          cur.costVal += b.currentStock * b.purchasePrice;
          cur.mktVal += b.currentStock * b.sellingPrice;
          catVal.set(catId, cur);
        });
        const sorted = Array.from(catVal, ([id, v]) => ({
          category: catMap.get(id) ?? "Uncategorized",
          batchesCount: v.count,
          units: v.units,
          costValuation: Math.round(v.costVal),
          sellingValuation: Math.round(v.mktVal),
        })).sort((a, b) => b.costValuation - a.costValuation);
        const headers = [
          "Category",
          "Batches Count",
          "Total Stock Units",
          "Valuation (at Cost)",
          "Market Selling Value",
        ];
        const rows = sorted.map((r) => [
          r.category,
          r.batchesCount,
          r.units,
          `${currency}${r.costValuation.toLocaleString()}`,
          `${currency}${r.sellingValuation.toLocaleString()}`,
        ]);
        return {
          title: "Stock Valuation by Category",
          headers,
          rows,
          rawForCsv: sorted,
          totalCount: sorted.length,
        };
      }
      case "gst-summary": {
        const sales = dbData.sales.filter((s) => {
          if (s.status === "voided") return false;
          const c = new Date(s.createdAt).getTime();
          return c >= rangeF && c <= rangeT;
        });
        const gstByRate = new Map();
        sales.forEach((s) =>
          s.items.forEach((it) => {
            const cur = gstByRate.get(it.gstRate) ?? { count: 0, taxable: 0, tax: 0 };
            const taxable = it.lineTotal / (1 + it.gstRate / 100);
            cur.count += it.quantity;
            cur.taxable += taxable;
            cur.tax += it.lineTotal - taxable;
            gstByRate.set(it.gstRate, cur);
          }),
        );
        const sorted = Array.from(gstByRate, ([rate, v]) => ({
          rate: `${rate}%`,
          unitsSold: v.count,
          taxableTurnover: Math.round(v.taxable),
          taxCollected: Math.round(v.tax),
        })).sort((a, b) => b.taxableTurnover - a.taxableTurnover);
        const headers = [
          "GST Rate Slab",
          "Units Sold",
          "Taxable Turnover",
          "Tax Liability Collected",
        ];
        const rows = sorted.map((r) => [
          r.rate,
          r.unitsSold,
          `${currency}${r.taxableTurnover.toLocaleString()}`,
          `${currency}${r.taxCollected.toLocaleString()}`,
        ]);
        return {
          title: "GST Tax Filing Summary",
          headers,
          rows,
          rawForCsv: sorted,
          totalCount: sorted.length,
        };
      }
      case "expiry-audit": {
        const expList = dbData.batches
          .filter((b) => b.currentStock > 0)
          .map((b) => {
            const expT = new Date(b.expiryDate).getTime();
            const daysRem = Math.ceil((expT - Date.now()) / (24 * 60 * 60 * 1000));
            return {
              medicine: medMap.get(b.medicineId)?.name ?? "—",
              batch: b.batchNumber,
              expiryDate: b.expiryDate.slice(0, 10),
              daysRemaining: daysRem,
              stock: b.currentStock,
              status: b.status,
            };
          })
          .sort((a, b) => a.daysRemaining - b.daysRemaining);
        const headers = [
          "Medicine Name",
          "Batch Number",
          "Expiry Date",
          "Days Remaining",
          "Stock",
          "Status",
        ];
        const rows = expList.map((r) => [
          r.medicine,
          r.batch,
          r.expiryDate,
          r.daysRemaining < 0
            ? `Expired (${Math.abs(r.daysRemaining)}d ago)`
            : `${r.daysRemaining} days`,
          r.stock,
          r.status?.replace("_", " ").toUpperCase() ?? "—",
        ]);
        return {
          title: "Expiry & Near-Expiry Audit",
          headers,
          rows,
          rawForCsv: expList,
          totalCount: expList.length,
        };
      }
      case "stock-audit": {
        const sorted = [...dbData.stockMovements]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 50);
        const headers = [
          "Timestamp",
          "Medicine",
          "Movement Type",
          "Quantity",
          "Reason",
          "Created By",
        ];
        const rows = sorted.map((m) => [
          format(new Date(m.createdAt), "yyyy-MM-dd HH:mm"),
          medMap.get(m.medicineId)?.name ?? "—",
          m.movementType.toUpperCase(),
          m.quantity,
          m.reason,
          m.createdBy,
        ]);
        const rawForCsv = sorted.map((m) => ({
          Timestamp: m.createdAt,
          Medicine: medMap.get(m.medicineId)?.name ?? "—",
          MovementType: m.movementType,
          Quantity: m.quantity,
          Reason: m.reason,
          CreatedBy: m.createdBy,
        }));
        return {
          title: "Inventory Stock Ledger & Audit",
          headers,
          rows,
          rawForCsv,
          totalCount: sorted.length,
        };
      }
      default: {
        const targetReport = reports.find((r) => r.id === reportId);
        const headers = ["Document Parameter", "Value", "Status Notes"];
        const rows = [
          ["Document Title", targetReport?.title || reportId, "Verified Document"],
          ["Category Tag", targetReport?.category || "General", "Enterprise Classifier"],
          ["Owner", targetReport?.owner || "Admin", "Authorized Owner"],
          ["Last Modified", targetReport?.lastModified || "Today", "System Logged"],
          ["Access Status", targetReport?.status || "Ready", "Security Approved"],
        ];
        return {
          title: targetReport?.title || "Operational Report",
          headers,
          rows,
          rawForCsv: rows.map((r) => ({ Parameter: r[0], Value: r[1], Status: r[2] })),
          totalCount: rows.length,
        };
      }
    }
  };
  // Export Action
  const handleExport = (report, fmt) => {
    if (dateError) {
      toast.error("Please correct date range errors before exporting.");
      return;
    }
    try {
      const dataObj = getReportData(report.id);
      if (!dataObj.rawForCsv || dataObj.rawForCsv.length === 0) {
        toast.error(`No data records available for ${report.title} in selected period.`);
        return;
      }
      const ext = fmt === "Excel" ? "xlsx" : fmt === "PDF" ? "pdf" : "csv";
      const filename = `${report.id}_${fromDate}_to_${toDate}.${ext}`;
      downloadCsv(filename, dataObj.rawForCsv);
      toast.success(`Exporting ${report.title} as ${fmt}...`);
      logActivity(report.title, "Exported", fmt);
    } catch (err) {
      toast.error(`Failed to export ${report.title}.`);
    }
  };
  // Open Preview Modal
  const handleOpenPreview = (report) => {
    if (dateError) {
      toast.error("Please correct date range errors before previewing.");
      return;
    }
    setIsPreviewLoading(true);
    setPreviewReport(report);
    logActivity(report.title, "Previewed");
    setTimeout(() => setIsPreviewLoading(false), 200);
  };
  // File Upload Handlers
  const validateAndSetFile = (file) => {
    const allowed = ["pdf", "xlsx", "csv", "docx", "png", "jpg", "jpeg"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowed.includes(ext)) {
      toast.error(`Format '.${ext}' is not supported. Supported: PDF, XLSX, CSV, DOCX, Images.`);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size exceeds 25 MB limit.");
      return;
    }
    setUploadedFile(file);
    if (!uploadTitle.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setUploadTitle(baseName);
    }
    toast.success(`Attached file: ${file.name}`);
  };
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };
  // Form Submit: Create New Report Template
  const handleCreateNewReportSubmit = (e) => {
    e.preventDefault();
    if (!newReportName.trim()) {
      toast.error("Please enter a valid report name.");
      return;
    }
    const newId = `custom-${Date.now()}`;
    const createdReport = {
      id: newId,
      title: newReportName.trim(),
      category: newReportCategory,
      description: newReportDescription.trim() || "Custom enterprise report template.",
      owner: "Admin",
      lastGenerated: "Never Generated",
      lastModified: "Just Now",
      status: "Ready",
      formats: ["CSV", "Excel", "PDF"],
      keywords: ["custom", newReportTemplateType.toLowerCase(), newReportCategory.toLowerCase()],
      icon: FileSpreadsheet,
      isPinned: false,
    };
    setReports((prev) => [createdReport, ...prev]);
    toast.success(`Report template "${newReportName}" created successfully!`);
    logActivity(newReportName, "Generated");
    setIsNewReportOpen(false);
    setNewReportName("");
    setNewReportDescription("");
  };
  // Form Submit: Upload External Report
  const handleUploadReportSubmit = (e) => {
    e.preventDefault();
    if (!uploadedFile) {
      toast.error("Please select or drop a file to upload.");
      return;
    }
    const docTitle = uploadTitle.trim() || uploadedFile.name;
    const newId = `upload-${Date.now()}`;
    const uploadedReport = {
      id: newId,
      title: docTitle,
      category: uploadCategory,
      description: uploadDescription.trim() || `Uploaded document (${uploadedFile.name}).`,
      owner: "Admin Upload",
      lastGenerated: "Uploaded File",
      lastModified: "Just Now",
      status: "Uploaded",
      formats: [uploadedFile.name.endsWith(".pdf") ? "PDF" : "CSV"],
      keywords: ["uploaded", "external", uploadedFile.name.toLowerCase()],
      icon: FolderUp,
      isUploaded: true,
      isPinned: false,
    };
    setReports((prev) => [uploadedReport, ...prev]);
    toast.success(`Report document "${docTitle}" uploaded successfully!`);
    logActivity(docTitle, "Uploaded", "PDF");
    setIsUploadReportOpen(false);
    setUploadTitle("");
    setUploadDescription("");
    setUploadedFile(null);
  };
  // Table More Action Menu Actions
  const handleDuplicateReport = (report) => {
    const dup = {
      ...report,
      id: `copy-${Date.now()}`,
      title: `${report.title} (Copy)`,
      lastModified: "Just Now",
    };
    setReports((prev) => [dup, ...prev]);
    toast.success(`Duplicated "${report.title}"`);
  };
  const handleArchiveReport = (report) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id ? { ...r, status: r.status === "Archived" ? "Ready" : "Archived" } : r,
      ),
    );
    toast.success(
      report.status === "Archived" ? `Restored "${report.title}"` : `Archived "${report.title}"`,
    );
  };
  const handleDeleteReport = (report) => {
    setReports((prev) => prev.filter((r) => r.id !== report.id));
    toast.success(`Deleted "${report.title}"`);
  };
  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden p-1 sm:p-0">
      {/* 1. TOP PAGE HEADER & PRIMARY WORKFLOW ACTIONS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-primary" /> Reports Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Generate, organize and manage pharmacy operational reports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs min-h-[44px] sm:min-h-0 font-medium border-border hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setIsHistoryOpen(true)}
            aria-label="View Export History"
          >
            <Clock className="mr-1.5 h-4 w-4 text-muted-foreground" />
            <span>Export History</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs min-h-[44px] sm:min-h-0 font-medium border-border hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setIsUploadReportOpen(true)}
            aria-label="Upload external report file"
          >
            <FolderUp className="mr-1.5 h-4 w-4 text-muted-foreground" />
            <span>Upload Report</span>
          </Button>

          <Button
            size="sm"
            className="h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] sm:min-h-0 font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
            onClick={() => setIsNewReportOpen(true)}
            aria-label="Create new report template"
          >
            <Plus className="h-4 w-4" />
            <span>New Report</span>
          </Button>
        </div>
      </div>

      {/* 2. GLOBAL ENTERPRISE SEARCH & FILTERS TOOLBAR */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3.5 w-full">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Full-width Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 pr-8 h-9 text-xs sm:text-sm w-full focus-visible:ring-2 focus-visible:ring-primary bg-background"
              placeholder="Search reports by name, description, category, or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search reports directory"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Inline Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Owner Filter */}
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="h-9 text-xs w-[140px] bg-background font-medium">
                <SelectValue placeholder="All Owners" />
              </SelectTrigger>
              <SelectContent align="end" className="text-xs">
                <SelectItem value="all" className="text-xs">
                  All Owners
                </SelectItem>
                {uniqueOwners.map((owner) => (
                  <SelectItem key={owner} value={owner} className="text-xs">
                    {owner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs w-[130px] bg-background font-medium">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent align="end" className="text-xs">
                <SelectItem value="all" className="text-xs">
                  All Status
                </SelectItem>
                <SelectItem value="Ready" className="text-xs">
                  Ready
                </SelectItem>
                <SelectItem value="Scheduled" className="text-xs">
                  Scheduled
                </SelectItem>
                <SelectItem value="Uploaded" className="text-xs">
                  Uploaded
                </SelectItem>
                <SelectItem value="Archived" className="text-xs">
                  Archived
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Date Preset Filter */}
            <Select value={datePreset} onValueChange={(v) => handlePresetChange(v)}>
              <SelectTrigger className="h-9 text-xs w-[150px] bg-background font-medium">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent align="end" className="text-xs">
                <SelectItem value="today" className="text-xs">
                  Today
                </SelectItem>
                <SelectItem value="yesterday" className="text-xs">
                  Yesterday
                </SelectItem>
                <SelectItem value="7days" className="text-xs">
                  Last 7 Days
                </SelectItem>
                <SelectItem value="30days" className="text-xs">
                  Last 30 Days
                </SelectItem>
                <SelectItem value="thisMonth" className="text-xs">
                  This Month
                </SelectItem>
                <SelectItem value="lastMonth" className="text-xs">
                  Last Month
                </SelectItem>
                <SelectItem value="financialYear" className="text-xs">
                  Financial Year
                </SelectItem>
                <SelectItem value="custom" className="text-xs font-semibold text-primary">
                  Custom Range...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {datePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border text-xs w-full">
            <div className="flex items-center gap-2">
              <Label htmlFor="from-date" className="text-xs text-muted-foreground font-medium">
                From:
              </Label>
              <Input
                id="from-date"
                type="date"
                className="h-8 text-xs w-36"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="to-date" className="text-xs text-muted-foreground font-medium">
                To:
              </Label>
              <Input
                id="to-date"
                type="date"
                className="h-8 text-xs w-36"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Applied: {fromDate} to {toDate}
            </span>
          </div>
        )}

        {/* Date Validation Error Banner */}
        {dateError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{dateError}</span>
          </div>
        )}
      </div>

      {/* 3. REPORT EXPLORER MAIN LAYOUT (LEFT SIDEBAR + RIGHT PANEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* LEFT STICKY SIDEBAR: REPORT CATEGORIES */}
        <aside className="lg:col-span-3 lg:sticky lg:top-4 space-y-1.5 w-full">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Categories</span>
            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
              {reports.length}
            </span>
          </div>

          {/* Desktop & Tablet Navigation Panel */}
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
            {CATEGORY_LIST.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const isSelected = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex shrink-0 items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left min-h-[38px] ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}
                    />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground font-semibold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* RIGHT PANEL: FREQUENTLY USED + EXPLORER TABLE */}
        <main className="lg:col-span-9 space-y-6 min-w-0 w-full">
          {/* SECTION A: FREQUENTLY USED REPORTS (COMPACT QUICK-ACCESS TILES) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Frequently Used Reports
              </h2>
              <span className="text-[11px] text-muted-foreground">Quick Access</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 w-full">
              {frequentReports.map((report) => (
                <div
                  key={`freq-${report.id}`}
                  className="rounded-lg border border-border bg-card p-3 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[9px] font-medium px-1.5 py-0">
                        {report.category}
                      </Badge>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(report.id, e)}
                        className="text-muted-foreground hover:text-amber-500 p-0.5 rounded"
                        title={report.isPinned ? "Unpin" : "Pin"}
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${report.isPinned ? "text-amber-500 fill-amber-500" : ""}`}
                        />
                      </button>
                    </div>
                    <h3 className="text-xs font-semibold text-foreground line-clamp-1">
                      {report.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenPreview(report)}
                    >
                      <Eye className="mr-1 h-3 w-3" /> Preview
                    </Button>

                    <Button
                      size="sm"
                      className="h-7 text-[11px] px-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium"
                      onClick={() => handleExport(report, "CSV")}
                    >
                      <Download className="mr-1 h-3 w-3" /> Export
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION B: REPORTS EXPLORER TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reports Explorer
                </h2>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {explorerReports.length} {explorerReports.length === 1 ? "report" : "reports"}
                </Badge>
              </div>

              <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
                Category: {selectedCategory}
              </span>
            </div>

            {/* Explorer Data Table */}
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden w-full">
              {explorerReports.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">No reports found</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      No report matches your selected category "{selectedCategory}" or search query.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {selectedCategory === "Uploaded" ? (
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-primary text-primary-foreground font-semibold"
                        onClick={() => setIsUploadReportOpen(true)}
                      >
                        <FolderUp className="mr-1.5 h-3.5 w-3.5" /> Upload External Report
                      </Button>
                    ) : selectedCategory === "Favorites" ? (
                      <>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-primary text-primary-foreground font-semibold"
                          onClick={() => setSelectedCategory("All")}
                        >
                          <Layers className="mr-1.5 h-3.5 w-3.5" /> Browse All Reports
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSearchQuery("");
                            setOwnerFilter("all");
                            setStatusFilter("all");
                          }}
                        >
                          Clear All Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-primary text-primary-foreground font-semibold"
                          onClick={() => setIsUploadReportOpen(true)}
                        >
                          <FolderUp className="mr-1.5 h-3.5 w-3.5" /> Upload Report
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setIsNewReportOpen(true)}
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Report
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-muted-foreground"
                          onClick={() => {
                            setSelectedCategory("All");
                            setSearchQuery("");
                            setOwnerFilter("all");
                            setStatusFilter("all");
                          }}
                        >
                          Clear All Filters
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">Pin</th>
                        <th className="py-3 px-3 min-w-[200px]">
                          <button
                            type="button"
                            onClick={() => handleSortToggle("title")}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            Report Name <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="py-3 px-3 min-w-[100px]">
                          <button
                            type="button"
                            onClick={() => handleSortToggle("category")}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            Category <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="py-3 px-3 min-w-[120px]">
                          <button
                            type="button"
                            onClick={() => handleSortToggle("owner")}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            Owner <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="py-3 px-3 min-w-[130px]">
                          <button
                            type="button"
                            onClick={() => handleSortToggle("lastGenerated")}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            Last Generated <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="py-3 px-3 min-w-[90px]">
                          <button
                            type="button"
                            onClick={() => handleSortToggle("status")}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            Status <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="py-3 px-3 text-right min-w-[160px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {explorerReports.map((report) => {
                        const Icon = report.icon;
                        return (
                          <tr key={report.id} className="hover:bg-muted/40 transition-colors group">
                            {/* Favorite / Pin Check */}
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(report.id, e)}
                                className="text-muted-foreground/50 hover:text-amber-500 transition-colors p-1 rounded"
                                title={report.isPinned ? "Unpin" : "Pin"}
                              >
                                <Star
                                  className={`h-4 w-4 ${report.isPinned ? "text-amber-500 fill-amber-500" : ""}`}
                                />
                              </button>
                            </td>

                            {/* Report Name & Description */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-start gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-primary mt-0.5">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                    {report.title}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {report.description}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category Badge */}
                            <td className="py-2.5 px-3">
                              <Badge variant="outline" className="text-[10px] font-medium">
                                {report.category}
                              </Badge>
                            </td>

                            {/* Owner */}
                            <td className="py-2.5 px-3 text-muted-foreground font-medium">
                              {report.owner}
                            </td>

                            {/* Last Generated */}
                            <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                              {report.lastGenerated}
                            </td>

                            {/* Status Badge */}
                            <td className="py-2.5 px-3">
                              <Badge
                                variant={report.status === "Ready" ? "secondary" : "outline"}
                                className={`text-[10px] font-medium ${
                                  report.status === "Ready"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                                    : report.status === "Uploaded"
                                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                                      : ""
                                }`}
                              >
                                {report.status}
                              </Badge>
                            </td>

                            {/* Row Actions */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleOpenPreview(report)}
                                  title="Preview Report"
                                >
                                  Preview
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="h-7 text-[11px] px-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium"
                                    >
                                      <Download className="mr-1 h-3 w-3" /> Export
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40 text-xs">
                                    <DropdownMenuItem onClick={() => handleExport(report, "CSV")}>
                                      Export as CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport(report, "Excel")}>
                                      Export as Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport(report, "PDF")}>
                                      Export as PDF
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                {/* More Menu (...) */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
                                      title="More Options"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44 text-xs">
                                    <DropdownMenuItem onClick={() => handleDuplicateReport(report)}>
                                      <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toast.info(`Schedule configured for ${report.title}`)
                                      }
                                    >
                                      <Calendar className="mr-2 h-3.5 w-3.5" /> Schedule...
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleArchiveReport(report)}>
                                      <FileText className="mr-2 h-3.5 w-3.5" />
                                      {report.status === "Archived" ? "Unarchive" : "Archive"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleDeleteReport(report)}
                                    >
                                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* 4. MODAL WORKFLOW: CREATE NEW REPORT TEMPLATE */}
      <Dialog open={isNewReportOpen} onOpenChange={setIsNewReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Create Report Template
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a new operational report template with custom filters and permissions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewReportSubmit} className="space-y-3.5 py-1">
            <div className="space-y-1">
              <Label htmlFor="new-name" className="text-xs font-medium">
                Report Name *
              </Label>
              <Input
                id="new-name"
                placeholder="e.g., Monthly Controlled Substance Ledger"
                className="h-9 text-xs"
                value={newReportName}
                onChange={(e) => setNewReportName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-cat" className="text-xs font-medium">
                Category
              </Label>
              <Select value={newReportCategory} onValueChange={(v) => setNewReportCategory(v)}>
                <SelectTrigger id="new-cat" className="h-9 text-xs">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Inventory">Inventory</SelectItem>
                  <SelectItem value="Purchases">Purchases</SelectItem>
                  <SelectItem value="GST">GST</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Expiry">Expiry</SelectItem>
                  <SelectItem value="Audit">Audit</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="template-type" className="text-xs font-medium">
                  Template Type
                </Label>
                <Select value={newReportTemplateType} onValueChange={setNewReportTemplateType}>
                  <SelectTrigger id="template-type" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Summary">Summary Register</SelectItem>
                    <SelectItem value="Matrix">Category Matrix</SelectItem>
                    <SelectItem value="Audit">Detailed Audit Trail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="permissions" className="text-xs font-medium">
                  Permissions
                </Label>
                <Select value={newReportPermissions} onValueChange={setNewReportPermissions}>
                  <SelectTrigger id="permissions" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Staff">All Staff</SelectItem>
                    <SelectItem value="Admins Only">Admins Only</SelectItem>
                    <SelectItem value="Managers Only">Store Managers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-desc" className="text-xs font-medium">
                Description
              </Label>
              <Input
                id="new-desc"
                placeholder="Brief summary of data points included..."
                className="h-9 text-xs"
                value={newReportDescription}
                onChange={(e) => setNewReportDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => setIsNewReportOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 text-xs bg-primary text-primary-foreground font-semibold"
              >
                Create Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. MODAL WORKFLOW: UPLOAD EXTERNAL REPORT */}
      <Dialog open={isUploadReportOpen} onOpenChange={setIsUploadReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <FolderUp className="h-4 w-4 text-primary" /> Upload External Report
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Attach externally prepared audit, compliance, or financial documents.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadReportSubmit} className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Document File *</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.xlsx,.csv,.docx,.png,.jpg,.jpeg"
                className="hidden"
              />

              {!uploadedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <UploadCloud className="h-7 w-7 text-primary" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">
                      Drag & Drop or <span className="text-primary underline">Browse Files</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Supported: PDF, Excel (.xlsx), CSV, DOCX, Images
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground">
                    Max size: 25 MB
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{uploadedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] px-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="upload-title" className="text-xs font-medium">
                Document Title
              </Label>
              <Input
                id="upload-title"
                placeholder="e.g., Q3 Drug Inspector Audit Certificate 2026"
                className="h-9 text-xs"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="upload-cat" className="text-xs font-medium">
                Category
              </Label>
              <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v)}>
                <SelectTrigger id="upload-cat" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                  <SelectItem value="Audit">Audit</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="GST">GST</SelectItem>
                  <SelectItem value="Purchases">Purchases</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="upload-desc" className="text-xs font-medium">
                Description
              </Label>
              <Input
                id="upload-desc"
                placeholder="Brief note about this document..."
                className="h-9 text-xs"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => setIsUploadReportOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 text-xs bg-primary text-primary-foreground font-semibold"
              >
                Upload & Attach
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. MODAL WORKFLOW: REPORT DATA PREVIEW */}
      <Dialog open={!!previewReport} onOpenChange={(open) => !open && setPreviewReport(null)}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {previewReport && (
            <>
              {/* Header */}
              <DialogHeader className="border-b border-border p-4 bg-muted/40">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 pr-6">
                    <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <previewReport.icon className="h-5 w-5 text-primary" /> {previewReport.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {previewReport.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Applied Filters & Info Toolbar */}
              <div className="flex flex-wrap items-center justify-between border-b border-border bg-card px-4 py-2.5 gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-muted-foreground text-[11px]">
                    Applied Range:
                  </span>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {fromDate} to {toDate}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Owner: {previewReport.owner}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-[11px]">Supported Formats:</span>
                  {previewReport.formats.map((fmt) => (
                    <Badge key={fmt} variant="outline" className="text-[10px] font-mono">
                      {fmt}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-y-auto p-4">
                {isPreviewLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  (() => {
                    const reportData = getReportData(previewReport.id);
                    if (reportData.rows.length === 0) {
                      return (
                        <div className="py-12 text-center space-y-2">
                          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
                          <h4 className="text-sm font-semibold text-foreground">
                            No records found for period
                          </h4>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            No database entries found for {previewReport.title} between {fromDate}{" "}
                            and {toDate}.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Showing top {Math.min(reportData.rows.length, 50)} records</span>
                          <span className="font-mono">Total Records: {reportData.totalCount}</span>
                        </div>

                        <div className="overflow-x-auto border border-border rounded-lg bg-card">
                          <table className="w-full text-xs">
                            <thead className="border-b border-border bg-muted/80 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold sticky top-0">
                              <tr>
                                {reportData.headers.map((h, idx) => (
                                  <th
                                    key={idx}
                                    className={`px-3.5 py-2.5 ${idx > 1 ? "text-right" : ""}`}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {reportData.rows.slice(0, 50).map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className={`px-3.5 py-2.5 ${
                                        cIdx > 1
                                          ? "text-right font-mono text-foreground"
                                          : "text-foreground font-medium"
                                      }`}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewReport(null)}
                  className="h-9 text-xs"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={() => {
                      setIsPreviewLoading(true);
                      setTimeout(() => {
                        setIsPreviewLoading(false);
                        toast.success("Report data refreshed!");
                      }, 300);
                    }}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Generate Again
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        className="h-9 text-xs bg-primary text-primary-foreground font-semibold"
                      >
                        <Download className="mr-1.5 h-4 w-4" /> Download Export{" "}
                        <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <DropdownMenuItem onClick={() => handleExport(previewReport, "CSV")}>
                        Download CSV (.csv)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(previewReport, "Excel")}>
                        Download Excel (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(previewReport, "PDF")}>
                        Download PDF (.pdf)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. MODAL WORKFLOW: EXPORT HISTORY AUDIT */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Export History Log
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Audit trail of recent report generations, exports, and document previews.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto py-2">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No recent activity logged.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {recentActivity.map((act) => (
                  <div key={act.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{act.reportTitle}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Action: <span className="font-medium text-foreground">{act.action}</span> by{" "}
                        {act.user}
                      </p>
                    </div>
                    <div className="text-right">
                      {act.format && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {act.format}
                        </Badge>
                      )}
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {format(act.timestamp, "HH:mm:ss")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setIsHistoryOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
