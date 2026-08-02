import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { applyStockMovement } from "@/lib/stock";
import { purchaseGuard, PURCHASE_GUARD_DAYS } from "@/lib/expiry";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { GRN, GRNItem, POItem, PurchaseOrder, POStatus, Batch } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard/purchases")({
  head: () => ({ meta: [{ title: "Purchases · PharmacyOS" }] }),
  component: PurchasesPage,
});

interface POLineDraft {
  medicineId: string;
  quantity: number;
  expectedPrice: number;
}
interface GRNLineDraft {
  medicineId: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  mrp: number;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
}

function PurchasesPage() {
  const { user } = useAuth();
  const has = usePermission();
  const suppliers = useDb((d) => d.suppliers);
  const medicines = useDb((d) => d.medicines);
  const pos = useDb((d) => d.purchaseOrders);
  const grns = useDb((d) => d.grns);
  const currency = useDb((d) => d.settings.currency);

  const canCreate = has("purchases", "create");

  // PO dialog state
  const [poOpen, setPoOpen] = useState(false);
  const [poSupplier, setPoSupplier] = useState("");
  const [poDate, setPoDate] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poLines, setPoLines] = useState<POLineDraft[]>([
    { medicineId: "", quantity: 1, expectedPrice: 0 },
  ]);

  // GRN dialog state
  const [grnOpen, setGrnOpen] = useState(false);
  const [grnPoId, setGrnPoId] = useState<string>("");
  const [grnSupplier, setGrnSupplier] = useState("");
  const [grnInvoice, setGrnInvoice] = useState("");
  const [grnInvoiceDate, setGrnInvoiceDate] = useState("");
  const [grnLines, setGrnLines] = useState<GRNLineDraft[]>([blankGRNLine()]);

  function blankGRNLine(): GRNLineDraft {
    return {
      medicineId: "",
      batchNumber: "",
      mfgDate: "",
      expiryDate: "",
      mrp: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      quantity: 0,
    };
  }

  const resetPo = () => {
    setPoSupplier("");
    setPoDate("");
    setPoNotes("");
    setPoLines([{ medicineId: "", quantity: 1, expectedPrice: 0 }]);
  };
  const resetGrn = () => {
    setGrnPoId("");
    setGrnSupplier("");
    setGrnInvoice("");
    setGrnInvoiceDate("");
    setGrnLines([blankGRNLine()]);
  };

  const submitPo = () => {
    if (!user) return;
    if (!poSupplier) return toast.error("Select a supplier");
    const items: POItem[] = poLines
      .filter((l) => l.medicineId && l.quantity > 0)
      .map((l) => {
        const m = medicines.find((x) => x.id === l.medicineId);
        return {
          medicineId: l.medicineId,
          medicineName: m?.name ?? "",
          quantity: l.quantity,
          expectedPrice: l.expectedPrice,
        };
      });
    if (!items.length) return toast.error("Add at least one line item");

    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const po: PurchaseOrder = {
      id: db.uid(),
      poNumber,
      supplierId: poSupplier,
      expectedDate: poDate || undefined,
      items,
      status: "placed",
      notes: poNotes || undefined,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };
    db.set((d) => {
      d.purchaseOrders.unshift(po);
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user.id,
        userName: user.name,
        action: `Purchase order ${poNumber} created`,
        entityType: "purchase_order",
        entityId: po.id,
        createdAt: new Date().toISOString(),
      });
    });
    toast.success(`${poNumber} created`);
    setPoOpen(false);
    resetPo();
  };

  const setPoStatus = (id: string, status: POStatus) => {
    if (!user) return;
    db.set((d) => {
      const p = d.purchaseOrders.find((x) => x.id === id);
      if (p) p.status = status;
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user.id,
        userName: user.name,
        action: `Purchase order ${p?.poNumber ?? id} → ${status}`,
        entityType: "purchase_order",
        entityId: id,
        createdAt: new Date().toISOString(),
      });
    });
  };

  const submitGrn = () => {
    if (!user) return;
    if (!grnSupplier) return toast.error("Select a supplier");
    const validLines = grnLines.filter(
      (l) => l.medicineId && l.batchNumber && l.expiryDate && l.quantity > 0,
    );
    if (!validLines.length) return toast.error("Add at least one complete line");

    const blocked = validLines.filter((l) => purchaseGuard(l.expiryDate).level === "block");
    if (blocked.length) {
      const names = blocked.map((l) => l.batchNumber).join(", ");
      return toast.error(
        `Purchase guard blocked ${names} — batches expiring within 7 days (or already expired) cannot be received.`,
      );
    }

    const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const createdBatches: Batch[] = [];
    const items: GRNItem[] = [];
    let totalValue = 0;

    validLines.forEach((l) => {
      const med = medicines.find((m) => m.id === l.medicineId);
      const batchId = db.uid();
      const batch: Batch = {
        id: batchId,
        medicineId: l.medicineId,
        batchNumber: l.batchNumber,
        mfgDate: l.mfgDate || now,
        expiryDate: new Date(l.expiryDate).toISOString(),
        mrp: l.mrp,
        purchasePrice: l.purchasePrice,
        sellingPrice: l.sellingPrice,
        supplierId: grnSupplier,
        currentStock: l.quantity,
        createdAt: now,
      };
      createdBatches.push(batch);
      items.push({
        medicineId: l.medicineId,
        batchId,
        medicineName: med?.name ?? "",
        batchNumber: l.batchNumber,
        mfgDate: batch.mfgDate,
        expiryDate: batch.expiryDate,
        mrp: l.mrp,
        purchasePrice: l.purchasePrice,
        sellingPrice: l.sellingPrice,
        quantity: l.quantity,
      });
      totalValue += l.quantity * l.purchasePrice;
    });

    const grn: GRN = {
      id: db.uid(),
      grnNumber,
      supplierId: grnSupplier,
      invoiceNumber: grnInvoice || undefined,
      invoiceDate: grnInvoiceDate || undefined,
      poId: grnPoId || undefined,
      items,
      totalValue,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: now,
    };

    db.set((d) => {
      d.batches.push(...createdBatches);
      d.grns.unshift(grn);
      if (grnPoId) {
        const po = d.purchaseOrders.find((p) => p.id === grnPoId);
        if (po) po.status = "received";
      }
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user.id,
        userName: user.name,
        action: `GRN ${grnNumber} · ${items.length} batches`,
        entityType: "grn",
        entityId: grn.id,
        details: { totalValue },
        createdAt: now,
      });
    });

    items.forEach((it) => {
      applyStockMovement({
        batchId: it.batchId,
        locationType: "Front Shelf",
        rackCode: "GRN",
        movementType: "Purchase Inward",
        quantityChange: it.quantity,
        referenceDocId: grn.id,
        userId: user.id,
        userName: user.name,
      });
    });

    toast.success(`${grnNumber} received · ${items.length} new batches`);
    setGrnOpen(false);
    resetGrn();
  };

  const supplierName = useMemo(() => {
    const m = new Map(suppliers.map((s) => [s.id, s.name]));
    return (id: string) => m.get(id) ?? "—";
  }, [suppliers]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Manage purchase orders and record goods received."
      />

      <Tabs defaultValue="grns">
        <TabsList>
          <TabsTrigger value="pos">Purchase orders ({pos.length})</TabsTrigger>
          <TabsTrigger value="grns">Goods received ({grns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4 space-y-3">
          <div className="flex justify-end">
            {canCreate && (
              <Button size="sm" onClick={() => setPoOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> New purchase order
              </Button>
            )}
          </div>
          {pos.length === 0 ? (
            <EmptyState
              title="No purchase orders"
              description="Create a PO to track expected deliveries."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">PO #</th>
                    <th className="px-4 py-2.5 font-medium">Supplier</th>
                    <th className="px-4 py-2.5 font-medium">Expected</th>
                    <th className="px-4 py-2.5 font-medium text-right">Lines</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pos.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-medium">{p.poNumber}</td>
                      <td className="px-4 py-3">{supplierName(p.supplierId)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.expectedDate ? format(new Date(p.expectedDate), "PP") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{p.items.length}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs capitalize">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.status !== "cancelled" && p.status !== "received" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPoStatus(p.id, "cancelled")}
                          >
                            Cancel
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

        <TabsContent value="grns" className="mt-4 space-y-3">
          <div className="flex justify-end">
            {canCreate && (
              <Button size="sm" onClick={() => setGrnOpen(true)}>
                <PackagePlus className="mr-1 h-4 w-4" /> Receive goods
              </Button>
            )}
          </div>
          {grns.length === 0 ? (
            <EmptyState
              title="No GRNs recorded"
              description="Record incoming stock and PharmacyOS will create batches automatically."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">GRN #</th>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Supplier</th>
                    <th className="px-4 py-2.5 font-medium">Invoice</th>
                    <th className="px-4 py-2.5 font-medium text-right">Batches</th>
                    <th className="px-4 py-2.5 font-medium text-right">Value</th>
                    <th className="px-4 py-2.5 font-medium">Received by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {grns.map((g) => (
                    <tr key={g.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-medium">{g.grnNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(g.createdAt), "PP")}
                      </td>
                      <td className="px-4 py-3">{supplierName(g.supplierId)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{g.invoiceNumber ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-mono">{g.items.length}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {currency}
                        {g.totalValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{g.createdByName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* PO Dialog */}
      <Dialog
        open={poOpen}
        onOpenChange={(o) => {
          setPoOpen(o);
          if (!o) resetPo();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New purchase order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Select value={poSupplier} onValueChange={setPoSupplier}>
                  <SelectTrigger>
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
              <div className="space-y-1.5">
                <Label>Expected date</Label>
                <Input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPoLines((l) => [...l, { medicineId: "", quantity: 1, expectedPrice: 0 }])
                  }
                >
                  <Plus className="mr-1 h-3 w-3" /> Add line
                </Button>
              </div>
              <div className="space-y-2">
                {poLines.map((line, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2">
                    <Select
                      value={line.medicineId}
                      onValueChange={(v) =>
                        setPoLines((prev) =>
                          prev.map((l, ix) => (ix === i ? { ...l, medicineId: v } : l)),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines
                          .filter((m) => m.isActive)
                          .map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        setPoLines((prev) =>
                          prev.map((l, ix) =>
                            ix === i ? { ...l, quantity: Number(e.target.value) || 0 } : l,
                          ),
                        )
                      }
                      placeholder="Qty"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.expectedPrice}
                      onChange={(e) =>
                        setPoLines((prev) =>
                          prev.map((l, ix) =>
                            ix === i ? { ...l, expectedPrice: Number(e.target.value) || 0 } : l,
                          ),
                        )
                      }
                      placeholder="Price"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setPoLines((prev) => prev.filter((_, ix) => ix !== i))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={poNotes} onChange={(e) => setPoNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPoOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPo}>Create PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GRN Dialog */}
      <Dialog
        open={grnOpen}
        onOpenChange={(o) => {
          setGrnOpen(o);
          if (!o) resetGrn();
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Receive goods</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Link to PO (optional)</Label>
                <Select
                  value={grnPoId || "none"}
                  onValueChange={(v) => {
                    const val = v === "none" ? "" : v;
                    setGrnPoId(val);
                    const po = pos.find((p) => p.id === val);
                    if (po) setGrnSupplier(po.supplierId);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No PO —</SelectItem>
                    {pos
                      .filter((p) => p.status === "placed")
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.poNumber} · {supplierName(p.supplierId)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Select value={grnSupplier} onValueChange={setGrnSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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
              <div className="space-y-1.5">
                <Label>Invoice #</Label>
                <Input value={grnInvoice} onChange={(e) => setGrnInvoice(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Invoice date</Label>
              <Input
                type="date"
                value={grnInvoiceDate}
                onChange={(e) => setGrnInvoiceDate(e.target.value)}
                className="max-w-xs"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Batches received</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGrnLines((l) => [...l, blankGRNLine()])}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add batch
                </Button>
              </div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto">
                {grnLines.map((line, i) => {
                  const guard = line.expiryDate ? purchaseGuard(line.expiryDate) : null;
                  return (
                    <div key={i} className="rounded-md border border-border p-3">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Select
                          value={line.medicineId}
                          onValueChange={(v) =>
                            setGrnLines((prev) =>
                              prev.map((l, ix) => (ix === i ? { ...l, medicineId: v } : l)),
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Medicine" />
                          </SelectTrigger>
                          <SelectContent>
                            {medicines
                              .filter((m) => m.isActive)
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Batch #"
                          value={line.batchNumber}
                          onChange={(e) =>
                            setGrnLines((prev) =>
                              prev.map((l, ix) =>
                                ix === i ? { ...l, batchNumber: e.target.value } : l,
                              ),
                            )
                          }
                        />
                        <Input
                          type="date"
                          placeholder="Mfg"
                          value={line.mfgDate}
                          onChange={(e) =>
                            setGrnLines((prev) =>
                              prev.map((l, ix) =>
                                ix === i ? { ...l, mfgDate: e.target.value } : l,
                              ),
                            )
                          }
                        />
                        <Input
                          type="date"
                          placeholder="Expiry"
                          value={line.expiryDate}
                          onChange={(e) =>
                            setGrnLines((prev) =>
                              prev.map((l, ix) =>
                                ix === i ? { ...l, expiryDate: e.target.value } : l,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <Input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          value={line.quantity || ""}
                          onChange={(e) =>
                            setGrnLines((prev) =>
                              prev.map((l, ix) =>
                                ix === i ? { ...l, quantity: Number(e.target.value) || 0 } : l,
                              ),
                            )
                          }
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="MRP"
                          value={line.mrp || ""}
                          onChange={(e) =>
                            setGrnLines((prev) =>
                              prev.map((l, ix) =>
                                ix === i ? { ...l, mrp: Number(e.target.value) || 0 } : l,
                              ),
                            )
                          }
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Purchase ₹"
                          value={line.purchasePrice || ""}
                          onChange={(e) =>
                            setGrnLines((prev) =>
                              prev.map((l, ix) =>
                                ix === i ? { ...l, purchasePrice: Number(e.target.value) || 0 } : l,
                              ),
                            )
                          }
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Selling ₹"
                          value={line.sellingPrice || ""}
                          onChange={(e) =>
                            setGrnLines((prev) =>
                              prev.map((l, ix) =>
                                ix === i ? { ...l, sellingPrice: Number(e.target.value) || 0 } : l,
                              ),
                            )
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setGrnLines((prev) => prev.filter((_, ix) => ix !== i))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      {guard && (
                        <div className="mt-2">
                          {guard.level === "block" ? (
                            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                              {guard.daysLeft < 0
                                ? `Already expired (${Math.abs(guard.daysLeft)}d ago) — receiving blocked`
                                : `Expires in ${guard.daysLeft}d — within 7-day block window. Receiving blocked.`}
                            </p>
                          ) : guard.level === "warning" ? (
                            <p className="rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-xs font-medium text-warning-foreground">
                              Expires in {guard.daysLeft}d — inside the {PURCHASE_GUARD_DAYS}-day
                              purchase guard. Lot will be flagged near-expiry at receiving.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrnOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitGrn}>Confirm receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
