import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import {
  Plus,
  Trash2,
  ShoppingCart,
  Mail,
  Search,
  ChevronDown,
  Settings,
  Lightbulb,
  Video,
  Info,
  CreditCard,
  CheckCircle2,
  Printer,
  Receipt,
  ArrowRight,
  DollarSign,
  Wallet,
  QrCode,
  Building2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { applyStockMovement } from "@/lib/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import type { GRN, GRNItem, Batch, Medicine } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard/purchases")({
  head: () => ({ meta: [{ title: "PharmacyOS · Purchases" }] }),
  component: PurchasesPage,
});
/** Clickable info icon that shows a small popover with description text */
function InfoTip({ text, size = "sm" }: { text: string; size?: "sm" | "xs" }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex cursor-pointer focus:outline-none">
          <Info className={size === "xs" ? "h-2.5 w-2.5 text-muted-foreground/70" : "h-3 w-3 text-muted-foreground/70"} />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto max-w-[220px] px-3 py-2 text-xs text-foreground leading-snug">
        {text}
      </PopoverContent>
    </Popover>
  );
}

interface EVitalLineItem {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName?: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string; // YYYY-MM or YYYY-MM-DD
  mrp: number;
  ptr: number; // Price to Retailer / Purchase Price
  qty: number;
  freeQty: number;
  schemeAmt: number;
  discPct: number;
  baseAmt: number;
  gstRate: number;
  lineTotal: number;
}

