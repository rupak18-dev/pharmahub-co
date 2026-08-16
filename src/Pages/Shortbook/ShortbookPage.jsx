import { useState, useMemo } from "react";
import {
  Search,
  Info,
  CalendarIcon,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCw,
  User,
  Plus,
  FileText,
  Package,
  Pill,
  BarChart3,
  Building2,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Printer,
  FileSpreadsheet,
  ArrowUpDown,
  PieChart as PieChartIcon,
  X,
  Filter,
  Users,
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/Components/ui/calendar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { Calendar as AntdCalendar, theme } from "antd";

export const handle = { title: "PharmaHub · ShortBook" };

/** Custom SVG Thumbnail Icons for different product types */
function ProductThumbnail({ type = "tablet", name = "" }) {
  const lower = (name || type).toLowerCase();

  if (lower.includes("gel") || lower.includes("cream") || lower.includes("tube")) {
    return (
      <div className="h-9 w-9 shrink-0 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1 shadow-xs">
        <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" className="w-6 h-6">
          <path d="M7 21h10l-2-10H9L7 21z" />
          <path d="M9 11V5a2 2 0 014 0v6" />
          <line x1="9" y1="3" x2="15" y2="3" />
        </svg>
      </div>
    );
  }

  if (
    lower.includes("chocolate") ||
    lower.includes("packet") ||
    lower.includes("bites") ||
    lower.includes("rice")
  ) {
    return (
      <div className="h-9 w-9 shrink-0 rounded bg-amber-50 border border-amber-200 flex items-center justify-center p-1 shadow-xs">
        <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" className="w-6 h-6">
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <line x1="5" y1="9" x2="19" y2="9" />
          <line x1="5" y1="14" x2="19" y2="14" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      </div>
    );
  }

  if (lower.includes("respule") || lower.includes("liquid") || lower.includes("syrup")) {
    return (
      <div className="h-9 w-9 shrink-0 rounded bg-purple-50 border border-purple-200 flex items-center justify-center p-1 shadow-xs">
        <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="w-6 h-6">
          <path d="M10 2v4M14 2v4" />
          <path d="M8 6h8a2 2 0 012 2v10a4 4 0 01-4 4H10a4 4 0 01-4-4V8a2 2 0 012-2z" />
          <line x1="8" y1="12" x2="16" y2="12" strokeDasharray="2 2" />
        </svg>
      </div>
    );
  }

  if (lower.includes("capsule")) {
    return (
      <div className="h-9 w-9 shrink-0 rounded bg-cyan-50 border border-cyan-200 flex items-center justify-center p-1 shadow-xs">
        <svg viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.8" className="w-6 h-6">
          <rect x="6" y="3" width="12" height="18" rx="6" />
          <line x1="6" y1="12" x2="18" y2="12" />
        </svg>
      </div>
    );
  }

  // Default Tablet Strip
  return (
    <div className="h-9 w-9 shrink-0 rounded bg-blue-50 border border-blue-200 flex items-center justify-center p-1 shadow-xs">
      <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" className="w-6 h-6">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8" cy="9.5" r="1.5" />
        <circle cx="16" cy="9.5" r="1.5" />
        <circle cx="8" cy="14.5" r="1.5" />
        <circle cx="16" cy="14.5" r="1.5" />
      </svg>
    </div>
  );
}

const EMPTY_ARRAY = [];

export default function ShortbookPage() {
  const { user } = useAuth();
  const { token } = theme.useToken();

  // Load state from DB
  const rawShortbook = useDb((d) => d?.shortbook) ?? EMPTY_ARRAY;
  const medicines = useDb((d) => d?.medicines) ?? EMPTY_ARRAY;
  const suppliers = useDb((d) => d?.suppliers) ?? EMPTY_ARRAY;

  // Mode View: 'classical' (exact screenshot table) vs 'graphical'
  const [viewMode, setViewMode] = useState("classical");

  // Search & Add Item state
  const [addNewQuery, setAddNewQuery] = useState("");
  const [showAddNewDropdown, setShowAddNewDropdown] = useState(false);

  // Filters State List
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [distributorFilter, setDistributorFilter] = useState("all");
  const [manufFilter, setManufFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // Working Date Range State (Default range: 2025-01-26 to 2025-02-01 matching screenshot)
  const [startDate, setStartDate] = useState("2025-01-26");
  const [endDate, setEndDate] = useState("2025-02-01");
  const [dateRangePreset, setDateRangePreset] = useState("default");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  // Column Sorting State
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // Modals & Popovers state
  const [autoPoDialogOpen, setAutoPoDialogOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState(null);

  // Table selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Unique Distributors list for filter dropdown
  const uniqueDistributors = useMemo(() => {
    const set = new Set();
    rawShortbook.forEach((item) => {
      if (item.distributorName) set.add(item.distributorName);
    });
    return Array.from(set);
  }, [rawShortbook]);

  // Unique Manufacturers list for filter dropdown
  const uniqueManufacturers = useMemo(() => {
    const set = new Set();
    rawShortbook.forEach((item) => {
      if (item.manuf) set.add(item.manuf);
    });
    return Array.from(set);
  }, [rawShortbook]);

  // Active Applied Filters Count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (priorityFilter !== "all") count++;
    if (sourceFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (distributorFilter !== "all") count++;
    if (manufFilter !== "all") count++;
    if (stockFilter !== "all") count++;
    if (tableSearchQuery.trim()) count++;
    return count;
  }, [
    priorityFilter,
    sourceFilter,
    statusFilter,
    distributorFilter,
    manufFilter,
    stockFilter,
    tableSearchQuery,
  ]);

  // Reset All Filters Handler
  const handleResetAllFilters = () => {
    setPriorityFilter("all");
    setSourceFilter("all");
    setStatusFilter("all");
    setDistributorFilter("all");
    setManufFilter("all");
    setStockFilter("all");
    setTableSearchQuery("");
    toast.success("All filters cleared");
  };

  // Sort handler
  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      toast.info(`Sorted by ${col} (${sortDirection === "asc" ? "Descending" : "Ascending"})`);
    } else {
      setSortColumn(col);
      setSortDirection("asc");
      toast.info(`Sorted by ${col} (Ascending)`);
    }
  };

  // Date Range Quick Preset Handler
  const handlePresetSelect = (preset) => {
    setDateRangePreset(preset);
    const now = new Date();
    const formatDate = (d) => d.toISOString().slice(0, 10);

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      toast.success("Showing items from All Dates");
    } else if (preset === "today") {
      const todayStr = formatDate(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
      toast.success("Date filter set to Today");
    } else if (preset === "last7") {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(now));
      toast.success("Date filter set to Last 7 Days");
    } else if (preset === "last30") {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(now));
      toast.success("Date filter set to Last 30 Days");
    } else if (preset === "default") {
      setStartDate("2025-01-26");
      setEndDate("2025-02-01");
      toast.success("Date filter set to 26/01/2025 - 01/02/2025");
    }
    setDatePopoverOpen(false);
  };

  // Antd Calendar range pick: first click sets start, next later click sets end, click again restarts
  const onCalendarSelect = (day) => {
    const val = day.format("YYYY-MM-DD");
    setDateRangePreset("custom");
    if (!startDate || !endDate) {
      if (!startDate || val < startDate) {
        setStartDate(val);
        setEndDate("");
      } else {
        setEndDate(val);
      }
    } else {
      setStartDate(val);
      setEndDate("");
    }
  };

  // Format Date Range string for button label
  const formattedDateRangeLabel = useMemo(() => {
    if (!startDate && !endDate) return "All Dates";

    const formatDisplay = (isoStr) => {
      if (!isoStr) return "";
      const parts = isoStr.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return isoStr;
    };

    if (startDate && endDate) {
      return `${formatDisplay(startDate)} - ${formatDisplay(endDate)}`;
    }
    if (startDate) return `From ${formatDisplay(startDate)}`;
    if (endDate) return `Until ${formatDisplay(endDate)}`;

    return "26/01/2025 - 01/02/2025";
  }, [startDate, endDate]);

  // Filtered & Sorted Shortbook items
  const sortedItems = useMemo(() => {
    let items = rawShortbook.filter((item) => {
      // Text Search Filter
      if (tableSearchQuery.trim()) {
        const q = tableSearchQuery.toLowerCase();
        const matchName = item.itemName?.toLowerCase().includes(q);
        const matchManuf = item.manuf?.toLowerCase().includes(q);
        const matchDist = item.distributorName?.toLowerCase().includes(q);
        if (!matchName && !matchManuf && !matchDist) return false;
      }

      // Priority Filter
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;

      // Source Filter
      if (sourceFilter !== "all" && item.source?.toLowerCase() !== sourceFilter.toLowerCase())
        return false;

      // Status Filter
      if (statusFilter !== "all" && item.status?.toLowerCase() !== statusFilter.toLowerCase())
        return false;

      // Distributor Filter
      if (distributorFilter !== "all" && item.distributorName !== distributorFilter) return false;

      // Manufacturer Filter
      if (manufFilter !== "all" && item.manuf !== manufFilter) return false;

      // Stock Level Filter
      if (stockFilter === "outOfStock" && item.stock > 0) return false;
      if (stockFilter === "inStock" && item.stock === 0) return false;

      // Date Range Filter
      if (startDate || endDate) {
        let itemMs = 0;
        if (item.dateIso) {
          itemMs = new Date(item.dateIso).getTime();
        } else if (item.date) {
          itemMs = new Date().getTime();
        }

        if (itemMs) {
          if (startDate) {
            const startMs = new Date(startDate).setHours(0, 0, 0, 0);
            if (itemMs < startMs) return false;
          }
          if (endDate) {
            const endMs = new Date(endDate).setHours(23, 59, 59, 999);
            if (itemMs > endMs) return false;
          }
        }
      }

      return true;
    });

    if (sortColumn) {
      items.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [
    rawShortbook,
    tableSearchQuery,
    priorityFilter,
    sourceFilter,
    statusFilter,
    distributorFilter,
    manufFilter,
    stockFilter,
    startDate,
    endDate,
    sortColumn,
    sortDirection,
  ]);

  // Chart Data Aggregations
  const distributorChartData = useMemo(() => {
    const counts = {};
    sortedItems.forEach((item) => {
      const name = item.distributorName ? item.distributorName.split(" ")[0] : "Other";
      counts[name] = (counts[name] || 0) + (Number(item.qty) || 1);
    });
    return Object.entries(counts).map(([name, qty]) => ({ name, qty }));
  }, [sortedItems]);

  const priorityChartData = useMemo(() => {
    const high = sortedItems.filter((i) => i.priority === "high").length;
    const low = sortedItems.filter((i) => i.priority === "low").length;
    return [
      { name: "High Priority", value: high, color: "#EF4444" },
      { name: "Low Priority", value: low, color: "#10B981" },
    ];
  }, [sortedItems]);

  const manufChartData = useMemo(() => {
    const counts = {};
    sortedItems.forEach((item) => {
      const mfr = item.manuf || "GENERIC";
      counts[mfr] = (counts[mfr] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [sortedItems]);

  // Medicines matching search for "Add new item from here"
  const addableMedicines = useMemo(() => {
    if (!addNewQuery.trim()) return [];
    const q = addNewQuery.toLowerCase();
    return medicines
      .filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.genericName?.toLowerCase().includes(q) ||
          m.barcode?.includes(q),
      )
      .slice(0, 6);
  }, [addNewQuery, medicines]);

  // Toggle selection for individual item
  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Select / Deselect all
  const toggleSelectAll = () => {
    if (selectedIds.length === sortedItems.length) {
      setSelectedIds([]);
      toast.info("Deselected all items");
    } else {
      setSelectedIds(sortedItems.map((item) => item.id));
      toast.success(`Selected all ${sortedItems.length} items`);
    }
  };

  // Add Item to Shortbook
  const handleAddItem = (med) => {
    const defaultDistributor = suppliers[0]?.name || "Mahaveer Medi Sales Private Limited";
    const defaultCity = "Bangalore";

    const newItem = {
      id: db.uid(),
      date:
        new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" }) +
        " " +
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      dateIso: new Date().toISOString(),
      itemName: med.name,
      itemSubtitle: med.packSize || "1 Strip of 10 Tablet",
      distributorName: defaultDistributor,
      distributorCity: defaultCity,
      manuf: med.prefix || "PHARM",
      priority: "high",
      min: med.reorderThreshold || 1,
      stock: 0,
      qty: 1,
      status: "Pending",
      source: "Shortbook",
      reqByBadge: 1,
    };

    db.set((d) => {
      d.shortbook = [newItem, ...(d.shortbook || [])];
    });

    setAddNewQuery("");
    setShowAddNewDropdown(false);
    toast.success(`Added ${med.name} to Shortbook`);
  };

  // Custom Item Add
  const handleAddCustomItem = () => {
    if (!addNewQuery.trim()) return;
    const newItem = {
      id: db.uid(),
      date:
        new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" }) +
        " " +
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      dateIso: new Date().toISOString(),
      itemName: addNewQuery.trim(),
      itemSubtitle: "1 Unit",
      distributorName: suppliers[0]?.name || "Mahaveer Medi Sales Private Limited",
      distributorCity: "Bangalore",
      manuf: "GENERIC",
      priority: "high",
      min: 1,
      stock: 0,
      qty: 1,
      status: "Pending",
      source: "Shortbook",
      reqByBadge: 1,
    };

    db.set((d) => {
      d.shortbook = [newItem, ...(d.shortbook || [])];
    });

    setAddNewQuery("");
    setShowAddNewDropdown(false);
    toast.success(`Added "${newItem.itemName}" to Shortbook`);
  };

  // Delete Item
  const handleDeleteItem = (id) => {
    db.set((d) => {
      d.shortbook = (d.shortbook || []).filter((i) => i.id !== id);
    });
    toast.success("Item removed from Shortbook");
  };

  // Re-order / Sync Item
  const handleReorderItem = (item) => {
    toast.info(`Re-order requested for ${item.itemName} (${item.qty} Qty)`);
  };

  // Generate Auto PO for Distributors
  const handleGenerateAutoPO = () => {
    const pendingItems = rawShortbook.filter((i) => i.status === "Pending");
    if (pendingItems.length === 0) {
      toast.error("No pending items available in Shortbook to generate Purchase Orders");
      return;
    }

    const grouped = {};
    pendingItems.forEach((item) => {
      const dist = item.distributorName || "Default Distributor";
      if (!grouped[dist]) grouped[dist] = [];
      grouped[dist].push(item);
    });

    const createdPOs = [];
    const now = new Date().toISOString();

    db.set((d) => {
      Object.entries(grouped).forEach(([distName, itemsList]) => {
        const poNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;
        const supplier = d.suppliers?.find((s) => s.name === distName) || d.suppliers?.[0];

        const po = {
          id: db.uid(),
          poNumber,
          supplierId: supplier?.id || "sup-default",
          supplierName: distName,
          status: "placed",
          items: itemsList.map((it) => ({
            medicineName: it.itemName,
            quantity: it.qty,
            estimatedPrice: 100,
          })),
          totalEstimatedValue: itemsList.reduce((sum, it) => sum + it.qty * 100, 0),
          createdAt: now,
          createdBy: user?.id || "system",
        };

        d.purchaseOrders.unshift(po);
        createdPOs.push(poNumber);
      });

      (d.shortbook || []).forEach((item) => {
        if (item.status === "Pending") {
          item.status = "PO Created";
        }
      });
    });

    setAutoPoDialogOpen(false);
    toast.success(`Generated ${createdPOs.length} Purchase Order(s): ${createdPOs.join(", ")}`);
  };

  // PDF Export
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("ShortBook Order List", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

      const tableData = sortedItems.map((item, index) => [
        index + 1,
        item.date,
        item.itemName,
        item.distributorName,
        item.manuf,
        item.priority?.toUpperCase(),
        item.min,
        item.stock,
        item.qty,
        item.status,
      ]);

      doc.autoTable({
        startY: 28,
        head: [
          [
            "#",
            "Date",
            "Item Name",
            "Distributor",
            "Manuf.",
            "Priority",
            "Min",
            "Stock",
            "Qty",
            "Status",
          ],
        ],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [15, 58, 112] },
      });

      doc.save(`Shortbook_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Shortbook PDF downloaded successfully");
    } catch {
      toast.error("Failed to generate PDF export");
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Item Name",
      "Pack Size",
      "Distributor",
      "Location",
      "Manufacturer",
      "Priority",
      "Min Stock",
      "Current Stock",
      "Qty",
      "Status",
      "Source",
    ];
    const rows = sortedItems.map((item) => [
      `"${item.date}"`,
      `"${item.itemName}"`,
      `"${item.itemSubtitle}"`,
      `"${item.distributorName}"`,
      `"${item.distributorCity}"`,
      `"${item.manuf}"`,
      `"${item.priority}"`,
      item.min,
      item.stock,
      item.qty,
      `"${item.status}"`,
      `"${item.source}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Shortbook_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Shortbook CSV downloaded successfully");
  };

  // Grouped items count for Auto PO
  const autoPoGrouped = useMemo(() => {
    const pendingItems = rawShortbook.filter((i) => i.status === "Pending");
    const map = {};
    pendingItems.forEach((item) => {
      const dist = item.distributorName || "Default Distributor";
      if (!map[dist]) map[dist] = [];
      map[dist].push(item);
    });
    return map;
  }, [rawShortbook]);

  // Table Header Sort Button Helper
  const renderSortHeader = (label, colKey, align = "left", infoText = null) => {
    const isActive = sortColumn === colKey;
    return (
      <th
        className={`py-2.5 px-3 font-bold tracking-tight select-none ${align === "center" ? "text-center" : "text-left"}`}
      >
        <div
          className={`inline-flex items-center gap-1 group ${align === "center" ? "justify-center mx-auto" : ""}`}
        >
          <button
            type="button"
            onClick={() => handleSort(colKey)}
            className="flex items-center gap-1 hover:text-emerald-700 focus:outline-none font-bold"
            title={`Sort by ${label}`}
          >
            <span className={isActive ? "text-emerald-700 font-extrabold" : "text-slate-800"}>{label}</span>
            {isActive ? (
              sortDirection === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5 text-emerald-600 font-bold" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5 text-emerald-600 font-bold" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            )}
          </button>

          {infoText && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="text-slate-400 hover:text-emerald-600 p-0.5 rounded focus:outline-none transition-colors cursor-pointer"
                  title={`Click for ${label} details`}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-64 bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl space-y-1 z-50">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <Info className="h-3.5 w-3.5 text-emerald-400" /> {label} Details
                </div>
                <p className="text-slate-200 leading-snug">{infoText}</p>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </th>
    );
  };
  return (
    <div className="space-y-4 pb-12 select-none font-google-sans-flex text-slate-800">
      {/* TOP HEADER / BAR */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs border border-border/50">
        
        {/* Left Side: ShortBook Title + Info + Mode Switch */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-extrabold text-xl text-slate-900 tracking-tight">
            <span>ShortBook</span>
            <button
              onClick={() => toast.info("Shortbook lists medicines with low stock or required for re-ordering.")}
              className="text-emerald-600 hover:text-emerald-700 transition-colors focus:outline-none cursor-pointer"
            >
              <Info className="h-4 w-4 fill-emerald-600/10" />
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setViewMode("graphical")}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === "graphical"
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Graphical
            </button>

            <button
              onClick={() => setViewMode(viewMode === "classical" ? "graphical" : "classical")}
              className="px-1 focus:outline-none cursor-pointer"
              title="Toggle View Mode"
            >
              <div className="w-8 h-4 bg-emerald-600 rounded-full relative p-0.5 transition-colors">
                <div
                  className={`w-3 h-3 bg-white rounded-full transition-transform ${
                    viewMode === "classical" ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
            </button>

            <button
              onClick={() => setViewMode("classical")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                viewMode === "classical"
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Classical
            </button>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAutoPoDialogOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-1.5 rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Auto PO
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1 cursor-pointer"
              >
                <span>Download</span>
                <ChevronDown className="h-3.5 w-3.5 text-emerald-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs">
              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer gap-2">
                <FileText className="h-4 w-4 text-red-500" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Download Excel/CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()} className="cursor-pointer gap-2">
                <Printer className="h-4 w-4 text-slate-600" />
                Print List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* MAIN CONTENT CARD (SEARCH, FILTERS, CHIPS & TABLE) */}
      <div className="bg-white rounded-xl overflow-hidden">
        {/* SEARCH AND FILTER BAR ROW */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: "Add new item from here" Input */}
        <div className="relative min-w-[280px] sm:min-w-[340px]">
          <div className="relative flex items-center">
            <Input
              placeholder="Add new item from here"
              value={addNewQuery}
              onChange={(e) => {
                setAddNewQuery(e.target.value);
                setShowAddNewDropdown(true);
              }}
              onFocus={() => setShowAddNewDropdown(true)}
              className="h-9 pr-9 text-xs bg-slate-50 border-slate-200 placeholder:text-slate-400 focus:bg-white transition-colors"
            />
            <Search className="absolute right-2.5 h-4 w-4 text-emerald-600 pointer-events-none" />
          </div>

          {/* Add New Item Dropdown */}
          {showAddNewDropdown && addNewQuery.trim() !== "" && (
            <div className="absolute left-0 right-0 top-10 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {addableMedicines.map((med) => (
                <button
                  key={med.id}
                  onClick={() => handleAddItem(med)}
                  className="w-full px-3 py-2 text-left hover:bg-emerald-50 flex items-center justify-between text-xs transition-colors group cursor-pointer"
                >
                  <div>
                    <div className="font-medium text-slate-900 group-hover:text-emerald-700">{med.name}</div>
                    <div className="text-[11px] text-slate-500">{med.packSize || med.genericName || "1 Strip"}</div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                    + Add
                  </span>
                </button>
              ))}

              <button
                onClick={handleAddCustomItem}
                className="w-full px-3 py-2.5 text-left bg-slate-50 hover:bg-emerald-100/50 flex items-center gap-2 text-xs text-emerald-700 font-semibold transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add custom item "{addNewQuery}"
              </button>
            </div>
          )}
        </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[220px] sm:min-w-[260px]">
              <Input
                placeholder="Search by Item, Manf., Distributor"
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="h-9 pr-8 text-xs bg-slate-50 border-slate-200 placeholder:text-slate-400"
              />
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

          <Button
            onClick={() => toast.info(`Filtered results for "${tableSearchQuery}"`)}
            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Search</span>
            <span className="text-sm font-light">↵</span>
          </Button>

          {/* CALENDAR DATE RANGE SELECTOR */}
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-9 px-3 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-md text-xs font-medium text-slate-700 flex items-center gap-2 shadow-2xs cursor-pointer transition-all focus:outline-none"
                title="Click to select Date Range"
              >
                <span className="text-slate-800 font-semibold">{formattedDateRangeLabel}</span>
                <CalendarIcon className="h-3.5 w-3.5 text-emerald-600 ml-1" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto bg-white p-3 rounded-xl border border-slate-200 shadow-xl z-50">
              {/* Header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                  Select Date Range
                </div>
                <button
                  onClick={() => setDatePopoverOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

                {/* Clean Calendar — no outside days */}
                <CalendarComponent
                  mode="range"
                  showOutsideDays={false}
                  captionLayout="dropdown"
                  selected={{
                    from: startDate ? new Date(startDate) : undefined,
                    to: endDate ? new Date(endDate) : undefined,
                  }}
                  onSelect={(range) => {
                    setStartDate(range?.from ? range.from.toISOString().slice(0, 10) : "");
                    setEndDate(range?.to ? range.to.toISOString().slice(0, 10) : "");
                    setDateRangePreset("custom");
                  }}
                  numberOfMonths={1}
                  className="rounded-lg"
                />

              {/* Footer actions */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setDateRangePreset("all");
                    toast.success("Date filter cleared — showing all dates");
                    setDatePopoverOpen(false);
                  }}
                  className="text-xs text-slate-500 hover:text-red-600 font-medium cursor-pointer"
                >
                  Clear Filter
                </button>
                <Button
                  size="sm"
                  onClick={() => {
                    setDatePopoverOpen(false);
                    toast.success(`Date filter applied: ${formattedDateRangeLabel}`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1 cursor-pointer"
                >
                  Apply Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>


          {/* MORE FILTERS POPOVER LIST */}
          <Popover open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`h-9 text-xs font-medium px-3 rounded-md border-slate-200 flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeFiltersCount > 0
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-semibold shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
                <span>More Filters ({activeFiltersCount})</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-88 bg-white p-4 rounded-xl border border-slate-200 shadow-xl space-y-4 text-xs z-50 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4 text-emerald-600" />
                  Filter Options List
                  {activeFiltersCount > 0 && (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {activeFiltersCount} Active
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setMoreFiltersOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Priority Filter */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Order Priority
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setPriorityFilter("all")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      priorityFilter === "all"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setPriorityFilter("high")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      priorityFilter === "high"
                        ? "bg-red-50 border-red-400 text-red-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    ↑ High
                  </button>
                  <button
                    onClick={() => setPriorityFilter("low")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      priorityFilter === "low"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    ↓ Low
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Item Status
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      statusFilter === "all"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("pending")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      statusFilter === "pending"
                        ? "bg-amber-50 border-amber-400 text-amber-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setStatusFilter("po created")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      statusFilter === "po created"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    PO Created
                  </button>
                </div>
              </div>

              {/* Source Filter */}
              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Requirement Source
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setSourceFilter("all")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      sourceFilter === "all"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSourceFilter("shortbook")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      sourceFilter === "shortbook"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Shortbook
                  </button>
                  <button
                    onClick={() => setSourceFilter("inventory")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      sourceFilter === "inventory"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Inventory
                  </button>
                </div>
              </div>

              {/* Distributor Filter */}
              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Distributor Supplier
                </Label>
                <select
                  value={distributorFilter}
                  onChange={(e) => setDistributorFilter(e.target.value)}
                  className="w-full h-8 bg-slate-50 border border-slate-200 rounded px-2 text-xs font-medium focus:bg-white cursor-pointer"
                >
                  <option value="all">All Distributors ({uniqueDistributors.length})</option>
                  {uniqueDistributors.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manufacturer Code Filter */}
              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Manufacturer Code
                </Label>
                <select
                  value={manufFilter}
                  onChange={(e) => setManufFilter(e.target.value)}
                  className="w-full h-8 bg-slate-50 border border-slate-200 rounded px-2 text-xs font-medium focus:bg-white cursor-pointer"
                >
                  <option value="all">All Manufacturers ({uniqueManufacturers.length})</option>
                  {uniqueManufacturers.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Level Filter */}
              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Current Stock Availability
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setStockFilter("all")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      stockFilter === "all"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStockFilter("outOfStock")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      stockFilter === "outOfStock"
                        ? "bg-red-50 border-red-400 text-red-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Stock = 0
                  </button>
                  <button
                    onClick={() => setStockFilter("inStock")}
                    className={`py-1.5 px-2.5 rounded text-center font-medium border text-xs transition-all cursor-pointer ${
                      stockFilter === "inStock"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Stock &gt; 0
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="text-xs text-slate-500 hover:text-red-600 font-medium cursor-pointer"
                >
                  Reset All Filters
                </button>
                <Button
                  size="sm"
                  onClick={() => {
                    setMoreFiltersOpen(false);
                    toast.success(`Filters applied (${activeFiltersCount} active)`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1 cursor-pointer"
                >
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ACTIVE FILTERS CHIPS BAR */}
      {activeFiltersCount > 0 && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-4 py-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-emerald-900 flex items-center gap-1 text-[11px]">
            <Filter className="h-3.5 w-3.5 text-emerald-600" /> Active Filters:
          </span>

          {priorityFilter !== "all" && (
            <span className="bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
              Priority: <strong className="capitalize">{priorityFilter}</strong>
              <button onClick={() => setPriorityFilter("all")} className="hover:text-red-600 cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {statusFilter !== "all" && (
            <span className="bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
              Status: <strong className="capitalize">{statusFilter}</strong>
              <button onClick={() => setStatusFilter("all")} className="hover:text-red-600 cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {sourceFilter !== "all" && (
            <span className="bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
              Source: <strong className="capitalize">{sourceFilter}</strong>
              <button onClick={() => setSourceFilter("all")} className="hover:text-red-600 cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {distributorFilter !== "all" && (
            <span className="bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
              Distributor: <strong>{distributorFilter}</strong>
              <button onClick={() => setDistributorFilter("all")} className="hover:text-red-600 cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {manufFilter !== "all" && (
            <span className="bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
              Manuf: <strong>{manufFilter}</strong>
              <button onClick={() => setManufFilter("all")} className="hover:text-red-600 cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {stockFilter !== "all" && (
            <span className="bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
              Stock: <strong>{stockFilter === "outOfStock" ? "Stock = 0" : "Stock > 0"}</strong>
              <button onClick={() => setStockFilter("all")} className="hover:text-red-600 cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {tableSearchQuery.trim() && (
            <span className="bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
              Search: <strong>"{tableSearchQuery}"</strong>
              <button onClick={() => setTableSearchQuery("")} className="hover:text-red-600 cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleResetAllFilters}
            className="text-red-600 hover:underline font-semibold text-[11px] ml-auto cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* GRAPHICAL REPRESENTATION PAGE VIEW */}
      {viewMode === "graphical" && (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in-50 duration-200">
          
          {/* Header banner for Graphical View */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#007A87]/10 text-[#007A87] flex items-center justify-center">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Graphical Representation & Order Analytics</h2>
                <p className="text-xs text-slate-500">Visual order breakdown, distributor demands, priority splits, and manufacturer stats</p>
              </div>
            </div>

          </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Items
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{sortedItems.length}</div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Required Quantity
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {sortedItems.reduce((sum, i) => sum + (Number(i.qty) || 0), 0)}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Pill className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    High Priority
                  </div>
                  <div className="text-2xl font-bold text-red-600 mt-1">
                    {sortedItems.filter((i) => i.priority === "high").length}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <ArrowUp className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Est. PO Value
                  </div>
                  <div className="text-2xl font-bold text-blue-700 mt-1">
                    ₹
                    {sortedItems
                      .reduce((sum, i) => sum + (Number(i.qty) || 0) * 100, 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#007A87]" />
                  Required Quantity by Distributor
                </h4>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributorChartData}>
                      <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="qty" fill="#007A87" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-red-500" />
                  Order Priority Breakdown
                </h4>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {priorityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Shortbook Items Distribution by Manufacturer Code
              </h4>
              <div className="h-60 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={manufChartData}>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cards Grid Overview */}
            <div className="mt-6">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Item Cards Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <ProductThumbnail name={item.itemName} />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{item.itemName}</h4>
                          <p className="text-xs text-slate-500">{item.itemSubtitle}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          item.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {item.priority === "high" ? "↑ High" : "↓ Low"}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">Distributor:</span>
                        <span className="font-semibold text-slate-800">{item.distributorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">Min / Stock / Qty:</span>
                        <span className="font-mono font-semibold text-slate-900">
                          Min: {item.min} | Stock: {item.stock} |{" "}
                          <span className="text-blue-600">Qty: {item.qty}</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                        {item.status}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleReorderItem(item)}
                          className="p-1 text-slate-400 hover:text-blue-600"
                          title="Re-order"
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* CLASSICAL VIEW TABLE */}
      {viewMode === "classical" && (
        <div className="w-full overflow-x-auto border-b border-slate-200">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            {/* Table Headers */}
            <thead>
              <tr className="bg-emerald-900/10 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold uppercase text-[11px] tracking-wide border-b border-emerald-200 dark:border-emerald-900 select-none">
                
                {/* Select All Checkbox */}
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={sortedItems.length > 0 && selectedIds.length === sortedItems.length}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer"
                    title="Select / Deselect All Items"
                  />
                </th>

                  {/* Date Header */}
                  {renderSortHeader("Date", "dateIso")}

                  {/* Items Header */}
                  {renderSortHeader("Items", "itemName")}

                  {/* Distributor Header */}
                  {renderSortHeader("Distributor", "distributorName")}

                  {/* Manuf Header */}
                  {renderSortHeader("Manuf.", "manuf")}

                  {/* Priority Header */}
                  {renderSortHeader("Priority", "priority")}

                  {/* Min. Header (With Interactive Info Popover) */}
                  {renderSortHeader(
                    "Min.",
                    "min",
                    "center",
                    "Minimum stock threshold required for this medicine. When inventory stock drops below or equals Min., items are auto-flagged in Shortbook.",
                  )}

                  {/* Stock Header */}
                  {renderSortHeader("Stock", "stock", "center")}

                  {/* Qty Header */}
                  {renderSortHeader("Qty.", "qty", "center")}

                  {/* Status Header */}
                  {renderSortHeader("Status", "status", "center")}

                  {/* Source Header (With Interactive Info Popover) */}
                  {renderSortHeader(
                    "Source",
                    "source",
                    "left",
                    "Requirement source — 'Shortbook' means manually logged by pharmacy staff; 'Inventory' means auto-generated by low-stock threshold triggers.",
                  )}

                {/* Req. By Header (With Popover Details) */}
                <th className="py-2.5 px-3 font-bold tracking-tight text-emerald-900 dark:text-emerald-300 select-none">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 hover:text-emerald-700 focus:outline-none font-bold cursor-pointer"
                        title="Requested By Details"
                      >
                        <Users className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Req. By</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-64 bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl space-y-1 z-50">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                        <Users className="h-3.5 w-3.5 text-emerald-400" /> Requested By Details
                      </div>
                      <p className="text-slate-200 leading-snug">
                        Indicates staff member or user who initiated the shortbook item entry along with active request badge counts.
                      </p>
                    </PopoverContent>
                  </Popover>
                </th>
              </tr>
            </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-200/70 bg-white text-xs">
                {sortedItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? "bg-emerald-50/40" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                      {/* Date */}
                      <td className="py-3 px-2.5 align-middle text-slate-600 text-xs font-semibold whitespace-nowrap">
                        {item.date?.split(" ")[0]}
                      </td>

                    {/* Items */}
                    <td className="py-3 px-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <ProductThumbnail name={item.itemName} />
                        <div>
                          <div className="flex items-center gap-1 font-semibold text-slate-800 hover:underline cursor-pointer">
                            <span onClick={() => setQuickViewItem(item)}>{item.itemName}</span>
                            <span
                              onClick={() => setQuickViewItem(item)}
                              className="text-emerald-600 font-bold text-[10px] cursor-pointer"
                              title="Product details"
                            >
                              ℹ
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5">{item.itemSubtitle}</div>
                        </div>
                      </div>
                    </td>

                      {/* Distributor */}
                      <td className="py-3 px-3 align-middle leading-tight">
                        <div className="font-semibold text-slate-800">{item.distributorName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.distributorCity}
                        </div>
                      </td>

                      {/* Manuf */}
                      <td className="py-3 px-2.5 align-middle font-bold text-slate-700 uppercase tracking-tight">
                        {item.manuf}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-2.5 align-middle">
                        {item.priority === "high" ? (
                          <div className="flex items-center gap-0.5 text-red-500 font-bold">
                            <span>↑</span>
                            <span>High</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 text-emerald-600 font-medium">
                            <span>↓</span>
                            <span>Low</span>
                          </div>
                        )}
                      </td>

                      {/* Min Column */}
                      <td className="py-3 px-3 text-center align-middle font-mono font-semibold text-slate-700 w-16">
                        {item.min}
                      </td>

                      {/* Stock Column with Vertical Separator */}
                      <td className="py-3 px-3 text-center align-middle w-24">
                        <div className="flex items-center justify-center gap-2 font-mono font-semibold text-slate-800">
                          <span className="text-slate-300 font-light select-none">|</span>
                          <span>{item.stock}</span>
                        </div>
                      </td>

                      {/* Qty Column */}
                      <td className="py-3 px-3 text-center align-middle w-24">
                        <span className="font-mono font-bold text-slate-900">{item.qty}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center align-middle">
                        <span className="text-amber-500 font-semibold text-xs">{item.status}</span>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3 align-middle text-slate-600 font-normal">
                        {item.source}
                      </td>

                    {/* Req. By & Actions */}
                    <td className="py-3 px-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="relative cursor-pointer" title="Requested by user">
                          <div className="h-6 w-6 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          {item.reqByBadge && (
                            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[9px] flex items-center justify-center shadow-xs">
                              {item.reqByBadge}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleReorderItem(item)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors p-0.5 cursor-pointer"
                          title="Re-order Item"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

                {sortedItems.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      No items found matching your date range or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FLOATING HELP BADGE */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => toast.info("Shortbook Help & Support Desk")}
          className="h-8 w-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg hover:bg-emerald-800 hover:scale-105 transition-all cursor-pointer"
          title="Help Desk"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>

      {/* AUTO PO DIALOG */}
      <Dialog open={autoPoDialogOpen} onOpenChange={setAutoPoDialogOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Generate Automatic Purchase Orders
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              System has grouped pending Shortbook items by distributor. Review the summary below to
              auto-generate POs.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3">
            {Object.keys(autoPoGrouped).length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No pending items found for PO generation.
              </p>
            ) : (
              Object.entries(autoPoGrouped).map(([distributor, itemsList]) => (
                <div
                  key={distributor}
                  className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs"
                >
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>{distributor}</span>
                    <span className="text-emerald-700 font-bold">{itemsList.length} Item(s)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Items: {itemsList.map((i) => i.itemName).join(", ")}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoPoDialogOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateAutoPO}
              disabled={Object.keys(autoPoGrouped).length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              Generate {Object.keys(autoPoGrouped).length} Purchase Order(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK VIEW ITEM DIALOG */}
      <Dialog open={!!quickViewItem} onOpenChange={() => setQuickViewItem(null)}>
        {quickViewItem && (
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="h-5 w-5 text-emerald-600" />
                {quickViewItem.itemName}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {quickViewItem.itemSubtitle}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Distributor:</span>
                <span className="font-semibold text-slate-800">
                  {quickViewItem.distributorName} ({quickViewItem.distributorCity})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Manufacturer Code:</span>
                <span className="font-semibold text-slate-800">{quickViewItem.manuf}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Priority Level:</span>
                <span
                  className={`font-semibold ${quickViewItem.priority === "high" ? "text-red-600" : "text-emerald-600"}`}
                >
                  {quickViewItem.priority?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Min. Stock Threshold:</span>
                <span className="font-semibold text-slate-800">{quickViewItem.min}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Current Stock:</span>
                <span className="font-semibold text-slate-800">{quickViewItem.stock}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Order Quantity:</span>
                <span className="font-bold text-emerald-700">{quickViewItem.qty}</span>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" onClick={() => setQuickViewItem(null)} className="text-xs cursor-pointer">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Floating Back to Top button (all screens) ── */}
      <button
        type="button"
        onClick={(e) => {
          // The page scrolls inside the AppLayout div, not window —
          // walk up the DOM to find the first scrollable ancestor and scroll it.
          let el = e.currentTarget?.parentElement;
          while (el && el !== document.body) {
            const overflow = window.getComputedStyle(el).overflowY;
            if (overflow === "auto" || overflow === "scroll") {
              el.scrollTo({ top: 0, behavior: "smooth" });
              return;
            }
            el = el.parentElement;
          }
          // Fallback in case nothing was found
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        aria-label="Back to top"
        className="fixed bottom-6 right-4 z-50 flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-lg transition-all cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        Back to Top
      </button>
    </div>
  );
}
