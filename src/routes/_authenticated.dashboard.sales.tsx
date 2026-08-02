import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Minus, Trash2, Search, Receipt, X } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { applyStockMovement, pickBatchesFEFO } from "@/lib/stock";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { Sale, SaleItem, PaymentMode } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard/sales")({
  head: () => ({ meta: [{ title: "Sales & POS · PharmacyOS" }] }),
  component: SalesPage,
});

interface CartLine {
  medicineId: string;
  quantity: number;
  discountPct: number;
}

function SalesPage() {
  const { user } = useAuth();
  const has = usePermission();
  const medicines = useDb((d) => d.medicines);
  const batches = useDb((d) => d.batches);
  const inventoryStock = useDb((d) => d.inventoryStock);
  const sales = useDb((d) => d.sales);
  const currency = useDb((d) => d.settings.currency);

  const [tab, setTab] = useState("pos");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [payment, setPayment] = useState<PaymentMode>("cash");
  const [tender, setTender] = useState("");

  const canCreate = has("sales", "create");
  const canVoid = has("sales", "delete") || has("sales", "approve");

  const stockByMed = useMemo(() => {
    const map = new Map<string, number>();
    const now = Date.now();
    inventoryStock.forEach((s) => {
      const b = batches.find((b) => b.id === s.batchId);
      if (!b || new Date(b.expiryDate).getTime() <= now) return;
      map.set(b.medicineId, (map.get(b.medicineId) ?? 0) + s.quantityOnHand);
    });
    return map;
  }, [batches, inventoryStock]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return medicines
      .filter((m) => m.isActive)
      .filter((m) => {
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          (m.brandName ?? "").toLowerCase().includes(q) ||
          (m.genericName ?? "").toLowerCase().includes(q) ||
          (m.barcode ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [medicines, query]);

  const priceFor = (medicineId: string): number => {
    const picks = pickBatchesFEFO(batches, inventoryStock, medicineId, 1);
    if (!picks.length) return 0;
    const b = batches.find((x) => x.id === picks[0].batchId);
    return b?.sellingPrice ?? 0;
  };

  const addToCart = (medicineId: string) => {
    setCart((prev) => {
      const found = prev.find((l) => l.medicineId === medicineId);
      const available = stockByMed.get(medicineId) ?? 0;
      if (found) {
        if (found.quantity + 1 > available) {
          toast.error("No more stock available");
          return prev;
        }
        return prev.map((l) =>
          l.medicineId === medicineId ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      if (available <= 0) {
        toast.error("Out of stock");
        return prev;
      }
      return [...prev, { medicineId, quantity: 1, discountPct: 0 }];
    });
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let gstTotal = 0;
    const details: Array<{ line: CartLine; unitPrice: number; gst: number; net: number; lineTotal: number }> = [];
    cart.forEach((line) => {
      const med = medicines.find((m) => m.id === line.medicineId);
      if (!med) return;
      const unit = priceFor(line.medicineId);
      const gross = unit * line.quantity;
      const discount = (gross * line.discountPct) / 100;
      const net = gross - discount;
      const gst = (net * med.gstRate) / 100;
      subtotal += gross;
      discountTotal += discount;
      gstTotal += gst;
      details.push({ line, unitPrice: unit, gst, net, lineTotal: net + gst });
    });
    const grossTotal = subtotal - discountTotal + gstTotal;
    const rounded = Math.round(grossTotal);
    const roundOff = rounded - grossTotal;
    return { subtotal, discountTotal, gstTotal, grandTotal: rounded, roundOff, details };
  }, [cart, medicines, batches, inventoryStock]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setTender("");
  };

  const confirmCheckout = () => {
    if (!user) return;
    if (!cart.length) {
      toast.error("Cart is empty");
      return;
    }
    const tenderNum = Number(tender || totals.grandTotal);
    if (payment === "cash" && tenderNum < totals.grandTotal) {
      toast.error("Tender is less than total");
      return;
    }

    // Build sale items with FEFO batch splits (one SaleItem per batch used)
    const currentBatches = db.get().batches;
    const items: SaleItem[] = [];
    const stockPicks: ReturnType<typeof pickBatchesFEFO> = [];
    let ok = true;
    cart.forEach((line) => {
      const med = medicines.find((m) => m.id === line.medicineId);
      if (!med) return;
      const picks = pickBatchesFEFO(currentBatches, db.get().inventoryStock, line.medicineId, line.quantity);
      const picked = picks.reduce((s, p) => s + p.quantity, 0);
      if (picked < line.quantity) {
        toast.error(`Insufficient stock for ${med.name}`);
        ok = false;
        return;
      }
      picks.forEach((p) => {
        stockPicks.push(p);
        const b = currentBatches.find((x) => x.id === p.batchId);
        if (!b) return;
        const unit = b.sellingPrice;
        const gross = unit * p.quantity;
        const discount = (gross * line.discountPct) / 100;
        const net = gross - discount;
        const gst = (net * med.gstRate) / 100;
        items.push({
          medicineId: med.id,
          batchId: b.id,
          medicineName: med.name,
          batchNumber: b.batchNumber,
          quantity: p.quantity,
          unitPrice: unit,
          discountPct: line.discountPct,
          gstRate: med.gstRate,
          lineTotal: net + gst,
        });
      });
    });
    if (!ok) return;

    const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;
    const grand = totals.grandTotal;
    const sale: Sale = {
      id: db.uid(),
      invoiceNo,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
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
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
    };

    // Persist sale, then apply stock movements
    db.set((d) => {
      d.sales.unshift(sale);
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user.id,
        userName: user.name,
        action: `Sale ${invoiceNo} · ${currency}${grand.toLocaleString()}`,
        entityType: "sale",
        entityId: sale.id,
        details: { invoiceNo, grandTotal: grand, items: items.length },
        createdAt: new Date().toISOString(),
      });
    });
    stockPicks.forEach((p) => {
      applyStockMovement({
        batchId: p.batchId,
        locationType: p.locationType,
        rackCode: p.rackCode,
        movementType: "Sales Outward",
        quantityChange: -Math.abs(p.quantity),
        referenceDocId: sale.id,
        userId: user.id,
        userName: user.name,
      });
    });

    toast.success(`Sale ${invoiceNo} completed`);
    setCheckoutOpen(false);
    clearCart();
    setTab("history");
  };

  const voidSale = (sale: Sale) => {
    if (!user) return;
    if (sale.status === "voided") return;
    if (!confirm(`Void ${sale.invoiceNo}? Stock will be restored.`)) return;
    // Restore stock for each item
    sale.items.forEach((it) => {
      applyStockMovement({
        batchId: it.batchId,
        locationType: "Front Shelf",
        rackCode: "Returns",
        movementType: "Customer Return",
        quantityChange: Math.abs(it.quantity),
        referenceDocId: sale.id,
        userId: user.id,
        userName: user.name,
      });
    });
    db.set((d) => {
      const s = d.sales.find((x) => x.id === sale.id);
      if (s) {
        s.status = "voided";
        s.voidedAt = new Date().toISOString();
        s.voidedBy = user.id;
      }
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user.id,
        userName: user.name,
        action: `Voided sale ${sale.invoiceNo}`,
        entityType: "sale",
        entityId: sale.id,
        createdAt: new Date().toISOString(),
      });
    });
    toast.success(`${sale.invoiceNo} voided`);
  };

  const today = new Date().toDateString();
  const todaysSales = sales.filter((s) => new Date(s.createdAt).toDateString() === today);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & POS"
        description="Fast counter billing with automatic FEFO batch selection."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pos" disabled={!canCreate}>Point of sale</TabsTrigger>
          <TabsTrigger value="history">Sales history</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search medicines by name, brand, generic, or barcode…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {results.map((m) => {
                    const stock = stockByMed.get(m.id) ?? 0;
                    const price = priceFor(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => addToCart(m.id)}
                        disabled={stock <= 0}
                        className="group flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3 text-left transition hover:border-primary hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{m.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {m.brandName ?? m.genericName ?? "—"} · Stock {stock}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-semibold">{currency}{price.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">GST {m.gstRate}%</p>
                        </div>
                      </button>
                    );
                  })}
                  {!results.length && (
                    <p className="col-span-full py-6 text-center text-sm text-muted-foreground">No medicines match.</p>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold">Cart ({cart.length})</h3>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                      <X className="mr-1 h-3.5 w-3.5" /> Clear
                    </Button>
                  )}
                </div>
                {cart.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Add medicines from above to start a sale.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="px-3 py-2 font-medium text-right">Price</th>
                        <th className="px-3 py-2 font-medium text-center">Qty</th>
                        <th className="px-3 py-2 font-medium text-right w-24">Disc %</th>
                        <th className="px-3 py-2 font-medium text-right">Total</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {cart.map((line) => {
                        const med = medicines.find((m) => m.id === line.medicineId);
                        const detail = totals.details.find((d) => d.line === line);
                        if (!med || !detail) return null;
                        const available = stockByMed.get(line.medicineId) ?? 0;
                        return (
                          <tr key={line.medicineId}>
                            <td className="px-3 py-2">
                              <p className="font-medium">{med.name}</p>
                              <p className="text-xs text-muted-foreground">GST {med.gstRate}%</p>
                            </td>
                            <td className="px-3 py-2 text-right font-mono">{currency}{detail.unitPrice.toFixed(2)}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    setCart((prev) =>
                                      prev
                                        .map((l) =>
                                          l.medicineId === line.medicineId
                                            ? { ...l, quantity: Math.max(0, l.quantity - 1) }
                                            : l,
                                        )
                                        .filter((l) => l.quantity > 0),
                                    )
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-mono">{line.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    if (line.quantity >= available) {
                                      toast.error("No more stock available");
                                      return;
                                    }
                                    setCart((prev) =>
                                      prev.map((l) =>
                                        l.medicineId === line.medicineId
                                          ? { ...l, quantity: l.quantity + 1 }
                                          : l,
                                      ),
                                    );
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={line.discountPct}
                                onChange={(e) =>
                                  setCart((prev) =>
                                    prev.map((l) =>
                                      l.medicineId === line.medicineId
                                        ? { ...l, discountPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }
                                        : l,
                                    ),
                                  )
                                }
                                className="h-8 text-right font-mono"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold">
                              {currency}{detail.lineTotal.toFixed(2)}
                            </td>
                            <td className="px-3 py-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  setCart((prev) => prev.filter((l) => l.medicineId !== line.medicineId))
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <aside className="sticky top-4 h-fit space-y-3 rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Order summary</h3>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-mono">{currency}{totals.subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="font-mono text-destructive">-{currency}{totals.discountTotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">GST</dt>
                  <dd className="font-mono">{currency}{totals.gstTotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-xs">
                  <dt className="text-muted-foreground">Round off</dt>
                  <dd className="font-mono">{currency}{totals.roundOff.toFixed(2)}</dd>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <dt>Grand total</dt>
                  <dd className="font-mono">{currency}{totals.grandTotal.toFixed(2)}</dd>
                </div>
              </dl>
              <Button className="w-full" size="lg" disabled={!cart.length || !canCreate} onClick={() => setCheckoutOpen(true)}>
                <Receipt className="mr-2 h-4 w-4" /> Checkout
              </Button>
              {!canCreate && (
                <p className="text-center text-xs text-muted-foreground">You don't have permission to create sales.</p>
              )}
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Today's revenue</p>
              <p className="mt-1 font-mono text-xl font-semibold">
                {currency}
                {todaysSales
                  .filter((s) => s.status === "completed")
                  .reduce((a, b) => a + b.grandTotal, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Today's invoices</p>
              <p className="mt-1 font-mono text-xl font-semibold">{todaysSales.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Total sales</p>
              <p className="mt-1 font-mono text-xl font-semibold">{sales.length}</p>
            </div>
          </div>

          {sales.length === 0 ? (
            <EmptyState title="No sales yet" description="Complete a sale in the POS tab to see it here." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Invoice</th>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Customer</th>
                    <th className="px-4 py-2.5 font-medium">Cashier</th>
                    <th className="px-4 py-2.5 font-medium">Payment</th>
                    <th className="px-4 py-2.5 font-medium text-right">Items</th>
                    <th className="px-4 py-2.5 font-medium text-right">Total</th>
                    <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sales.map((s) => (
                    <tr key={s.id} className={s.status === "voided" ? "opacity-50" : "hover:bg-muted/30"}>
                      <td className="px-4 py-3 font-mono font-medium">
                        <Link to="/dashboard/sales/$saleId" params={{ saleId: s.id }} className="hover:underline">
                          {s.invoiceNo}
                        </Link>
                        {s.status === "voided" && (
                          <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">VOID</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(s.createdAt), "MMM d, HH:mm")}</td>
                      <td className="px-4 py-3">{s.customerName ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.createdByName}</td>
                      <td className="px-4 py-3 capitalize">{s.paymentMode}</td>
                      <td className="px-4 py-3 text-right font-mono">{s.items.length}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {currency}{s.grandTotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canVoid && s.status === "completed" && (
                          <Button variant="ghost" size="sm" onClick={() => voidSale(s)}>
                            Void
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name">Customer name</Label>
                <Input id="cust-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Phone</Label>
                <Input id="cust-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Payment mode</Label>
                <Select value={payment} onValueChange={(v) => setPayment(v as PaymentMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tender">Tender</Label>
                <Input
                  id="tender"
                  type="number"
                  value={tender}
                  onChange={(e) => setTender(e.target.value)}
                  placeholder={String(totals.grandTotal)}
                />
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grand total</span>
                <span className="font-mono font-semibold">{currency}{totals.grandTotal.toFixed(2)}</span>
              </div>
              {payment === "cash" && tender && (
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Change</span>
                  <span className="font-mono font-semibold">
                    {currency}{Math.max(0, Number(tender) - totals.grandTotal).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button onClick={confirmCheckout}>Confirm sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