export function PurchasesPage() {
  const { user } = useAuth();
  const has = usePermission();
  const suppliers = useDb((d) => d.suppliers);
  const medicines = useDb((d) => d.medicines);
  const pos = useDb((d) => d.purchaseOrders);
  const grns = useDb((d) => d.grns);
  const currency = useDb((d) => d.settings.currency);

  const canCreate = has("purchases", "create");

  // Tab view: 'entry' (eVitalRx layout) vs 'history' (GRNs & POs)
  const [viewTab, setViewTab] = useState<"entry" | "history">("entry");

  // eVitalRx Form State
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const defaultDueStr = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const [distributorId, setDistributorId] = useState<string>("");
  const [billNo, setBillNo] = useState<string>("");
  const [billDate, setBillDate] = useState<string>(todayStr);
  const [dueDate, setDueDate] = useState<string>(defaultDueStr);
  const [paymentType, setPaymentType] = useState<"credit" | "cash" | "upi">("credit");
  const [lifaMode, setLifaMode] = useState<"LIFA" | "LILA">("LIFA");
  const [selectedPoId, setSelectedPoId] = useState<string>("");

  // Items Grid State
  const [items, setItems] = useState<EVitalLineItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Dialogs for history view
  const [poOpen, setPoOpen] = useState(false);
  const [poSupplier, setPoSupplier] = useState("");
  const [poDate, setPoDate] = useState("");

  // Role state & Payment Access Control
  const [activeRole, setActiveRole] = useState<string>("Admin");

  // Payment Modal & Generated Bill Dialog State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "netbanking" | "credit">("cash");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentTxnRef, setPaymentTxnRef] = useState<string>("");

  const [generatedBillModalOpen, setGeneratedBillModalOpen] = useState(false);
  const [viewingGrn, setViewingGrn] = useState<GRN | null>(null);

  // File Manager Upload Ref & Handler
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.success(`Selected bill file: ${file.name}`);
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
    setBillNo(cleanFileName);

    if (items.length === 0 && medicines.length > 0) {
      addMedicineToGrid(medicines[0]);
    }
  };

  // Filter medicines by search query
  const filteredMedicines = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return medicines
      .filter(
        (m) =>
          m.isActive &&
          (m.name.toLowerCase().includes(q) ||
            m.genericName?.toLowerCase().includes(q) ||
            m.barcode?.includes(q))
      )
      .slice(0, 8);
  }, [searchQuery, medicines]);

  // Add medicine to line items
  const addMedicineToGrid = (med: Medicine) => {
    const defaultPtr = Math.round(med.reorderThreshold ? med.reorderThreshold * 10 : 100);
    const defaultMrp = Math.round(defaultPtr * 1.25);
    const defaultGst = med.gstRate || 12;

    const newItem: EVitalLineItem = {
      id: db.uid(),
      medicineId: med.id,
      medicineName: med.name,
      genericName: med.genericName,
      batchNumber: `BTH-${Math.floor(1000 + Math.random() * 9000)}`,
      mfgDate: todayStr,
      expiryDate: format(addDays(new Date(), 365), "yyyy-MM"),
      mrp: defaultMrp,
      ptr: defaultPtr,
      qty: 1,
      freeQty: 0,
      schemeAmt: 0,
      discPct: 0,
      baseAmt: defaultPtr * 1,
      gstRate: defaultGst,
      lineTotal: Math.round(defaultPtr * 1 * (1 + defaultGst / 100) * 100) / 100,
    };

    setItems((prev) => [...prev, newItem]);
    setSearchQuery("");
    setShowSearchResults(false);
    toast.success(`Added ${med.name} to bill`);
  };

  // Calculate line item derived fields
  const updateLineItem = (id: string, updates: Partial<EVitalLineItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, ...updates };

        // Recalculate Base & Amount
        const rawBase = updated.ptr * updated.qty - updated.schemeAmt;
        const discountVal = (rawBase * updated.discPct) / 100;
        const baseAmt = Math.max(0, Math.round((rawBase - discountVal) * 100) / 100);

        const gstVal = (baseAmt * updated.gstRate) / 100;
        const lineTotal = Math.round((baseAmt + gstVal) * 100) / 100;

        return {
          ...updated,
          baseAmt,
          lineTotal,
        };
      })
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Grand Totals Calculation
  const totals = useMemo(() => {
    let totalQty = 0;
    let totalFree = 0;
    let totalBase = 0;
    let totalGst = 0;
    let grandTotal = 0;
    let totalMrpVal = 0;
    let totalCostVal = 0;

    items.forEach((it) => {
      totalQty += Number(it.qty) || 0;
      totalFree += Number(it.freeQty) || 0;
      totalBase += it.baseAmt;
      const lineGst = (it.baseAmt * it.gstRate) / 100;
      totalGst += lineGst;
      grandTotal += it.lineTotal;

      totalMrpVal += it.mrp * it.qty;
      totalCostVal += it.ptr * it.qty;
    });

    const avgMarginPct =
      totalMrpVal > 0 ? Math.round(((totalMrpVal - totalCostVal) / totalMrpVal) * 1000) / 10 : 0;

    return {
      totalItems: items.length,
      totalQty,
      totalFree,
      totalBase: Math.round(totalBase * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      avgMarginPct,
    };
  }, [items]);

  // Direct Save Bill for Non-Admins (Owner / Manager)
  const handleDirectSaveBill = () => {
    if (!user) return toast.error("User session not found");

    const effectiveDistributorId = distributorId || (suppliers[0]?.id ?? "");
    if (!effectiveDistributorId) return toast.error("Please select a Distributor");
    if (items.length === 0) return toast.error("Please add at least 1 item to the purchase bill");

    const finalBillNo = billNo.trim() || `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();
    const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;
    const createdBatches: Batch[] = [];
    const grnItems: GRNItem[] = [];

    items.forEach((it) => {
      const batchId = db.uid();
      let expIso = it.expiryDate;
      if (expIso.length === 7) expIso = `${expIso}-28`;
      try {
        expIso = new Date(expIso).toISOString();
      } catch {
        expIso = new Date(addDays(new Date(), 365)).toISOString();
      }

      const batch: Batch = {
        id: batchId,
        medicineId: it.medicineId,
        batchNumber: it.batchNumber,
        mfgDate: it.mfgDate || todayStr,
        expiryDate: expIso,
        mrp: it.mrp,
        purchasePrice: it.ptr,
        sellingPrice: Math.round(it.mrp * 0.95),
        supplierId: effectiveDistributorId,
        quantityReceived: it.qty + it.freeQty,
        currentStock: 0,
        status: "active",
        createdAt: now,
      };

      createdBatches.push(batch);

      grnItems.push({
        medicineId: it.medicineId,
        batchId,
        medicineName: it.medicineName,
        batchNumber: it.batchNumber,
        mfgDate: batch.mfgDate,
        expiryDate: batch.expiryDate,
        mrp: it.mrp,
        purchasePrice: it.ptr,
        sellingPrice: batch.sellingPrice,
        quantity: it.qty + it.freeQty,
      });
    });

    const grn: GRN = {
      id: db.uid(),
      grnNumber,
      supplierId: effectiveDistributorId,
      invoiceNumber: finalBillNo,
      invoiceDate: billDate,
      poId: selectedPoId || undefined,
      items: grnItems,
      totalValue: totals.grandTotal,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: now,
    };

    db.set((d) => {
      d.batches.push(...createdBatches);
      d.grns.unshift(grn);
      if (selectedPoId) {
        const po = d.purchaseOrders.find((p) => p.id === selectedPoId);
        if (po) po.status = "received";
      }
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user.id,
        userName: user.name,
        action: `Purchase Bill #${finalBillNo} recorded by ${activeRole} (${grnNumber})`,
        entityType: "grn",
        entityId: grn.id,
        details: { totalValue: totals.grandTotal, itemsCount: items.length },
        createdAt: now,
      });
    });

    // Update stock levels
    grnItems.forEach((it) => {
      applyStockMovement({
        medicineId: it.medicineId,
        batchId: it.batchId,
        movementType: "in",
        quantity: it.quantity,
        reason: `Purchase Bill #${finalBillNo} (${grnNumber})`,
        referenceId: grn.id,
        userId: user.id,
        userName: user.name,
      });
    });

    toast.success(`Purchase Bill #${finalBillNo} saved! ${createdBatches.length} batches added to inventory.`);

    setViewingGrn(grn);
    setGeneratedBillModalOpen(true);

    // Reset Form
    setBillNo("");
    setItems([]);
    setSelectedPoId("");
  };

  // 1. Proceed to Payment Step (Admin only)
  const handleProceedToPayment = () => {
    if (!user) return toast.error("User session not found");

    if (activeRole !== "Admin") {
      return handleDirectSaveBill();
    }

    const effectiveDistributorId = distributorId || (suppliers[0]?.id ?? "");
    if (!effectiveDistributorId) return toast.error("Please select a Distributor");

    if (items.length === 0) return toast.error("Please add at least 1 item to the purchase bill");

    if (!billNo.trim()) {
      setBillNo(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
    }

    setAmountPaid(totals.grandTotal);
    setPaymentModalOpen(true);
  };

  // 2. Fetch Existing Bill by Bill No. / Order No.
  const handleFetchBill = (searchQueryStr?: string) => {
    const query = (searchQueryStr ?? billNo).trim().toLowerCase();
    if (!query) {
      return toast.error("Please enter a Bill / Order No. to fetch details");
    }

    const foundGrn = grns.find(
      (g) =>
        g.invoiceNumber?.toLowerCase() === query ||
        g.grnNumber.toLowerCase() === query ||
        g.id.toLowerCase() === query
    );

    if (foundGrn) {
      setDistributorId(foundGrn.supplierId);
      setBillNo(foundGrn.invoiceNumber || foundGrn.grnNumber);
      try {
        setBillDate(format(new Date(foundGrn.createdAt), "yyyy-MM-dd"));
      } catch {
        setBillDate(todayStr);
      }

      // Populate line items grid from fetched GRN
      const mappedItems: EVitalLineItem[] = foundGrn.items.map((gi) => {
        const med = medicines.find((m) => m.id === gi.medicineId);
        const ptr = gi.purchasePrice || 100;
        const mrp = gi.mrp || Math.round(ptr * 1.25);
        const gstRate = med?.gstRate || 12;
        const baseAmt = ptr * gi.quantity;
        const lineTotal = Math.round(baseAmt * (1 + gstRate / 100) * 100) / 100;

        return {
          id: db.uid(),
          medicineId: gi.medicineId,
          medicineName: gi.medicineName,
          genericName: med?.genericName,
          batchNumber: gi.batchNumber,
          mfgDate: gi.mfgDate ? gi.mfgDate.slice(0, 10) : todayStr,
          expiryDate: gi.expiryDate ? gi.expiryDate.slice(0, 7) : "2027-08",
          mrp,
          ptr,
          qty: gi.quantity,
          freeQty: 0,
          schemeAmt: 0,
          discPct: 0,
          baseAmt,
          gstRate,
          lineTotal,
        };
      });

      setItems(mappedItems);
      setViewingGrn(foundGrn);
      setGeneratedBillModalOpen(true);
      toast.success(`Found Purchase Bill #${foundGrn.invoiceNumber ?? foundGrn.grnNumber}! Loaded details on screen.`);
    } else {
      toast.error(`No purchase bill found with number "${query.toUpperCase()}"`);
    }
  };

  // 3. Finalize Payment & Generate Bill
  const handleFinalizePaymentAndSave = () => {
    if (!user) return toast.error("User session not found");

    const effectiveDistributorId = distributorId || (suppliers[0]?.id ?? "");
    if (!effectiveDistributorId) return toast.error("Please select a Distributor");
    if (items.length === 0) return toast.error("Please add at least 1 item to the purchase bill");

    const finalBillNo = billNo.trim() || `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();
    const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;
    const createdBatches: Batch[] = [];
    const grnItems: GRNItem[] = [];

    items.forEach((it) => {
      const batchId = db.uid();
      let expIso = it.expiryDate;
      if (expIso.length === 7) expIso = `${expIso}-28`;
      try {
        expIso = new Date(expIso).toISOString();
      } catch {
        expIso = new Date(addDays(new Date(), 365)).toISOString();
      }

      const batch: Batch = {
        id: batchId,
        medicineId: it.medicineId,
        batchNumber: it.batchNumber,
        mfgDate: it.mfgDate || todayStr,
        expiryDate: expIso,
        mrp: it.mrp,
        purchasePrice: it.ptr,
        sellingPrice: Math.round(it.mrp * 0.95),
        supplierId: effectiveDistributorId,
        quantityReceived: it.qty + it.freeQty,
        currentStock: 0,
        status: "active",
        createdAt: now,
      };

      createdBatches.push(batch);

      grnItems.push({
        medicineId: it.medicineId,
        batchId,
        medicineName: it.medicineName,
        batchNumber: it.batchNumber,
        mfgDate: batch.mfgDate,
        expiryDate: batch.expiryDate,
        mrp: it.mrp,
        purchasePrice: it.ptr,
        sellingPrice: batch.sellingPrice,
        quantity: it.qty + it.freeQty,
      });
    });

    const grn: GRN = {
      id: db.uid(),
      grnNumber,
      supplierId: effectiveDistributorId,
      invoiceNumber: finalBillNo,
      invoiceDate: billDate,
      poId: selectedPoId || undefined,
      items: grnItems,
      totalValue: totals.grandTotal,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: now,
    };

    db.set((d) => {
      d.batches.push(...createdBatches);
      d.grns.unshift(grn);
      if (selectedPoId) {
        const po = d.purchaseOrders.find((p) => p.id === selectedPoId);
        if (po) po.status = "received";
      }
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user.id,
        userName: user.name,
        action: `eVitalRx Purchase Bill #${finalBillNo} paid via ${paymentMethod.toUpperCase()} (${grnNumber})`,
        entityType: "grn",
        entityId: grn.id,
        details: {
          totalValue: totals.grandTotal,
          itemsCount: items.length,
          paymentMethod,
          amountPaid,
          paymentTxnRef,
        },
        createdAt: now,
      });
    });

    // Update stock levels
    grnItems.forEach((it) => {
      applyStockMovement({
        batchId: it.batchId,
        movementType: "in",
        quantity: it.quantity,
        reason: `Purchase Bill #${finalBillNo} (${grnNumber})`,
        referenceId: grn.id,
        userId: user.id,
        userName: user.name,
      });
    });

    toast.success(`Payment complete! Purchase Bill #${finalBillNo} generated and stock updated.`);

    // Close Payment Modal & Open Generated Bill Receipt Modal
    setPaymentModalOpen(false);
    setViewingGrn(grn);
    setGeneratedBillModalOpen(true);

    // Reset Form
    setBillNo("");
    setItems([]);
    setSelectedPoId("");
    setPaymentTxnRef("");
  };

  const supplierName = useMemo(() => {
    const m = new Map(suppliers.map((s) => [s.id, s.name]));
    return (id: string) => m.get(id) ?? "—";
  }, [suppliers]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background text-foreground">
      {/* Top Action Header (No outer container box or outline) */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-4 pt-2">
        {/* Left: Tabs */}
        <div className="flex items-center gap-3">

          {/* Mode Tabs */}
          <div className="flex items-center rounded-lg bg-muted p-0.5 text-xs">
            <button
              onClick={() => setViewTab("entry")}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${viewTab === "entry"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Purchase Entry
            </button>
            <button
              onClick={() => setViewTab("history")}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${viewTab === "history"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Purchase History
            </button>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Linked PO selector */}
          <Select value={selectedPoId} onValueChange={setSelectedPoId}>
            <SelectTrigger className="h-8 text-xs bg-background w-[120px] border-border">
              <SelectValue placeholder="🔗 PO/s" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— No PO —</SelectItem>
              {pos
                .filter((p) => p.status === "placed")
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.poNumber} ({supplierName(p.supplierId)})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>








        </div>
      </div>

      {viewTab === "entry" ? (
        <div className="flex-1 flex flex-col justify-between">
          {/* Main Form Body */}
          <div className="px-4 pb-0 space-y-0">
            {/* Row 1: Distributor, Bill No, Dates Header */}
            <div className="flex flex-wrap items-end gap-4 bg-card p-3 rounded-t-lg border border-border/60 border-b-0">
              {/* Distributor */}
              <div className="flex-1 min-w-[240px] space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Distributor
                    <InfoTip text="The medicine distributor or supplier you are purchasing from" />
                  </span>
                  <button
                    onClick={() => toast.info("No supplier emails linked yet")}
                    className="text-[11px] bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1 hover:underline font-semibold"
                  >
                    <Mail className="h-3 w-3" /> Emails
                  </button>
                </div>
                <Select value={distributorId} onValueChange={setDistributorId}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Select Distributor / Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.gstNumber ? `(GST: ${s.gstNumber})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bill No. / Order No. */}
              <div className="w-full sm:w-[220px] space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Bill No. / Order No.</Label>
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="Enter Invoice #"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFetchBill();
                      }
                    }}
                    className="h-9 text-xs font-mono bg-background"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 text-xs px-2.5 bg-muted text-muted-foreground hover:text-foreground shrink-0 font-medium"
                    onClick={() => handleFetchBill()}
                  >
                    Search
                  </Button>
                </div>
              </div>

              {/* Bill Date */}
              <div className="w-full sm:w-[165px] space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Bill Date</Label>
                <Input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="h-9 text-xs bg-background w-full px-3"
                />
              </div>

              {/* Due Date */}
              <div className="w-full sm:w-[165px] space-y-1">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  Due Date
                  <InfoTip text="Last date by which payment must be made to the distributor" />
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 text-xs bg-background w-full px-3"
                />
              </div>
            </div>

            {/* Items Table Container */}
            <div className="bg-card rounded-b-lg border border-border/60 overflow-hidden flex flex-col">
              {/* Table Column Headers */}
              <div className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 grid grid-cols-12 gap-1 items-center">
                {/* Item Name + Tax Mode Toggle */}
                <div className="col-span-3 flex items-center justify-between pr-2">
                  <span className="text-foreground">Item Name</span>
                  <div className="flex items-center gap-1 bg-background border border-border rounded px-1.5 py-0.5 text-[10px]">
                    <button
                      onClick={() => setLifaMode("LIFA")}
                      title="Incl. Tax: Prices include GST (tax is built into the price)"
                      className={`px-1.5 py-0.5 rounded font-semibold ${lifaMode === "LIFA" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      Incl. Tax
                    </button>
                    <button
                      onClick={() => setLifaMode("LILA")}
                      title="Excl. Tax: Prices do not include GST (tax is added separately)"
                      className={`px-1.5 py-0.5 rounded font-semibold ${lifaMode === "LILA" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      Excl. Tax
                    </button>
                  </div>
                </div>

                <div className="col-span-1 text-center flex items-center justify-center gap-0.5">
                  Batch <InfoTip text="Batch number printed on the medicine box — used for tracking and expiry" size="xs" />
                </div>
                <div className="col-span-1 text-center flex items-center justify-center gap-0.5">
                  Expiry <InfoTip text="Month and year the medicine expires (format: YYYY-MM)" size="xs" />
                </div>
                <div className="col-span-1 text-right flex items-center justify-end gap-0.5 pr-1">
                  MRP <InfoTip text="Maximum Retail Price — the highest price at which this medicine can be sold" size="xs" />
                </div>
                <div className="col-span-1 text-right flex items-center justify-end gap-0.5 pr-1">
                  PTR <InfoTip text="Price to Retailer — the price the distributor is charging you" size="xs" />
                </div>
                <div className="col-span-1 text-center flex items-center justify-center gap-0.5">
                  Qty <InfoTip text="Number of units (strips, bottles, etc.) you are purchasing" size="xs" />
                </div>
                <div className="col-span-1 text-center flex items-center justify-center gap-0.5">
                  Bonus <InfoTip text="Bonus units given by the distributor at no extra charge" size="xs" />
                </div>
                <div className="col-span-1 text-right flex items-center justify-end gap-0.5 pr-1">
                  Disc% <InfoTip text="Discount percentage offered by the distributor on this item" size="xs" />
                </div>
                <div className="col-span-1 text-center flex items-center justify-center gap-0.5">
                  GST% <InfoTip text="GST tax rate applicable on this medicine (e.g. 5%, 12%, 18%)" size="xs" />
                </div>
                <div className="col-span-1 text-right font-bold text-foreground pr-2">Amount</div>
              </div>

              {/* Live Search Row Input */}
              <div className="px-3 py-2 border-b border-border/60 bg-background relative">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-blue-500" />
                  <Input
                    placeholder="Search item here. (e.g 'gly' or 'paracetamol' or barcode)"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    className="pl-9 h-9 text-xs bg-transparent border-0 shadow-none focus-visible:ring-0 font-medium placeholder:text-muted-foreground/60"
                  />
                </div>

                {/* Autocomplete Results Dropdown */}
                {showSearchResults && filteredMedicines.length > 0 && (
                  <div className="absolute left-2 right-2 top-12 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-border">
                    {filteredMedicines.map((med) => (
                      <button
                        key={med.id}
                        onClick={() => addMedicineToGrid(med)}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-foreground">{med.name}</div>
                          {med.genericName && (
                            <div className="text-[11px] text-muted-foreground">{med.genericName}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            GST {med.gstRate}%
                          </span>
                          <div className="text-[10px] text-muted-foreground">Click to add</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items List or Empty Graphic with File Upload */}
              {items.length === 0 ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center bg-background/50">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-56 h-48 rounded-xl border-2 border-dashed border-primary/40 bg-card p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div className="w-16 h-20 border-2 border-primary/40 rounded-lg bg-primary/5 flex flex-col items-center justify-center p-2 mb-2 relative group-hover:scale-105 transition-transform">
                      <div className="w-10 h-1 bg-primary/40 rounded mb-1.5" />
                      <div className="w-9 h-9 rounded border border-primary/30 flex items-center justify-center bg-background shadow-xs">
                        <Upload className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[8px] font-bold text-primary mt-1.5">Upload Bill</span>
                    </div>
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Upload Purchase Bill File
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Click to choose PDF, Image, or Excel
                    </span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
                  {items.map((item) => {
                    return (
                      <div
                        key={item.id}
                        className="px-3 py-2 grid grid-cols-12 gap-1 items-center text-xs hover:bg-muted/30 transition-colors"
                      >
                        {/* Medicine Name */}
                        <div className="col-span-3 pr-2">
                          <div className="font-semibold text-foreground truncate">{item.medicineName}</div>
                          {item.genericName && (
                            <div className="text-[10px] text-muted-foreground truncate">{item.genericName}</div>
                          )}
                        </div>

                        {/* Batch Number */}
                        <div className="col-span-1">
                          <Input
                            value={item.batchNumber}
                            onChange={(e) => updateLineItem(item.id, { batchNumber: e.target.value })}
                            className="h-7 text-xs font-mono text-center px-1 border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:bg-muted/40 rounded"
                          />
                        </div>

                        {/* Expiry Date */}
                        <div className="col-span-1">
                          <Input
                            type="text"
                            placeholder="YYYY-MM"
                            value={item.expiryDate}
                            onChange={(e) => updateLineItem(item.id, { expiryDate: e.target.value })}
                            className="h-7 text-xs text-center px-1 border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:bg-muted/40 rounded"
                          />
                        </div>

                        {/* MRP */}
                        <div className="col-span-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.mrp}
                            onChange={(e) =>
                              updateLineItem(item.id, { mrp: Number(e.target.value) || 0 })
                            }
                            className="h-7 text-xs text-right px-1 font-mono border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:bg-muted/40 rounded"
                          />
                        </div>

                        {/* PTR (Price to Retailer) */}
                        <div className="col-span-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.ptr}
                            onChange={(e) =>
                              updateLineItem(item.id, { ptr: Number(e.target.value) || 0 })
                            }
                            className="h-7 text-xs text-right px-1 font-mono border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:bg-muted/40 rounded"
                          />
                        </div>

                        {/* Qty */}
                        <div className="col-span-1">
                          <Input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) =>
                              updateLineItem(item.id, { qty: Math.max(1, Number(e.target.value) || 1) })
                            }
                            className="h-7 text-xs text-center px-1 font-mono font-bold border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:bg-muted/40 rounded"
                          />
                        </div>

                        {/* Free Qty */}
                        <div className="col-span-1">
                          <Input
                            type="number"
                            min="0"
                            value={item.freeQty}
                            onChange={(e) =>
                              updateLineItem(item.id, { freeQty: Number(e.target.value) || 0 })
                            }
                            className="h-7 text-xs text-center px-1 font-mono border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:bg-muted/40 rounded"
                          />
                        </div>

                        {/* Disc% */}
                        <div className="col-span-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.discPct}
                            onChange={(e) =>
                              updateLineItem(item.id, { discPct: Number(e.target.value) || 0 })
                            }
                            className="h-7 text-xs text-right px-1 font-mono border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:bg-muted/40 rounded"
                          />
                        </div>

                        {/* GST% */}
                        <div className="col-span-1">
                          <select
                            value={item.gstRate}
                            onChange={(e) =>
                              updateLineItem(item.id, { gstRate: Number(e.target.value) || 0 })
                            }
                            className="h-7 text-xs text-center w-full rounded border-0 bg-transparent focus:outline-none focus:bg-muted/40">
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </div>

                        {/* Line Amount & Remove */}
                        <div className="col-span-1 flex items-center justify-end gap-1 pl-1">
                          <span className="font-mono font-bold text-xs text-foreground">
                            {currency}
                            {item.lineTotal.toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Bar — only visible when items are selected */}
          {items.length > 0 && canCreate && (
            <div className="border-t border-border bg-card px-4 py-3 flex items-center justify-end shadow-sm">
              <Button
                onClick={activeRole === "Admin" ? handleProceedToPayment : handleDirectSaveBill}
                className={`h-9 px-6 text-sm font-semibold flex items-center gap-2 shadow-sm ${activeRole === "Admin"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
              >
                {activeRole === "Admin" ? (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Proceed to Payment</span>
                    <ArrowRight className="h-4 w-4 opacity-80" />
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save Bill</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* History & GRN / PO View */
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold">Purchase History & Receipts</h2>
            {canCreate && (
              <Button size="sm" onClick={() => setPoOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> New PO
              </Button>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/50 text-left uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">GRN / Bill #</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Invoice #</th>
                  <th className="px-4 py-3 font-semibold text-right">Items</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Value</th>
                  <th className="px-4 py-3 font-semibold">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No purchase bills recorded yet. Use the <strong>eVitalRx Purchase Entry</strong> tab
                      above to create your first purchase!
                    </td>
                  </tr>
                ) : (
                  grns.map((g) => (
                    <tr key={g.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-semibold text-primary">{g.grnNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(g.createdAt), "PP")}
                      </td>
                      <td className="px-4 py-3 font-medium">{supplierName(g.supplierId)}</td>
                      <td className="px-4 py-3 font-mono">{g.invoiceNumber ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-mono">{g.items.length}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        {currency}
                        {g.totalValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{g.createdByName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO Dialog */}
      <Dialog open={poOpen} onOpenChange={setPoOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Supplier</Label>
              <Select value={poSupplier} onValueChange={setPoSupplier}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Expected Date</Label>
              <Input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPoOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast.success("PO draft created");
                setPoOpen(false);
              }}
            >
              Save PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Section / Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 bg-muted/40 border-b border-border">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment & Bill Confirmation
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4 text-xs">
            {/* Bill Summary Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex justify-between items-center">
              <div>
                <div className="text-[11px] text-muted-foreground">
                  Distributor: {supplierName(distributorId)}
                </div>
                <div className="font-mono font-bold text-sm text-foreground">
                  Bill #: {billNo || "Auto-Generated"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {totals.totalItems} Items ({totals.totalQty} Total Qty)
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold text-muted-foreground">Grand Total</div>
                <div className="text-xl font-black font-mono text-primary">
                  {currency}
                  {totals.grandTotal.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Select Payment Method */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cash", label: "Cash", icon: DollarSign },
                  { id: "upi", label: "UPI / QR", icon: QrCode },
                  { id: "card", label: "Card", icon: CreditCard },
                  { id: "netbanking", label: "Net Banking", icon: Building2 },
                  { id: "credit", label: "Credit (Pay Later)", icon: Wallet },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSel = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${isSel
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                        : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Paid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Amount Paid ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Txn / Ref # (Optional)</Label>
                <Input
                  placeholder="e.g. UPI-987654"
                  value={paymentTxnRef}
                  onChange={(e) => setPaymentTxnRef(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Balance Indicator */}
            <div className="flex justify-between items-center bg-muted p-2 rounded-md font-mono text-[11px]">
              <span>Balance Due:</span>
              <span
                className={
                  totals.grandTotal - amountPaid > 0
                    ? "text-destructive font-bold"
                    : "text-emerald-600 font-bold"
                }
              >
                {currency}
                {Math.max(0, totals.grandTotal - amountPaid).toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter className="p-3 bg-muted/30 border-t border-border flex justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleFinalizePaymentAndSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Payment & Generate Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Bill / Receipt Modal */}
      <Dialog open={generatedBillModalOpen} onOpenChange={setGeneratedBillModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 bg-primary/10 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <DialogTitle className="text-base font-bold">Purchase Bill Receipt</DialogTitle>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
              Generated & Saved
            </span>
          </DialogHeader>

          {viewingGrn && (
            <div className="p-6 space-y-4 text-xs bg-background max-h-[75vh] overflow-y-auto print:p-0">
              {/* Header Store & Invoice Details */}
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-primary">PharmacyOS</h2>
                  <p className="text-xs text-muted-foreground">Official Purchase Invoice Receipt</p>
                </div>
                <div className="text-right font-mono space-y-0.5">
                  <div className="text-sm font-bold text-foreground">
                    Invoice #{viewingGrn.invoiceNumber ?? viewingGrn.grnNumber}
                  </div>
                  <div className="text-[11px] text-muted-foreground">GRN: {viewingGrn.grnNumber}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Date: {format(new Date(viewingGrn.createdAt), "PPP")}
                  </div>
                </div>
              </div>

              {/* Distributor & Created By Info */}
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Distributor / Supplier
                  </span>
                  <div className="font-bold text-sm text-foreground">
                    {supplierName(viewingGrn.supplierId)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Recorded By
                  </span>
                  <div className="font-semibold text-xs text-foreground">
                    {viewingGrn.createdByName}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted text-muted-foreground font-semibold border-b border-border uppercase text-[10px]">
                    <tr>
                      <th className="p-2 text-left">Item Name</th>
                      <th className="p-2 text-center">Batch</th>
                      <th className="p-2 text-center">Expiry</th>
                      <th className="p-2 text-right">MRP</th>
                      <th className="p-2 text-right">PTR</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {viewingGrn.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-2 text-left font-sans font-medium text-foreground">
                          {item.medicineName}
                        </td>
                        <td className="p-2 text-center">{item.batchNumber}</td>
                        <td className="p-2 text-center">
                          {item.expiryDate ? item.expiryDate.slice(0, 7) : "—"}
                        </td>
                        <td className="p-2 text-right">
                          {currency}
                          {item.mrp.toFixed(2)}
                        </td>
                        <td className="p-2 text-right">
                          {currency}
                          {item.purchasePrice.toFixed(2)}
                        </td>
                        <td className="p-2 text-center font-bold">{item.quantity}</td>
                        <td className="p-2 text-right font-bold text-foreground">
                          {currency}
                          {(item.purchasePrice * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grand Total */}
              <div className="flex justify-end pt-2">
                <div className="w-56 space-y-1 text-right font-mono">
                  <div className="flex justify-between text-xs font-bold border-t border-border pt-2 text-base text-primary">
                    <span>Grand Total:</span>
                    <span>
                      {currency}
                      {viewingGrn.totalValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-3 bg-muted/40 border-t border-border flex justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setGeneratedBillModalOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Print Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
