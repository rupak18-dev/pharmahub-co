import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { format, addDays } from "date-fns";
import type { GRN, GRNItem, Batch, Medicine } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard/purchases")({
  head: () => ({ meta: [{ title: "Purchases · eVitalRx Style · PharmacyOS" }] }),
  component: PurchasesPage,
});

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

  // Submit Purchase Bill
  const handleSavePurchase = () => {
    if (!user) return toast.error("User session not found");
    if (!distributorId) return toast.error("Please select a Distributor");
    if (!billNo.trim()) return toast.error("Please enter a Bill / Order No.");
    if (items.length === 0) return toast.error("Please add at least 1 item to the purchase bill");

    const now = new Date().toISOString();
    const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;
    const createdBatches: Batch[] = [];
    const grnItems: GRNItem[] = [];

    items.forEach((it) => {
      const batchId = db.uid();

      let expIso = it.expiryDate;
      if (expIso.length === 7) {
        expIso = `${expIso}-28`;
      }
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
        supplierId: distributorId,
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
      supplierId: distributorId,
      invoiceNumber: billNo,
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
        action: `eVitalRx Purchase Bill #${billNo} recorded (${grnNumber})`,
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
        reason: `Purchase Bill #${billNo} (${grnNumber})`,
        referenceId: grn.id,
        userId: user.id,
        userName: user.name,
      });
    });

    toast.success(`Purchase Bill #${billNo} saved! ${createdBatches.length} batches added to stock.`);

    // Reset Form
    setBillNo("");
    setItems([]);
    setSelectedPoId("");
  };

  const supplierName = useMemo(() => {
    const m = new Map(suppliers.map((s) => [s.id, s.name]));
    return (id: string) => m.get(id) ?? "—";
  }, [suppliers]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background text-foreground">
      {/* Top Bar / Header matching eVitalRx */}
      <div className="border-b border-border bg-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Left Breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            <span>Purchase</span>
            <span className="mx-1">&gt;</span>
            <span className="text-primary font-bold">New</span>
            <Lightbulb className="ml-1.5 h-4 w-4 text-amber-500 fill-amber-400/20" />
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Mode Tabs */}
          <div className="flex items-center rounded-lg bg-muted p-0.5 text-xs">
            <button
              onClick={() => setViewTab("entry")}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${
                viewTab === "entry"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              + eVitalRx Purchase Entry
            </button>
            <button
              onClick={() => setViewTab("history")}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${
                viewTab === "history"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Purchase History ({grns.length})
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

          {/* Owner Role Badge */}
          <Select defaultValue="Owner">
            <SelectTrigger className="h-8 text-xs bg-background w-[100px] border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Owner">Owner</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Type Badge */}
          <button
            onClick={() =>
              setPaymentType((prev) => (prev === "credit" ? "cash" : prev === "cash" ? "upi" : "credit"))
            }
            className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1 border transition-colors ${
              paymentType === "credit"
                ? "bg-destructive/10 text-destructive border-destructive/30"
                : paymentType === "cash"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : "bg-blue-500/10 text-blue-600 border-blue-500/30"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="capitalize">{paymentType}</span>
          </button>

          {/* Primary Save Button */}
          {canCreate && (
            <Button
              size="sm"
              onClick={handleSavePurchase}
              className="h-8 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1 shadow"
            >
              <span>Save</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-80" />
            </Button>
          )}

          <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewTab === "entry" ? (
        <div className="flex-1 flex flex-col justify-between">
          {/* Main Form Body */}
          <div className="p-4 space-y-4">
            {/* Row 1: Distributor, Bill No, Dates Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-card p-3 rounded-lg border border-border/70 shadow-sm">
              {/* Distributor */}
              <div className="md:col-span-4 space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Distributor <Info className="h-3 w-3 text-muted-foreground/70" />
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
              <div className="md:col-span-3 space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Bill No. / Order No.</Label>
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="Enter Invoice #"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    className="h-9 text-xs font-mono bg-background"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 text-xs px-2.5 bg-muted text-muted-foreground hover:text-foreground shrink-0 font-medium"
                    onClick={() => {
                      if (!billNo) setBillNo(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
                      toast.success("Fetched bill reference");
                    }}
                  >
                    Fetch
                  </Button>
                </div>
              </div>

              {/* Bill Date */}
              <div className="md:col-span-2.5 space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Bill Date</Label>
                <Input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              {/* Due Date */}
              <div className="md:col-span-2.5 space-y-1">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  Due Date <Info className="h-3 w-3 text-muted-foreground/70" />
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>

            {/* eVitalRx Items Table Container */}
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col">
              {/* Table Column Headers */}
              <div className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 grid grid-cols-12 gap-1 items-center">
                {/* Item Name + LIFA Toggle */}
                <div className="col-span-3 flex items-center justify-between pr-2">
                  <span className="text-foreground">Item Name</span>
                  <div className="flex items-center gap-1 bg-background border border-border rounded px-1.5 py-0.5 text-[10px] lowercase">
                    <button
                      onClick={() => setLifaMode("LIFA")}
                      className={`px-1 rounded font-bold ${
                        lifaMode === "LIFA" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      LIFA
                    </button>
                    <button
                      onClick={() => setLifaMode("LILA")}
                      className={`px-1 rounded font-bold ${
                        lifaMode === "LILA" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      LILA
                    </button>
                  </div>
                </div>

                <div className="col-span-1 text-center flex items-center justify-center gap-0.5">
                  Batch <Info className="h-2.5 w-2.5" />
                </div>
                <div className="col-span-1 text-center flex items-center justify-center gap-0.5">
                  Expiry <Info className="h-2.5 w-2.5" />
                </div>
                <div className="col-span-1 text-right flex items-center justify-end gap-0.5 pr-1">
                  MRP <Info className="h-2.5 w-2.5" />
                </div>
                <div className="col-span-1 text-right flex items-center justify-end gap-0.5 pr-1">
                  PTR <Info className="h-2.5 w-2.5" />
                </div>
                <div className="col-span-1 text-center flex items-center justify-center gap-0.5">
                  Qty <Info className="h-2.5 w-2.5" />
                </div>
                <div className="col-span-1 text-center flex items-center justify-center gap-0.5">
                  Free <Info className="h-2.5 w-2.5" />
                </div>
                <div className="col-span-1 text-right flex items-center justify-end gap-0.5 pr-1">
                  Disc% <Info className="h-2.5 w-2.5" />
                </div>
                <div className="col-span-1 text-center flex items-center justify-center gap-0.5">
                  GST% <Info className="h-2.5 w-2.5" />
                </div>
                <div className="col-span-1 text-right font-bold text-foreground pr-2">Amount</div>
              </div>

              {/* Live Search Row Input */}
              <div className="p-2 border-b border-border bg-blue-50/40 dark:bg-blue-950/20 relative">
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
                    className="pl-9 h-9 text-xs bg-background border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500 font-medium"
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

              {/* Items List or eVitalRx Empty Graphic */}
              {items.length === 0 ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center bg-background/50">
                  <div className="w-52 h-44 rounded-xl border border-dashed border-border bg-card p-4 flex flex-col items-center justify-center shadow-inner mb-3">
                    <div className="w-16 h-24 border-2 border-primary/40 rounded-lg bg-primary/5 flex flex-col items-center justify-center p-2 mb-2 relative">
                      <div className="w-10 h-1 bg-primary/40 rounded mb-1" />
                      <div className="w-8 h-8 rounded border border-primary/30 flex items-center justify-center bg-background">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[8px] font-bold text-primary mt-1">Scan OTC</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">Sales / Purchase</span>
                    <span className="text-[10px] text-muted-foreground">Fast Barcode & Item Bill</span>
                  </div>

                  <button
                    onClick={() => {
                      if (medicines.length > 0) addMedicineToGrid(medicines[0]);
                      else toast.info("No medicines available in database yet");
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Video className="h-3.5 w-3.5" /> Video : Use Barcode & Make Purchase Bill ▶
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
                            className="h-7 text-xs font-mono text-center px-1 bg-background"
                          />
                        </div>

                        {/* Expiry Date */}
                        <div className="col-span-1">
                          <Input
                            type="text"
                            placeholder="YYYY-MM"
                            value={item.expiryDate}
                            onChange={(e) => updateLineItem(item.id, { expiryDate: e.target.value })}
                            className="h-7 text-xs text-center px-1 bg-background"
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
                            className="h-7 text-xs text-right px-1 font-mono bg-background"
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
                            className="h-7 text-xs text-right px-1 font-mono bg-background"
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
                            className="h-7 text-xs text-center px-1 font-mono bg-background font-bold"
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
                            className="h-7 text-xs text-center px-1 font-mono bg-background"
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
                            className="h-7 text-xs text-right px-1 font-mono bg-background"
                          />
                        </div>

                        {/* GST% */}
                        <div className="col-span-1">
                          <select
                            value={item.gstRate}
                            onChange={(e) =>
                              updateLineItem(item.id, { gstRate: Number(e.target.value) || 0 })
                            }
                            className="h-7 text-xs text-center w-full rounded border border-border bg-background"
                          >
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

          {/* Sticky Bottom eVitalRx Red/Dark Summary Bar */}
          <div className="bg-red-700 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 shadow-lg text-xs">
            {/* Left Credit Note indicator */}
            <div className="flex items-center gap-2">
              <span className="bg-white/10 px-3 py-1 rounded font-semibold tracking-wide">
                No CN Adjusted
              </span>
            </div>

            {/* Right Totals Breakdown */}
            <div className="flex items-center gap-4 font-medium flex-wrap">
              <span>
                <strong>{totals.totalQty}</strong> Qty.
              </span>
              <span>•</span>
              <span>
                <strong>{totals.totalItems}</strong> Items
              </span>
              <span>•</span>
              <span>
                <strong>{totals.avgMarginPct}%</strong> Margin
              </span>
              <span>•</span>
              <span>
                <strong>
                  {currency}
                  {totals.totalGst.toFixed(2)}
                </strong>{" "}
                GST
              </span>
              <span>•</span>
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded border border-white/20">
                <span className="text-white/80">Net</span>
                <span className="text-sm font-extrabold font-mono text-white">
                  {currency}
                  {totals.grandTotal.toFixed(2)}
                </span>
                <ChevronDown className="h-4 w-4 text-white/70 cursor-pointer" />
              </div>

              {canCreate && (
                <Button
                  onClick={handleSavePurchase}
                  className="bg-white text-red-700 hover:bg-white/90 font-bold text-xs h-8 px-4 shadow"
                >
                  Save Bill
                </Button>
              )}
            </div>
          </div>
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
    </div>
  );
}
