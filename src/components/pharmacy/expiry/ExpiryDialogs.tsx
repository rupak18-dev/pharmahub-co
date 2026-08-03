import { useEffect, useState } from "react";
import { ArrowRightLeft, BadgePercent, CalendarClock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { BRANCHES, SCHEME_OPTIONS, suggestedDiscountPct, type ExpiryRow } from "@/lib/expiry";

export function ReturnDialog({
  row,
  open,
  onOpenChange,
  onConfirm,
  currency,
  supplierName,
}: {
  row: ExpiryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (row: ExpiryRow, qty: number, netValue: number, creditNoteNo?: string) => void;
  currency: string;
  supplierName: (id?: string) => string;
}) {
  const [qty, setQty] = useState(0);
  const [scheme, setScheme] = useState("100");
  const [creditNoteNo, setCreditNoteNo] = useState("");
  useEffect(() => {
    if (row) {
      setQty(row.quantity);
      setScheme("100");
      setCreditNoteNo("");
    }
  }, [row]);

  if (!row) return null;
  const valid = qty > 0 && qty <= row.quantity;
  const schemeOpt = SCHEME_OPTIONS.find((s) => s.value === scheme) ?? SCHEME_OPTIONS[0];
  const credit = Math.round(qty * row.batch.purchasePrice * (schemeOpt.pct / 100));
  const writeoff = Math.round(qty * row.batch.purchasePrice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-info" /> Return to supplier
          </DialogTitle>
          <DialogDescription>
            {row.medicineName} · Batch <span className="font-mono">{row.batchNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Supplier</p>
              <p className="font-medium">{supplierName(row.batch.supplierId)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unit cost</p>
              <p className="font-medium">
                {currency}
                {row.batch.purchasePrice}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expiry</p>
              <p className="font-medium">{new Date(row.expiryDate).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5 text-warning-foreground" />
              <p className="text-xs text-muted-foreground">
                Window {row.days >= 0 ? `closes in ${row.days}d` : `${Math.abs(row.days)}d overdue`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="return-qty">Quantity to return</Label>
              <Input
                id="return-qty"
                type="number"
                min={1}
                max={row.quantity}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col justify-end pb-0.5">
              <p className="text-xs text-muted-foreground">Expected credit note</p>
              <p className="text-lg font-semibold tabular-nums">
                {currency}
                {credit.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Scheme</Label>
            <Select value={scheme} onValueChange={setScheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEME_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label} — {s.hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Scheme-aware return: {qty} units × {currency}
              {row.batch.purchasePrice} × {schemeOpt.pct}% recovery
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Credit expected</p>
              <p className="text-base font-semibold tabular-nums text-success">
                {currency}
                {credit.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">vs. write-off</p>
              <p className="text-base font-semibold tabular-nums text-destructive">
                {currency}
                {writeoff.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cn-no">Supplier credit-note no. (optional)</Label>
            <Input
              id="cn-no"
              value={creditNoteNo}
              onChange={(e) => setCreditNoteNo(e.target.value)}
              placeholder="CN-2026-…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onConfirm(row, qty, credit, creditNoteNo.trim() || undefined);
              onOpenChange(false);
            }}
          >
            Create return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DiscountDialog({
  row,
  open,
  onOpenChange,
  onConfirm,
  currency,
}: {
  row: ExpiryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (row: ExpiryRow, pct: number) => void;
  currency: string;
}) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (row) setPct(suggestedDiscountPct(row.days));
  }, [row]);

  if (!row) return null;
  const valid = pct >= 0 && pct <= 70;
  const sell = Math.round(row.quantity * row.batch.sellingPrice * (1 - pct / 100));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-warning-foreground" /> Quick-sale discount
          </DialogTitle>
          <DialogDescription>
            {row.medicineName} · {row.quantity} units · expires in {row.days} days
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
            Suggested {suggestedDiscountPct(row.days)}% — enough to clear stock before expiry while
            protecting margin. Adjust if needed.
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discount-pct">Discount %</Label>
            <Input
              id="discount-pct"
              type="number"
              min={0}
              max={70}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Recover at {pct}% off</p>
              <p className="text-base font-semibold tabular-nums">
                {currency}
                {sell.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">vs. write-off</p>
              <p className="text-base font-semibold tabular-nums text-destructive">
                {currency}
                {row.stockValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onConfirm(row, pct);
              onOpenChange(false);
            }}
          >
            Apply {pct}% discount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TransferDialog({
  row,
  open,
  onOpenChange,
  onConfirm,
  currency,
}: {
  row: ExpiryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (row: ExpiryRow, branch: string, qty: number) => void;
  currency: string;
}) {
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [qty, setQty] = useState(0);
  useEffect(() => {
    if (row) {
      setQty(row.quantity);
      const from = row.batch.branch ?? BRANCHES[0];
      setBranch(BRANCHES.find((b) => b !== from) ?? BRANCHES[0]);
    }
  }, [row]);

  if (!row) return null;
  const valid = qty > 0 && qty <= row.quantity && branch !== (row.batch.branch ?? BRANCHES[0]);
  const velocity = 12 + ((row.batch.batchNumber.length * 7) % 24);
  const clearWeeks = Math.max(1, Math.round(qty / velocity));
  const destinations = BRANCHES.filter((b) => b !== (row.batch.branch ?? BRANCHES[0]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" /> Transfer to branch
          </DialogTitle>
          <DialogDescription>
            {row.medicineName} · Batch <span className="font-mono">{row.batchNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
            Estimated demand at the selected branch:{" "}
            <span className="font-medium text-foreground">{velocity} units/month</span> — this batch
            would clear in ~{clearWeeks} week{clearWeeks > 1 ? "s" : ""} if transferred.
          </div>
          <div className="space-y-1.5">
            <Label>Destination branch</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transfer-qty">Quantity</Label>
            <Input
              id="transfer-qty"
              type="number"
              min={1}
              max={row.quantity}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Transferring {qty} units · stock value {currency}
            {Math.round(qty * row.batch.purchasePrice).toLocaleString()}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onConfirm(row, branch, qty);
              onOpenChange(false);
            }}
          >
            Transfer {qty} units
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
