import { Link, useNavigate } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Plus,
  Minus,
  Trash2,
  Search,
  Receipt,
  Info,
  User,
  Stethoscope,
  Bell,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  ScanLine,
  Camera,
  Keyboard,
  QrCode,
  NotepadText,
  BarChart2,
  CalendarIcon,
  UserPlus,
  History,
  Sparkles,
  Package,
  Printer,
  Share2,
  ChevronRight,
  RotateCcw,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db, genBillNo } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { applyStockMovement, pickBatchesFEFO } from "@/lib/stock";
import { EmptyState } from "@/Components/shared/EmptyState";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Calendar as AntdCalendar } from "antd";
import dayjs from "dayjs";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/Components/ui/calendar";

export const handle = { title: "Sales & POS · PharmaHub" };

function InfoTip({ text }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex cursor-pointer focus:outline-none">
          <Info className="h-3 w-3 text-muted-foreground/70" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto max-w-[200px] px-3 py-2 text-xs leading-snug">
        {text}
      </PopoverContent>
    </Popover>
  );
}

// Preset color palette for stacked bar segments
const ITEM_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

const EMPTY_ARRAY = [];

export default function SalesPage() {
  const auth = useAuth();
  const user = auth?.user;
  const has = usePermission();
  const medicines = useDb((d) => d?.medicines) ?? EMPTY_ARRAY;
  const batches = useDb((d) => d?.batches) ?? EMPTY_ARRAY;
  const sales = useDb((d) => d?.sales) ?? EMPTY_ARRAY;
  const familyRecords = useDb((d) => d?.familyMembers) ?? EMPTY_ARRAY;
  const currency = useDb((d) => d?.settings?.currency) ?? "₹";
  const navigate = useNavigate();

  const [tab, setTab] = useState("history");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Sales History Filters
  const [historySearchType, setHistorySearchType] = useState("billNo");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [historyDatePopoverOpen, setHistoryDatePopoverOpen] = useState(false);
  const [historySortBy, setHistorySortBy] = useState("newest");

  // More Filters state
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [filterDoctorName, setFilterDoctorName] = useState("");
  const [filterEntryBy, setFilterEntryBy] = useState("");
  const [filterPaymentMode, setFilterPaymentMode] = useState("all");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [filterShowVoided, setFilterShowVoided] = useState(false);

  // Billing Form Fields
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [billingFor, setBillingFor] = useState("Self");
  const [billDate, setBillDate] = useState(dayjs());
  const [scanOpen, setScanOpen] = useState(false);
  const [scanReady, setScanReady] = useState(false);
  const [scanMode, setScanMode] = useState("choose");
  const [keyboardScan, setKeyboardScan] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const scannerRef = useRef(null);
  const keyboardRef = useRef(null);

  // Customer Analytics Graph Modal State
  const [graphOpen, setGraphOpen] = useState(false);
  const [graphPatientFilter, setGraphPatientFilter] = useState("All");
  const [searchedCustomer, setSearchedCustomer] = useState("");

  // POS Settings Dialog State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [orderType, setOrderType] = useState("Retail");
  const [sortItemsBy, setSortItemsBy] = useState("Name");
  const [orderFrom, setOrderFrom] = useState("Direct Counter");

  // Family Member Dialog State
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const [familyMemberName, setFamilyMemberName] = useState("");
  const [familyMemberPhone, setFamilyMemberPhone] = useState("");
  const [familyMemberAge, setFamilyMemberAge] = useState("");
  const [familyMemberRelation, setFamilyMemberRelation] = useState("Brother");

  // Checkout Payment
  const [payment, setPayment] = useState("cash");
  const [tender, setTender] = useState("");

  const canCreate = has ? has("sales", "create") : true;

  // Available Family Members for the active customer
  const activeCustomerKey = (customerName || customerQuery || "").trim().toLowerCase();
  const customerFamilyMembers = useMemo(() => {
    if (!activeCustomerKey) return [];
    return (familyRecords || []).filter(
      (fm) =>
        fm &&
        (fm.customerKey === activeCustomerKey ||
          (customerPhone && fm.customerPhone === customerPhone)),
    );
  }, [familyRecords, activeCustomerKey, customerPhone]);

  // Stock per medicine (directly from batches.currentStock)
  const stockByMed = useMemo(() => {
    const map = new Map();
    const now = Date.now();
    (batches || []).forEach((b) => {
      if (!b || b.status === "disposed") return;
      const expTime = b.expiryDate ? new Date(b.expiryDate).getTime() : now + 86400000;
      if (expTime <= now) return;
      map.set(b.medicineId, (map.get(b.medicineId) ?? 0) + (b.currentStock || 0));
    });
    return map;
  }, [batches]);

  // Search auto-complete results
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (medicines || [])
      .filter((m) => m && m.isActive !== false)
      .filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          (m.brandName ?? "").toLowerCase().includes(q) ||
          (m.genericName ?? "").toLowerCase().includes(q) ||
          (m.barcode ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [medicines, query]);

  // Medicines previously purchased by this customer (only when customer name/phone is entered)
  const customerPastPurchases = useMemo(() => {
    const custKey = (searchedCustomer || "").trim().toLowerCase();
    const phoneKey = customerPhone.trim();
    if (!custKey && !phoneKey) return EMPTY_ARRAY;

    const relevantSales = (sales || []).filter((s) => {
      if (!s) return false;
      const sName = (s.customerName || "").trim().toLowerCase();
      const sPhone = (s.customerPhone || "").trim();
      return (custKey && sName.includes(custKey)) || (phoneKey && sPhone.includes(phoneKey));
    });

    const medMap = new Map();
    relevantSales.forEach((s) => {
      s?.items?.forEach((it) => {
        if (!it) return;
        const med = (medicines || []).find((m) => m && m.id === it.medicineId) || {
          id: it.medicineId || "m-def",
          name: it.medicineName || "Medicine",
        };
        if (!med || !med.id) return;
        const prev = medMap.get(med.id) || { med, count: 0, lastQty: it.quantity || 1 };
        medMap.set(med.id, { med, count: prev.count + 1, lastQty: it.quantity || 1 });
      });
    });

    return Array.from(medMap.values());
  }, [sales, medicines, searchedCustomer, customerPhone]);

  // All-time top purchases for the searched customer (highest / most frequent)
  const topPurchases = useMemo(() => {
    const custKey = (searchedCustomer || "").trim().toLowerCase();
    const phoneKey = customerPhone.trim();
    if (!custKey && !phoneKey) return [];

    const relevantSales = (sales || []).filter((s) => {
      if (!s) return false;
      const sName = (s.customerName || "").trim().toLowerCase();
      const sPhone = (s.customerPhone || "").trim();
      return (custKey && sName.includes(custKey)) || (phoneKey && sPhone.includes(phoneKey));
    });

    const medMap = new Map();
    relevantSales.forEach((s) => {
      s?.items?.forEach((it) => {
        if (!it) return;
        const med = (medicines || []).find((m) => m && m.id === it.medicineId) || {
          id: it.medicineId || "m-def",
          name: it.medicineName || "Medicine",
        };
        const key = med.id || it.medicineName || "Medicine";
        const prev = medMap.get(key) || { med, times: 0, totalQty: 0, totalAmount: 0 };
        prev.times += 1;
        prev.totalQty += it.quantity || 1;
        prev.totalAmount += it.lineTotal || (it.unitPrice || 0) * (it.quantity || 1);
        medMap.set(key, prev);
      });
    });

    return Array.from(medMap.values()).sort(
      (a, b) => b.times - a.times || b.totalAmount - a.totalAmount,
    );
  }, [sales, medicines, searchedCustomer, customerPhone]);

  // Data formatting for Customer Order History Graph Modal
  const customerGraphData = useMemo(() => {
    const custKey = (searchedCustomer || "").trim().toLowerCase();
    const phoneKey = customerPhone.trim();

    let matchedSales = (sales || []).filter((s) => {
      if (!s) return false;
      if (!custKey && !phoneKey) return true;
      const sName = (s.customerName || "").trim().toLowerCase();
      const sPhone = (s.customerPhone || "").trim();
      return (custKey && sName.includes(custKey)) || (phoneKey && sPhone.includes(phoneKey));
    });

    if (graphPatientFilter !== "All") {
      matchedSales = matchedSales.filter((s) => s && s.billingFor === graphPatientFilter);
    }

    // Collect all distinct item names across customer orders
    const allItemNamesSet = new Set();
    const chartData = matchedSales
      .slice(0, 10)
      .reverse()
      .map((s) => {
        let dateLabel = "Today";
        try {
          if (s?.createdAt) dateLabel = format(new Date(s.createdAt), "dd MMM yyyy");
        } catch {
          dateLabel = "Today";
        }
        const entry = {
          date: dateLabel,
          billNo: s?.billNo || s?.invoiceNo || "BILL",
          grandTotal: s?.grandTotal || 0,
        };
        s?.items?.forEach((it) => {
          if (!it) return;
          const name = it.medicineName || "Medicine";
          allItemNamesSet.add(name);
          entry[name] =
            (entry[name] || 0) + (it.lineTotal || (it.unitPrice || 0) * (it.quantity || 1));
        });
        return entry;
      });

    return {
      chartData,
      itemNames: Array.from(allItemNamesSet),
      totalSpent: matchedSales.reduce((acc, s) => acc + (s?.grandTotal || 0), 0),
      totalOrders: matchedSales.length,
    };
  }, [sales, searchedCustomer, customerPhone, graphPatientFilter]);

  // Label for the history date-range trigger (DD/MM/YYYY - DD/MM/YYYY)
  const historyDateRangeLabel = useMemo(() => {
    if (!historyStartDate && !historyEndDate) return "All Dates";

    const formatDisplay = (isoStr) => {
      if (!isoStr) return "";
      const parts = isoStr.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return isoStr;
    };

    if (historyStartDate && historyEndDate) {
      return `${formatDisplay(historyStartDate)} - ${formatDisplay(historyEndDate)}`;
    }
    if (historyStartDate) return `From ${formatDisplay(historyStartDate)}`;
    if (historyEndDate) return `Until ${formatDisplay(historyEndDate)}`;
    return "All Dates";
  }, [historyStartDate, historyEndDate]);

  // Filtered sales records for the Sales History table
  const filteredHistorySales = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    const rangeStart = historyStartDate ? new Date(historyStartDate).setHours(0, 0, 0, 0) : 0;
    const rangeEnd = historyEndDate ? new Date(historyEndDate).setHours(23, 59, 59, 999) : Infinity;
    const docQ = filterDoctorName.trim().toLowerCase();
    const entryQ = filterEntryBy.trim().toLowerCase();
    const minAmt = filterMinAmount !== "" ? Number(filterMinAmount) : null;
    const maxAmt = filterMaxAmount !== "" ? Number(filterMaxAmount) : null;
    const list = (sales || []).filter((s) => {
      if (!s) return false;
      // Voided filter
      if (!filterShowVoided && s.status === "voided") return false;
      // Status filter
      if (historyStatusFilter === "due" && s.status !== "due" && s.paymentMode !== "due")
        return false;
      if (historyStatusFilter === "paid" && (s.status === "due" || s.paymentMode === "due"))
        return false;
      // Payment mode filter
      if (filterPaymentMode !== "all" && (s.paymentMode || "").toLowerCase() !== filterPaymentMode)
        return false;
      // Bill No search
      const billNoStr = String(s.billNo || s.invoiceNo || "").toLowerCase();
      if (q && !billNoStr.includes(q)) return false;
      // Doctor name filter
      if (
        docQ &&
        !String(s.doctorName || "")
          .toLowerCase()
          .includes(docQ)
      )
        return false;
      // Entry by / cashier filter
      if (
        entryQ &&
        !String(s.createdByName || "")
          .toLowerCase()
          .includes(entryQ)
      )
        return false;
      // Amount range filter
      const amt = s.grandTotal || 0;
      if (minAmt !== null && amt < minAmt) return false;
      if (maxAmt !== null && amt > maxAmt) return false;
      // Date range filter
      if (rangeStart && rangeEnd) {
        const billTs = s.billDate
          ? new Date(s.billDate).getTime()
          : s.createdAt
            ? new Date(s.createdAt).getTime()
            : 0;
        if (!billTs || billTs < rangeStart || billTs > rangeEnd) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (historySortBy === "a-z") {
        const nameA = (a.customerName || "Counter Sale").toLowerCase();
        const nameB = (b.customerName || "Counter Sale").toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (historySortBy === "z-a") {
        const nameA = (a.customerName || "Counter Sale").toLowerCase();
        const nameB = (b.customerName || "Counter Sale").toLowerCase();
        return nameB.localeCompare(nameA);
      }
      if (historySortBy === "price-high") {
        return (b.grandTotal || 0) - (a.grandTotal || 0);
      }
      if (historySortBy === "price-low") {
        return (a.grandTotal || 0) - (b.grandTotal || 0);
      }
      if (historySortBy === "priority-due") {
        const isDueA = a.status === "due" || a.paymentMode === "due" ? 1 : 0;
        const isDueB = b.status === "due" || b.paymentMode === "due" ? 1 : 0;
        if (isDueA !== isDueB) return isDueB - isDueA;
        return (b.grandTotal || 0) - (a.grandTotal || 0);
      }
      if (historySortBy === "oldest") {
        const tsA = new Date(a.createdAt || 0).getTime();
        const tsB = new Date(b.createdAt || 0).getTime();
        return tsA - tsB;
      }
      // Default: newest
      const tsA = new Date(a.createdAt || 0).getTime();
      const tsB = new Date(b.createdAt || 0).getTime();
      return tsB - tsA;
    });
  }, [
    sales,
    historySearchQuery,
    historyStatusFilter,
    historyStartDate,
    historyEndDate,
    historySortBy,
    filterDoctorName,
    filterEntryBy,
    filterPaymentMode,
    filterMinAmount,
    filterMaxAmount,
    filterShowVoided,
  ]);

  const historyTotalAmount = useMemo(() => {
    return filteredHistorySales.reduce((acc, s) => acc + (s?.grandTotal || 0), 0);
  }, [filteredHistorySales]);

  const handleCustomerSearch = () => {
    const name = (customerName || customerQuery || "").trim();
    if (!name && !customerPhone.trim()) {
      toast.error("Enter a customer name or mobile number to search");
      return;
    }
    setSearchedCustomer(name);
    const hasHistory = (sales || []).some((s) => {
      if (!s) return false;
      const sName = (s.customerName || "").trim().toLowerCase();
      const sPhone = (s.customerPhone || "").trim();
      return (
        (name && sName.includes(name.toLowerCase())) ||
        (customerPhone.trim() && sPhone.includes(customerPhone.trim()))
      );
    });
    if (!hasHistory) toast.info(`No past purchases found for "${name || customerPhone.trim()}"`);
    else toast.success(`Loaded purchase history for ${name || customerPhone.trim()}`);
  };

  const handleGraphOpen = () => {
    if ((customerName || customerQuery).trim())
      setSearchedCustomer((customerName || customerQuery).trim());
    setGraphOpen(true);
  };

  const fefoBatchOf = (medicineId) => {
    try {
      const picks = pickBatchesFEFO(batches || [], medicineId, 1);
      return picks.length ? (batches || []).find((b) => b && b.id === picks[0].batchId) : undefined;
    } catch {
      return (batches || []).find(
        (b) => b && b.medicineId === medicineId && (b.currentStock || 0) > 0,
      );
    }
  };

  const priceFor = (medicineId) => {
    const b = fefoBatchOf(medicineId);
    return b?.sellingPrice ?? 100;
  };

  const addToCart = (medicine) => {
    const batch = fefoBatchOf(medicine.id);
    const flaggedDisc = batch?.discountPct ?? 0;

    setCart((prev) => {
      const existing = prev.find((l) => l.medicineId === medicine.id);
      if (existing) {
        return prev.map((l) =>
          l.medicineId === medicine.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      if (flaggedDisc > 0) toast.info(`${flaggedDisc}% discount applied`);
      return [
        ...prev,
        { medicineId: medicine.id, medicine, batch, quantity: 1, discountPct: flaggedDisc },
      ];
    });
    setQuery("");
  };

  const findByBarcode = (code) => {
    const c = String(code || "")
      .trim()
      .toLowerCase();
    if (!c) return undefined;
    return medicines.find(
      (m) =>
        m &&
        m.isActive !== false &&
        String(m.barcode || "")
          .trim()
          .toLowerCase() === c,
    );
  };

  const addByBarcode = (code) => {
    const med = findByBarcode(code);
    if (med) {
      addToCart(med);
      toast.success(`${med.name} added`);
      return true;
    }
    toast.error(`No medicine found for barcode "${code}"`);
    return false;
  };

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!query.trim()) return;
    if (!addByBarcode(query)) {
      if (searchResults.length === 1) addToCart(searchResults[0]);
    }
  };

  const addByBarcodeRef = useRef(addByBarcode);
  useEffect(() => {
    addByBarcodeRef.current = addByBarcode;
  });

  useEffect(() => {
    if (!scanOpen || scanMode !== "camera") {
      setScanReady(false);
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
      return;
    }
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (addByBarcodeRef.current(decodedText)) setScanOpen(false);
        },
        () => {},
      )
      .then(() => setScanReady(true))
      .catch(() => {
        toast.error("Camera not accessible. Check permissions or use the search bar.");
        setScanOpen(false);
      });
  }, [scanOpen, scanMode]);

  useEffect(() => {
    if (scanOpen && scanMode === "keyboard") keyboardRef.current?.focus();
  }, [scanOpen, scanMode]);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          scanner.stop().catch(() => {});
        } catch {
          /* ignore */
        }
        try {
          scanner.clear();
        } catch {
          /* ignore */
        }
        scannerRef.current = null;
      }
    };
  }, []);

  const totals = useMemo(() => {
    let totalQty = 0,
      subtotal = 0,
      discountTotal = 0,
      gstTotal = 0;
    const details = [];
    cart.forEach((line) => {
      const med = medicines.find((m) => m.id === line.medicineId) || line.medicine;
      if (!med) return;
      const batch = line.batch || fefoBatchOf(line.medicineId);
      const mrp = batch?.mrp || batch?.sellingPrice || 100;
      const unitPrice = batch?.sellingPrice || 90;
      const gross = unitPrice * line.quantity;
      const discount = (gross * (line.discountPct || 0)) / 100;
      const dPrice = gross - discount;
      const gst = (dPrice * (med.gstRate || 0)) / 100;
      const lineTotal = dPrice + gst;
      totalQty += line.quantity;
      subtotal += gross;
      discountTotal += discount;
      gstTotal += gst;
      details.push({ line, med, batch, mrp, unitPrice, discount, dPrice, gst, lineTotal });
    });
    const grossTotal = subtotal - discountTotal + gstTotal;
    const grandTotal = Math.round(grossTotal);
    return {
      totalQty,
      itemCount: cart.length,
      subtotal,
      discountTotal,
      gstTotal,
      grandTotal,
      roundOff: grandTotal - grossTotal,
      details,
    };
  }, [cart, medicines, batches]);

  const clearCart = () => {
    setCart([]);
    setCustomerQuery("");
    setCustomerName("");
    setCustomerPhone("");
    setSearchedCustomer("");
    setGraphPatientFilter("All");
    setDoctorName("");
    setTender("");
    toast.info("Cart cleared");
  };

  const confirmCheckout = () => {
    if (!cart.length) {
      toast.error("Cart is empty");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Customer Name is required");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Mobile Number is required");
      return;
    }
    if (!/^\d{10}$/.test(customerPhone.replace(/\D/g, ""))) {
      toast.error("Mobile Number must be exactly 10 digits");
      return;
    }
    if (!doctorName.trim()) {
      toast.error("Doctor Name is required");
      return;
    }
    const tenderNum = Number(tender || totals.grandTotal);
    if (payment === "cash" && tenderNum < totals.grandTotal) {
      toast.error("Tender is less than total");
      return;
    }

    const currentBatches = db.get()?.batches || [];
    const items = [];
    const stockPicks = [];

    cart.forEach((line) => {
      const med = medicines.find((m) => m.id === line.medicineId) || line.medicine;
      if (!med) return;
      let picks = [];
      try {
        picks = pickBatchesFEFO(currentBatches, line.medicineId, line.quantity);
      } catch {
        picks = [];
      }
      if (!picks.length) {
        const fb = currentBatches.find((b) => b.medicineId === med.id);
        if (fb)
          picks = [
            {
              batchId: fb.id,
              locationType: "Front Shelf",
              rackCode: "A-01",
              quantity: line.quantity,
            },
          ];
      }
      picks.forEach((p) => {
        stockPicks.push(p);
        const b = currentBatches.find((x) => x.id === p.batchId);
        const unit = b?.sellingPrice || 100;
        const gross = unit * p.quantity;
        const discount = (gross * (line.discountPct || 0)) / 100;
        const net = gross - discount;
        const gst = (net * (med.gstRate || 0)) / 100;
        items.push({
          medicineId: med.id,
          batchId: b?.id || `b-${med.id}`,
          medicineName: med.name,
          batchNumber: b?.batchNumber || "BT-2025",
          quantity: p.quantity,
          unitPrice: unit,
          discountPct: line.discountPct || 0,
          gstRate: med.gstRate || 0,
          lineTotal: net + gst,
        });
      });
    });

    const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;
    const grand = totals.grandTotal;
    const sale = {
      id: db.uid(),
      invoiceNo,
      customerName: customerName.trim() || customerQuery.trim() || "Counter Bill",
      customerPhone: customerPhone.trim() || undefined,
      doctorName: doctorName.trim() || undefined,
      billingFor: billingFor,
      items,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      gstTotal: totals.gstTotal,
      roundOff: totals.roundOff,
      grandTotal: grand,
      paymentMode: payment,
      tender: tenderNum,
      change: Math.max(0, tenderNum - grand),
      status: "completed",
      createdBy: user?.id || "u-system",
      createdByName: user?.name || "Cashier",
      createdAt: new Date().toISOString(),
      billDate: billDate.isValid() ? billDate.toISOString() : new Date().toISOString(),
    };

    db.set((d) => {
      d.sales = d.sales || [];
      d.activityLogs = d.activityLogs || [];
      sale.billNo = genBillNo(d.sales);
      d.sales.unshift(sale);
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user?.id,
        userName: user?.name,
        action: `Sale ${invoiceNo} · ${currency}${grand.toLocaleString()}`,
        entityType: "sale",
        entityId: sale.id,
        details: { invoiceNo, grandTotal: grand, items: items.length },
        createdAt: new Date().toISOString(),
      });
    });

    stockPicks.forEach((p) => {
      try {
        applyStockMovement({
          batchId: p.batchId,
          locationType: p.locationType || "Front Shelf",
          rackCode: p.rackCode || "A-01",
          movementType: "Sales Outward",
          quantityChange: -Math.abs(p.quantity),
          referenceDocId: sale.id,
          userId: user?.id,
          userName: user?.name,
        });
      } catch {
        /* ignore */
      }
    });

    toast.success(`Sale #${sale.billNo} completed`);
    setCheckoutOpen(false);
    clearCart();
    setTab("history");
  };

  const handleSaveFamilyMember = () => {
    if (!familyMemberName.trim()) {
      toast.error("Family member name is required");
      return;
    }
    const newMember = {
      id: db.uid(),
      customerKey: activeCustomerKey || "default",
      customerPhone: customerPhone.trim(),
      name: familyMemberName.trim(),
      phone: familyMemberPhone.trim(),
      age: familyMemberAge.trim(),
      relation: familyMemberRelation,
      createdAt: new Date().toISOString(),
    };

    db.set((d) => {
      d.familyMembers = d.familyMembers || [];
      d.familyMembers.push(newMember);
    });

    setBillingFor(`${familyMemberName.trim()} (${familyMemberRelation})`);
    toast.success(`Added ${familyMemberName.trim()} (${familyMemberRelation})`);
    setAddFamilyOpen(false);
    setFamilyMemberName("");
    setFamilyMemberPhone("");
    setFamilyMemberAge("");
  };

  const deleteSale = (sale) => {
    const label = sale.billNo || sale.invoiceNo;
    if (!confirm(`Delete bill ${label}? Sold stock will be returned to inventory.`)) return;
    sale.items?.forEach((it) => {
      try {
        applyStockMovement({
          batchId: it.batchId,
          locationType: "Front Shelf",
          rackCode: "Returns",
          movementType: "Customer Return",
          quantityChange: Math.abs(it.quantity),
          referenceDocId: sale.id,
          userId: user?.id,
          userName: user?.name,
        });
      } catch {
        /* ignore */
      }
    });
    db.set((d) => {
      d.sales = (d.sales || []).filter((x) => x.id !== sale.id);
    });
    toast.success(`Bill ${label} deleted`);
  };

  const handleBillLookup = () => {
    const q = billSearch.trim().toLowerCase();
    if (!q) return;
    const match = sales.find(
      (s) =>
        String(s.billNo || "").toLowerCase() === q || String(s.invoiceNo || "").toLowerCase() === q,
    );
    if (match) {
      setBillSearch("");
      navigate(`/sales/${match.id}`);
    } else {
      toast.error(`No bill found for "${billSearch.trim()}"`);
    }
  };

  const todayStr = new Date().toDateString();
  const todaysSales = sales.filter((s) => {
    try {
      return new Date(s.createdAt).toDateString() === todayStr;
    } catch {
      return false;
    }
  });

  const formatExpiry = (d) => {
    try {
      return d ? format(new Date(d), "MM/yy") : "12/26";
    } catch {
      return "12/26";
    }
  };

  return (
    <div className="flex flex-col gap-0 pb-6 text-sm text-foreground">
      {/* ─── TOP BAR: Header Title + "+ New" Button + Right Actions ─────────────────── */}
      <div className="flex items-center justify-between px-0 py-2 mb-1 border-b border-border/40 pb-2.5">
        {/* Left: Sales Text (clicking opens Sales History) + "+ New" (clicking opens New Sale POS) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`text-lg font-extrabold tracking-tight transition-colors cursor-pointer ${
              tab === "history"
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-foreground hover:text-emerald-700"
            }`}
            title="Click to view Sales History"
          >
            Sales
          </button>
          <button
            type="button"
            onClick={() => setTab("pos")}
            className={`h-7 px-3 rounded-md text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer ${
              tab === "pos"
                ? "bg-emerald-700 text-white ring-2 ring-emerald-500/50"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
            title="Click to open New Sale POS"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        {/* Right-side Actions */}
        <div className="flex items-center gap-1.5 text-xs">
          {tab === "pos" && (
            <>
              <button
                type="button"
                onClick={() => toast.info("Reminder set")}
                className="h-8 px-2.5 border border-border bg-background hover:bg-muted text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Set Reminder</span>
              </button>

              {/* Save split button */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (!cart.length) {
                      toast.error("Cart is empty");
                      return;
                    }
                    setCheckoutOpen(true);
                  }}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 rounded-l-md text-xs flex items-center gap-1.5 transition-colors"
                >
                  Save
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white px-1.5 rounded-r-md border-l border-emerald-500 transition-colors"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setCheckoutOpen(true)}>
                      Save & Checkout
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.success("Draft saved")}>
                      Save as Draft
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="h-8 w-8 border border-border bg-background hover:bg-muted rounded-md flex items-center justify-center transition-colors cursor-pointer"
                title="POS Settings"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </>
          )}

          {tab === "history" && (
            <button
              type="button"
              onClick={() => toast.info("Sales Return feature loaded")}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Sales Return &gt;
            </button>
          )}
        </div>
      </div>

      {/* ─── POS TAB CONTENT ────────────────────────────────── */}
      {tab === "pos" && (
        <div className="flex flex-col">
          {/* Row 2: Billing Info Bar */}
          <div className="flex flex-wrap items-end gap-3 bg-card p-3 rounded-t-lg border border-border/60 border-b-0">
            {/* Customer Mobile / Name + Graph Icon Button */}
            <div className="flex-1 min-w-[260px] space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-700" />
                  Customer Name
                  {/* Graph Analytics Pop-up Icon Button (only when a customer name is entered) */}
                  {(customerName || customerQuery).trim() && (
                    <button
                      type="button"
                      onClick={handleGraphOpen}
                      className="h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900 flex items-center justify-center transition-colors ml-1"
                      title="View Customer Order History Graph & Analytics"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerQuery("Counter Bill");
                    setCustomerName("Counter Bill");
                    toast.info("Created as Counter Bill");
                  }}
                  className="text-[11px] bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1 hover:underline font-semibold"
                >
                  <Mail className="h-3 w-3" /> Create as Counter Bill
                </button>
              </div>
              <div className="relative">
                <Input
                  placeholder="Customer Mobile / Name / Card Number"
                  value={customerQuery}
                  onChange={(e) => {
                    setCustomerQuery(e.target.value);
                    setCustomerName(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCustomerSearch();
                  }}
                  className="h-9 text-xs bg-background pr-10"
                />
                <button
                  type="button"
                  onClick={handleCustomerSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors"
                  title="Search customer purchase history"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Bill Date — ANTD Calendar Picker */}
            <div className="w-full sm:w-[160px] space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Bill Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-9 w-full flex items-center justify-between px-3 text-xs font-medium bg-background border border-input rounded-md hover:bg-muted transition-colors"
                  >
                    <span>{billDate ? billDate.format("DD-MM-YYYY") : "Select date"}</span>
                    <svg
                      className="h-3.5 w-3.5 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <AntdCalendar
                    fullscreen={false}
                    value={billDate}
                    onSelect={(date) => {
                      setBillDate(date);
                      setCalendarOpen(false);
                    }}
                    className="rounded-lg overflow-hidden"
                    style={{ width: 300 }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Billing For — Dropdown with Saved Family Members + Add Family Option */}
            <div className="w-full sm:w-[180px] space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Billing for</Label>
              <Select
                value={billingFor}
                onValueChange={(val) => {
                  if (val === "__ADD_NEW_FAMILY__") {
                    setAddFamilyOpen(true);
                  } else {
                    setBillingFor(val);
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Self">Self (20%)</SelectItem>
                  {customerFamilyMembers
                    .filter((fm) => fm && fm.name)
                    .map((fm, idx) => (
                      <SelectItem
                        key={fm.id || `fm-${idx}`}
                        value={`${fm.name} (${fm.relation || "Member"})`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">{fm.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {fm.relation || "Member"} · {fm.phone || "No phone"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  <SelectItem
                    value="__ADD_NEW_FAMILY__"
                    className="text-emerald-600 font-bold border-t border-border/50 mt-1 pt-1"
                  >
                    <span className="flex items-center gap-1">
                      <UserPlus className="h-3.5 w-3.5" />+ Add New Family Member
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Doctor */}
            <div className="w-full sm:w-[200px] space-y-1">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Stethoscope className="h-3 w-3" /> Doctor
              </Label>
              <Input
                placeholder="Enter Doctor Name"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="h-9 text-xs bg-background"
              />
            </div>
          </div>

          {/* Row 3+4: Search Bar + Cart Table (single table for alignment) */}
          <div className="border border-border/60 rounded-b-lg overflow-x-auto">
            {/* Live Search Row */}
            <div className="border-b border-border/40 px-3 py-2 bg-background flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search item here. (e.g 'gly' or 'g+99' or '8908009149206' or 'c.paracetamol')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="h-7 border-none shadow-none bg-transparent text-xs placeholder:text-muted-foreground focus-visible:ring-0 p-0"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setScanMode("choose");
                  setScanOpen(true);
                }}
                className="flex items-center gap-1.5 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold shadow-sm hover:shadow transition-colors"
                title="Scan barcode"
              >
                <ScanLine className="h-4 w-4" />
                Scan
              </button>
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="bg-card border-b border-border/40 divide-y divide-border/30 max-h-64 overflow-y-auto">
                {searchResults.map((m, idx) => {
                  if (!m) return null;
                  const stock = stockByMed.get(m.id) ?? 50;
                  const priceVal = priceFor(m.id);
                  const priceNum = typeof priceVal === "number" ? priceVal : 100;
                  const medName = m.name || "Medicine";
                  return (
                    <button
                      key={m.id || `sr-${idx}`}
                      type="button"
                      onClick={() => addToCart(m)}
                      className="w-full px-4 py-2 text-left hover:bg-muted/60 flex items-center justify-between text-xs transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {medName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{medName}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {m.brandName || m.genericName || "Strip"} · {m.packSize || "10 Tabs"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-700">
                          {currency}
                          {priceNum.toFixed(2)}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-600">
                          Stock: {stock}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Cart Items Table */}
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-muted/60 text-muted-foreground text-[11px] font-bold uppercase tracking-wide border-b border-border/50">
                  <th className="py-2.5 px-3">
                    ITEM NAME <InfoTip text="Medicine name, brand or generic" />
                  </th>
                  <th className="py-2.5 px-3">
                    UNIT/PACK <InfoTip text="Pack size of the medicine, e.g. 10 Tabs, 30 Gm" />
                  </th>
                  <th className="py-2.5 px-2">LOC.</th>
                  <th className="py-2.5 px-3">
                    BATCH <InfoTip text="Batch number assigned during purchase" />
                  </th>
                  <th className="py-2.5 px-3">
                    EXPIRY <InfoTip text="Expiry date of the batch" />
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    MRP <InfoTip text="Maximum Retail Price printed on the pack" />
                  </th>
                  <th className="py-2.5 px-3 text-center">
                    QTY. <InfoTip text="Quantity of units to sell" />
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    DISC% <InfoTip text="Discount percentage on selling price" />
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    D.PRICE <InfoTip text="Price after discount, before GST" />
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    GST% <InfoTip text="GST rate applicable on this item" />
                  </th>
                  <th className="py-2.5 px-3 text-right">AMOUNT</th>
                  <th className="py-2.5 px-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {totals.details.map((detail) => {
                  const { line, med, batch, mrp, dPrice, lineTotal } = detail;
                  const available = stockByMed.get(line.medicineId) ?? 50;
                  return (
                    <tr key={line.medicineId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-foreground">{med.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {med.genericName || med.brandName || "—"}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {med.packSize || "1 Strip"}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-muted-foreground text-[11px]">
                        {med.rack || "A-01"}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold">
                        {batch?.batchNumber || "BT-2025"}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {formatExpiry(batch?.expiryDate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                        {currency}
                        {mrp.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Input
                          type="number"
                          min={1}
                          max={available}
                          value={line.quantity}
                          onChange={(e) =>
                            setCart((p) =>
                              p.map((l) =>
                                l.medicineId === line.medicineId
                                  ? {
                                      ...l,
                                      quantity: Math.max(
                                        1,
                                        Math.min(Number(e.target.value) || 1, available),
                                      ),
                                    }
                                  : l,
                              ),
                            )
                          }
                          className="w-14 mx-auto text-center font-mono font-bold text-xs text-foreground border-none shadow-none bg-transparent p-0 focus-visible:ring-0 focus-visible:border-none no-spin"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={line.discountPct || 0}
                          onChange={(e) =>
                            setCart((p) =>
                              p.map((l) =>
                                l.medicineId === line.medicineId
                                  ? {
                                      ...l,
                                      discountPct: Math.min(
                                        100,
                                        Math.max(0, Number(e.target.value) || 0),
                                      ),
                                    }
                                  : l,
                              ),
                            )
                          }
                          className="w-12 ml-auto text-right font-mono text-xs text-foreground border-none shadow-none bg-transparent p-0 focus-visible:ring-0 focus-visible:border-none no-spin"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {currency}
                        {dPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                        {med.gstRate || 0}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {currency}
                        {lineTotal.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setCart((p) => p.filter((l) => l.medicineId !== line.medicineId))
                          }
                          className="text-muted-foreground/60 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty State */}
            {cart.length === 0 && (
              <div className="py-12 text-center">
                <Receipt className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">No items in bill yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Search and select medicines from the bar above to start billing.
                </p>
              </div>
            )}
          </div>

          {/* ─── BOTTOM STRIP: Customer Previously Purchased Medicines Thumbnails (Only when customer name is searched) ─── */}
          {searchedCustomer.trim() && customerPastPurchases.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                <span className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-emerald-600" />
                  Previously Purchased by {searchedCustomer}
                </span>
                <span className="text-[11px] text-muted-foreground/80">
                  Click any item thumbnail to quick-add to bill
                </span>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
                {customerPastPurchases.map((item, idx) => {
                  if (!item || !item.med) return null;
                  const medId = item.med.id || `m-fallback-${idx}`;
                  const priceVal = priceFor(medId);
                  const priceNum = typeof priceVal === "number" ? priceVal : 100;
                  const medName = item.med.name || "Medicine";
                  const packSize = item.med.packSize || "1 Strip";
                  return (
                    <button
                      key={medId}
                      type="button"
                      onClick={() => addToCart(item.med)}
                      className="shrink-0 group flex flex-col items-center bg-card hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 border border-border/60 hover:border-emerald-400 p-2 rounded-xl transition-all shadow-2xs hover:shadow text-center w-28 cursor-pointer"
                      title={`Click to add ${medName} to cart`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-emerald-100/80 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform mb-1 shadow-2xs">
                        {medName ? medName.slice(0, 2).toUpperCase() : "MED"}
                      </div>
                      <span className="text-[11px] font-semibold text-foreground line-clamp-1 w-full">
                        {medName}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        {packSize}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 mt-0.5">
                        {currency}
                        {priceNum.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── HISTORY TAB CONTENT ────────────────────────────── */}
      {tab === "history" && (
        <div className="flex flex-col gap-3 mt-1">
          {/* ─── TOP FILTER BAR (Matches reference screenshot) ─── */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card p-2.5 rounded-lg border border-border/60 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Bill No Dropdown */}
              <Select value={historySearchType} onValueChange={setHistorySearchType}>
                <SelectTrigger className="h-8 w-28 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billNo">Bill No.</SelectItem>
                  <SelectItem value="invoiceNo">Invoice No.</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Here... Search */}
              <div className="relative w-44 sm:w-56">
                <Input
                  placeholder="Type Here..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="h-8 text-xs bg-background pr-7"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Status / Amount Filter */}
              <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                <SelectTrigger className="h-8 w-28 text-xs bg-background">
                  <SelectValue placeholder="₹ All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">₹ All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                </SelectContent>
              </Select>

              {/* Bill Date Duration — Calendar Date Range Selector */}
              <Popover open={historyDatePopoverOpen} onOpenChange={setHistoryDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-9 px-3 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-md text-xs font-medium text-slate-700 flex items-center gap-2 shadow-2xs cursor-pointer transition-all focus:outline-none"
                    title="Click to select Date Range"
                  >
                    <span className="text-slate-800 font-semibold">{historyDateRangeLabel}</span>
                    <CalendarIcon className="h-3.5 w-3.5 text-blue-600 ml-1" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto bg-white p-3 rounded-xl border border-slate-200 shadow-xl z-50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4 text-blue-600" />
                      Select Date Range
                    </div>
                    <button
                      onClick={() => setHistoryDatePopoverOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
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
                      from: historyStartDate ? new Date(historyStartDate) : undefined,
                      to: historyEndDate ? new Date(historyEndDate) : undefined,
                    }}
                    onSelect={(range) => {
                      setHistoryStartDate(range?.from ? range.from.toISOString().slice(0, 10) : "");
                      setHistoryEndDate(range?.to ? range.to.toISOString().slice(0, 10) : "");
                    }}
                    numberOfMonths={1}
                    className="rounded-lg"
                  />

                  {/* Footer actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryStartDate("");
                        setHistoryEndDate("");
                        toast.success("Date filter cleared — showing all dates");
                        setHistoryDatePopoverOpen(false);
                      }}
                      className="text-xs text-slate-500 hover:text-red-600 font-medium"
                    >
                      Clear Filter
                    </button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setHistoryDatePopoverOpen(false);
                        toast.success(`Date filter applied: ${historyDateRangeLabel}`);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1"
                    >
                      Apply Filter
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* More Filters — compact list dropdown with A-Z, Price, Priority & Payment filters */}
              {(() => {
                const isSortActive = historySortBy !== "newest";
                const moreActiveCount = [
                  isSortActive,
                  filterPaymentMode !== "all",
                  filterMinAmount !== "",
                  filterMaxAmount !== "",
                  filterShowVoided,
                  filterEntryBy.trim() !== "",
                  filterDoctorName.trim() !== "",
                ].filter(Boolean).length;

                const SORT_OPTIONS = [
                  { label: "Name (A - Z)", value: "a-z" },
                  { label: "Name (Z - A)", value: "z-a" },
                  { label: "Price: High to Low", value: "price-high" },
                  { label: "Price: Low to High", value: "price-low" },
                  { label: "Priority (Due First)", value: "priority-due" },
                  { label: "Newest First", value: "newest" },
                  { label: "Oldest First", value: "oldest" },
                ];

                const PAYMENT_OPTIONS = [
                  { label: "All Payment Modes", value: "all" },
                  { label: "Cash", value: "cash" },
                  { label: "UPI", value: "upi" },
                  { label: "Card", value: "card" },
                  { label: "Due / Credit", value: "due" },
                ];

                return (
                  <Popover open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`h-8 px-2.5 border text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                          moreActiveCount > 0
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                            : "border-border bg-background hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <Filter className="h-3.5 w-3.5" />
                        <span>
                          More Filters{moreActiveCount > 0 ? ` (${moreActiveCount})` : ""}
                        </span>
                      </button>
                    </PopoverTrigger>

                    <PopoverContent
                      align="end"
                      className="w-56 p-1.5 rounded-lg border border-border shadow-lg bg-card z-50 max-h-96 overflow-y-auto"
                    >
                      {/* Section 1: Sort Options (A-Z, Price, Priority) */}
                      <p className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Sort & Order
                      </p>
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setHistorySortBy(opt.value);
                            setMoreFiltersOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                            historySortBy === opt.value
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          {opt.label}
                          {historySortBy === opt.value && (
                            <span className="text-emerald-600 font-bold">✓</span>
                          )}
                        </button>
                      ))}

                      <div className="my-1 border-t border-border/50" />

                      {/* Section 2: Payment Mode */}
                      <p className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Payment Mode
                      </p>
                      {PAYMENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFilterPaymentMode(opt.value);
                            setMoreFiltersOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                            filterPaymentMode === opt.value
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          {opt.label}
                          {filterPaymentMode === opt.value && (
                            <span className="text-emerald-600 font-bold">✓</span>
                          )}
                        </button>
                      ))}

                      <div className="my-1 border-t border-border/50" />

                      {/* Section 3: Show Voided */}
                      <button
                        type="button"
                        onClick={() => {
                          setFilterShowVoided((v) => !v);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                          filterShowVoided
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 font-semibold"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        Show Voided Bills
                        {filterShowVoided && <span className="text-emerald-600 font-bold">✓</span>}
                      </button>

                      {/* Clear all — only when active */}
                      {moreActiveCount > 0 && (
                        <>
                          <div className="my-1 border-t border-border/50" />
                          <button
                            type="button"
                            onClick={() => {
                              setHistorySortBy("newest");
                              setFilterPaymentMode("all");
                              setFilterMinAmount("");
                              setFilterMaxAmount("");
                              setFilterShowVoided(false);
                              setFilterEntryBy("");
                              setFilterDoctorName("");
                              setMoreFiltersOpen(false);
                              toast.success("Filters and sorting reset");
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors"
                          >
                            ✕ Reset Filters & Sorting
                          </button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                );
              })()}
            </div>
          </div>

          {/* ─── SALES HISTORY TABLE (Green theme matching app) ─── */}
          <div className="bg-card rounded-lg border border-border/60 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[900px] text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-900/10 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold uppercase text-[11px] tracking-wide border-b border-emerald-200 dark:border-emerald-900">
                    <th className="px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-1">
                        Bill No. <InfoTip text="Unique bill number for this sale" />
                      </span>
                    </th>
                    <th className="px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-1">
                        Entry Date <InfoTip text="Date and time the bill was recorded" />
                      </span>
                    </th>
                    <th className="px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-1">
                        Bill Date <InfoTip text="Billing date selected for the bill" />
                      </span>
                    </th>
                    <th className="px-3.5 py-2.5">Entry By</th>
                    <th className="px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-1">
                        Patient <InfoTip text="Customer / patient for whom the bill was raised" />
                      </span>
                    </th>
                    <th className="px-3.5 py-2.5">Mobile</th>
                    <th className="px-3.5 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 justify-end">
                        Bill Amount <InfoTip text="Total payable after discounts and GST" />
                      </span>
                    </th>
                    <th className="px-3.5 py-2.5 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs">
                  {filteredHistorySales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <Receipt className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="font-semibold">No sales records found</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Click "+ New" to create a new sale bill.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistorySales.map((s, idx) => {
                      const billDisplay = s.billNo || s.invoiceNo || `BILL-${idx + 1}`;
                      const entryDateStr = s.createdAt
                        ? format(new Date(s.createdAt), "dd-MM-yy hh:mm a")
                        : "—";
                      const billDateStr = s.createdAt
                        ? format(new Date(s.createdAt), "dd-MM-yy")
                        : "—";
                      const isDue = s.status === "due" || s.paymentMode === "due";
                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors group"
                        >
                          {/* Bill No */}
                          <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            <Link
                              to={`/sales/${s.id}`}
                              className="hover:underline flex items-center gap-1"
                            >
                              <User className="h-3 w-3 text-emerald-600/70" />
                              {billDisplay}
                            </Link>
                          </td>

                          {/* Entry Date */}
                          <td className="px-3.5 py-2.5 text-muted-foreground font-mono text-[11px]">
                            {entryDateStr}
                          </td>

                          {/* Bill Date */}
                          <td className="px-3.5 py-2.5 text-muted-foreground font-mono text-[11px]">
                            {billDateStr}
                          </td>

                          {/* Entry By */}
                          <td className="px-3.5 py-2.5 font-medium text-foreground">
                            {s.createdByName || "Owner"}
                          </td>

                          {/* Patient */}
                          <td className="px-3.5 py-2.5 font-semibold text-foreground">
                            {s.customerName || "Counter Sale"}
                            {s.billingFor && s.billingFor !== "Self" && (
                              <span className="ml-1 text-[10px] text-emerald-600 font-normal">
                                ({s.billingFor})
                              </span>
                            )}
                          </td>

                          {/* Mobile */}
                          <td className="px-3.5 py-2.5 font-mono text-muted-foreground">
                            {s.customerPhone || "—"}
                          </td>

                          {/* Bill Amount */}
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-foreground">
                            <div className="flex items-center justify-end gap-1.5">
                              <span>
                                {currency}
                                {(s.grandTotal || 0).toLocaleString()}
                              </span>
                              {isDue ? (
                                <span className="rounded-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-0.5">
                                  Due ✕
                                </span>
                              ) : (
                                <span className="rounded-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-bold">
                                  Paid
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-3.5 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigate(`/sales/${s.id}`);
                                }}
                                className="text-muted-foreground hover:text-emerald-600 transition-colors p-1"
                                title="Print / View Invoice"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toast.success(`Shared bill #${billDisplay}`)}
                                className="text-muted-foreground hover:text-emerald-600 transition-colors p-1"
                                title="Share via WhatsApp"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                              <Link
                                to={`/sales/${s.id}`}
                                className="text-muted-foreground hover:text-emerald-600 transition-colors p-1"
                                title="View Bill Details"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                              <button
                                type="button"
                                title="Delete bill"
                                onClick={() => deleteSale(s)}
                                className="text-muted-foreground hover:text-red-600 transition-colors p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer bar showing Total Amount */}
            <div className="bg-emerald-900/90 dark:bg-emerald-950 text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
              <span>Total Records: {filteredHistorySales.length}</span>
              <span className="font-mono text-sm">
                Total Amount: {currency}
                {historyTotalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── BOTTOM SUMMARY BAR ─────────────────────────────── */}
      {tab === "pos" && cart.length > 0 && (
        <div className="sticky bottom-0 z-30 bg-card border-t border-border/60 px-4 py-2.5 flex items-center justify-between text-xs shadow-md mt-4 rounded-b-lg border-x">
          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear Cart
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (!cart.length) {
                  toast.error("Cart is empty");
                  return;
                }
                setCheckoutOpen(true);
              }}
              className="flex items-center gap-2 font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Net Payable:{" "}
              <span className="font-mono">
                {currency}
                {totals.grandTotal.toFixed(2)}
              </span>
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER ORDER HISTORY GRAPH MODAL ─────────────── */}
      <Dialog open={graphOpen} onOpenChange={setGraphOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white text-slate-900 border border-slate-200">
          {/* Header */}
          <div className="bg-[#1E40AF] px-5 py-3.5 flex items-center justify-between text-white">
            <h2 className="text-base font-bold flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              {searchedCustomer || customerName || customerQuery || "Customer"}&apos;s Top Purchases
            </h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                  Total Orders
                </p>
                <p className="text-lg font-extrabold text-slate-800">
                  {customerGraphData.totalOrders}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                  Total Spent
                </p>
                <p className="text-lg font-extrabold text-emerald-600">
                  {currency}
                  {customerGraphData.totalSpent.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            {/* Filter by patient / family member */}
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-slate-600">patient_id:</Label>
              <Select value={graphPatientFilter} onValueChange={setGraphPatientFilter}>
                <SelectTrigger className="h-8 w-36 text-xs bg-slate-50 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Self">Self</SelectItem>
                  {customerFamilyMembers.map((fm) => (
                    <SelectItem key={fm.id} value={`${fm.name} (${fm.relation})`}>
                      {fm.name} ({fm.relation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* All-time top / most frequent purchases */}
            {topPurchases.length > 0 ? (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {topPurchases.slice(0, 10).map((entry, idx) => {
                  const maxTimes = topPurchases[0]?.times || 1;
                  const widthPct = Math.max(8, Math.round((entry.times / maxTimes) * 100));
                  const medName = entry.med?.name || "Medicine";
                  return (
                    <div
                      key={entry.med?.id || `tp-${idx}`}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="shrink-0 h-5 w-5 rounded-md text-[11px] font-bold flex items-center justify-center text-white"
                            style={{ backgroundColor: ITEM_COLORS[idx % ITEM_COLORS.length] }}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800 text-sm truncate">
                            {medName}
                          </span>
                        </div>
                        <span className="shrink-0 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                          {entry.times}×
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: ITEM_COLORS[idx % ITEM_COLORS.length],
                          }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{entry.totalQty} units bought</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {currency}
                          {entry.totalAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500">
                <BarChart2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">No order history available</p>
                <p className="text-xs text-slate-400 mt-1">
                  Complete a bill for this customer to view their top purchases.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── ADD FAMILY MEMBER DIALOG ───────────────────────── */}
      <Dialog open={addFamilyOpen} onOpenChange={setAddFamilyOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-emerald-700">
              <UserPlus className="h-5 w-5" />
              Add Family Member for {customerName || customerQuery || "Customer"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="font-semibold">
                Person Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Hamid Girach"
                value={familyMemberName}
                onChange={(e) => setFamilyMemberName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="font-semibold">Mobile Number</Label>
                <Input
                  placeholder="e.g. 9033071726"
                  maxLength={10}
                  inputMode="numeric"
                  value={familyMemberPhone}
                  onChange={(e) => setFamilyMemberPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Age</Label>
                <Input
                  type="number"
                  placeholder="e.g. 32"
                  value={familyMemberAge}
                  onChange={(e) => setFamilyMemberAge(e.target.value)}
                  className="h-9 text-xs no-spin"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Relation</Label>
              <Select value={familyMemberRelation} onValueChange={setFamilyMemberRelation}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Brother",
                    "Sister",
                    "Wife",
                    "Husband",
                    "Father",
                    "Mother",
                    "Son",
                    "Daughter",
                    "Grandfather",
                    "Grandmother",
                    "Other",
                  ].map((rel) => (
                    <SelectItem key={rel} value={rel}>
                      {rel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddFamilyOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFamilyMember}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4"
            >
              Save Family Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── SCAN DIALOG ────────────────────────────────────── */}
      <Dialog
        open={scanOpen}
        onOpenChange={(o) => {
          setScanOpen(o);
          if (!o) setScanMode("choose");
        }}
      >
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-600" />
              Scan Barcode
            </DialogTitle>
          </DialogHeader>

          {scanMode === "choose" && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setScanMode("camera")}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50"
              >
                <Camera className="h-7 w-7 text-emerald-600" />
                <span className="text-sm font-bold text-foreground">Camera Scanner</span>
                <span className="text-[11px] leading-snug text-muted-foreground">
                  Point your phone or laptop camera at the barcode
                </span>
              </button>
              <button
                type="button"
                onClick={() => setScanMode("keyboard")}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-border bg-background p-4 text-center transition-all hover:border-emerald-400 hover:bg-muted/40"
              >
                <Keyboard className="h-7 w-7 text-emerald-600" />
                <span className="text-sm font-bold text-foreground">Scanner / Keyboard</span>
                <span className="text-[11px] leading-snug text-muted-foreground">
                  Use a USB scanner or type the barcode and press Enter
                </span>
              </button>
            </div>
          )}

          {scanMode === "camera" && (
            <div className="space-y-3 py-2 text-xs">
              <div
                id="qr-reader"
                className="w-full overflow-hidden rounded-lg border border-border/60 [&_video]:rounded-lg"
              />
              <p className="text-center text-muted-foreground">
                {scanReady
                  ? "Point the camera at a medicine barcode to add it to the cart."
                  : "Starting camera…"}
              </p>
            </div>
          )}

          {scanMode === "keyboard" && (
            <div className="space-y-3 py-2 text-xs">
              <Input
                ref={keyboardRef}
                placeholder="Type or scan barcode, then press Enter"
                value={keyboardScan}
                onChange={(e) => setKeyboardScan(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (!keyboardScan.trim()) return;
                  if (addByBarcode(keyboardScan)) setKeyboardScan("");
                }}
                className="h-10 text-sm font-mono"
              />
              <p className="text-center text-muted-foreground">
                USB scanners type the code automatically. Scan or type a barcode and press Enter to
                add it to the cart.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (scanMode === "choose") setScanOpen(false);
                else setScanMode("choose");
              }}
              className="text-xs"
            >
              {scanMode === "choose" ? "Close" : "Back"}
            </Button>
            {scanMode !== "choose" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScanOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── CHECKOUT SHEET ────────────────────────────────── */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col h-full bg-white">
          <SheetHeader className="border-b border-border/60 pb-3">
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Complete Payment & Checkout
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 text-xs">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="cust-name" className="font-semibold">
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cust-name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Counter Bill / Walk-in"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cust-phone" className="font-semibold">
                  Mobile Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cust-phone"
                  required
                  maxLength={10}
                  inputMode="numeric"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-name" className="font-semibold">
                Doctor Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="doc-name"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Name"
                className="h-9 text-xs"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="font-semibold">Payment Method</Label>
                <Select value={payment} onValueChange={setPayment}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                    <SelectItem value="upi">📱 UPI</SelectItem>
                    <SelectItem value="card">💳 Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {payment === "cash" && (
                <div className="space-y-1">
                  <Label htmlFor="tender" className="font-semibold">
                    Cash Received
                  </Label>
                  <Input
                    id="tender"
                    type="number"
                    value={tender}
                    onChange={(e) => setTender(e.target.value)}
                    placeholder={String(totals.grandTotal)}
                    className="h-9 text-xs font-mono no-spin"
                  />
                </div>
              )}
            </div>
            <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 p-4 space-y-2 border border-emerald-200/50">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold">Total Net Payable:</span>
                <span className="font-mono text-xl font-extrabold text-emerald-700">
                  {currency}
                  {totals.grandTotal.toFixed(2)}
                </span>
              </div>
              {payment === "cash" && (
                <div className="flex justify-between items-center text-xs border-t border-emerald-200/40 pt-2">
                  <span className="text-muted-foreground font-semibold">Change to Return:</span>
                  <span className="font-mono font-bold text-sm">
                    {currency}
                    {Math.max(0, Number(tender || totals.grandTotal) - totals.grandTotal).toFixed(
                      2,
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
          <SheetFooter className="mt-4 border-t border-border/60 pt-4 flex-row gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCheckoutOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCheckout}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 flex items-center gap-2"
            >
              <Receipt className="h-4 w-4" />
              Complete Sale & Print Bill
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── POS SETTINGS MODAL DIALOG (Matches reference screenshot with green theme) ─── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-card text-foreground border border-border shadow-lg">
          {/* Header in Emerald Green matching app background */}
          <div className="bg-emerald-700 dark:bg-emerald-900 px-5 py-3.5 flex items-center justify-between text-white">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </h2>
          </div>

          {/* Form Body */}
          <div className="p-5 space-y-4 text-xs">
            {/* Order Type */}
            <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-3">
              <Label className="font-semibold text-xs text-foreground">Order Type</Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger className="h-8 w-48 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Wholesale">Wholesale</SelectItem>
                  <SelectItem value="Online Order">Online Order</SelectItem>
                  <SelectItem value="Prescription">Prescription</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Items By */}
            <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-3">
              <Label className="font-semibold text-xs text-foreground">Sort Items By</Label>
              <Select value={sortItemsBy} onValueChange={setSortItemsBy}>
                <SelectTrigger className="h-8 w-48 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Name">Name (A-Z)</SelectItem>
                  <SelectItem value="Price">Selling Price</SelectItem>
                  <SelectItem value="Expiry">Expiry Date (FEFO)</SelectItem>
                  <SelectItem value="Rack">Rack Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order From / Channels dropdown matching reference screenshot */}
            <div className="flex items-center justify-between gap-4 pb-1">
              <Label className="font-semibold text-xs text-foreground">Order From</Label>
              <Select value={orderFrom} onValueChange={setOrderFrom}>
                <SelectTrigger className="h-8 w-48 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="Direct Counter">Direct Counter</SelectItem>
                  <SelectItem value="Dunzo">Dunzo</SelectItem>
                  <SelectItem value="MedPay">MedPay</SelectItem>
                  <SelectItem value="PhonePe">PhonePe</SelectItem>
                  <SelectItem value="MobiKwik">MobiKwik</SelectItem>
                  <SelectItem value="ONDC">ONDC</SelectItem>
                  <SelectItem value="eka.care">eka.care</SelectItem>
                  <SelectItem value="MediBuddy">MediBuddy</SelectItem>
                  <SelectItem value="Tata 1mg">Tata 1mg</SelectItem>
                  <SelectItem value="PharmEasy">PharmEasy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Helper text matching reference screenshot */}
            <p className="text-[11px] text-muted-foreground pt-1 italic">
              Please select the source if you received outside Orders.
            </p>
          </div>

          {/* Footer with Apply button */}
          <div className="border-t border-border/40 px-5 py-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                toast.success("POS settings updated");
                setSettingsOpen(false);
              }}
              className="h-8 bg-emerald-600 hover:bg-emerald-800 text-white font-bold text-xs px-5 rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
