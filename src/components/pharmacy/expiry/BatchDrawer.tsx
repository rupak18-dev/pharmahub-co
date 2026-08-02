import { format, formatDistanceToNow } from "date-fns";
import { ArrowUpRight, Boxes, PackageX } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BRANCHES, BUCKET_META, isReturnable, type ExpiryRow } from "@/lib/expiry";
import type { StockMovement } from "@/lib/types";

export function BatchDrawer({
  row,
  open,
  onOpenChange,
  currency,
  movements,
}: {
  row: ExpiryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  movements: StockMovement[];
}) {
  if (!row) return null;
  const batch = row.batch;
  const meta = BUCKET_META[row.bucket];
  const returnable = isReturnable(row);
  const branch = batch.branch ?? BRANCHES[0];

  const tiles: { label: string; value: string }[] = [
    { label: "Manufacturer", value: row.manufacturer },
    { label: "Category", value: row.category },
    { label: "Manufacture date", value: format(new Date(batch.mfgDate), "dd MMM yyyy") },
    { label: "Expiry date", value: format(new Date(batch.expiryDate), "dd MMM yyyy") },
    {
      label: "Days remaining",
      value:
        row.days < 0
          ? `Overdue ${Math.abs(row.days)}d`
          : row.days === 0
            ? "Expires today"
            : `${row.days} days`,
    },
    { label: "Quantity", value: `${batch.currentStock} / ${batch.quantityReceived}` },
    { label: "Purchase price", value: `${currency}${batch.purchasePrice.toFixed(2)}` },
    { label: "Selling price", value: `${currency}${batch.sellingPrice.toFixed(2)}` },
    { label: "MRP", value: `${currency}${batch.mrp.toFixed(2)}` },
    { label: "Supplier", value: row.supplier },
    { label: "Shelf location", value: row.shelf },
    { label: "Branch", value: branch },
    {
      label: "Stock value",
      value: `${currency}${row.stockValue.toLocaleString()}`,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pr-8 text-left">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Batch details
            </span>
          </div>
          <SheetTitle className="text-lg">
            Batch <span className="font-mono">{row.batchNumber}</span>
          </SheetTitle>
          <SheetDescription>
            {row.medicineName} · {row.salt}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              meta.chip,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              returnable
                ? "border-info/40 bg-info/15 text-info"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            {returnable ? "Return eligible" : "Outside return window"}
          </span>
          {(batch.discountPct || batch.fefo || batch.suggestAtPos) && (
            <span className="inline-flex flex-wrap gap-1">
              {batch.discountPct && (
                <span className="rounded bg-info/15 px-1.5 py-0.5 text-[10px] font-medium text-info">
                  {batch.discountPct}% discount
                </span>
              )}
              {batch.fefo && (
                <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground">
                  FEFO first
                </span>
              )}
              {batch.suggestAtPos && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  Suggest at POS
                </span>
              )}
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-lg border border-border bg-card p-2.5">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t.label}
              </div>
              <div className="mt-0.5 truncate font-mono text-sm tabular-nums text-foreground">
                {t.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Movement history</h3>
            <p className="text-xs text-muted-foreground">
              Every stock movement recorded for this batch.
            </p>
          </div>
          {movements.length === 0 ? (
            <div className="grid place-items-center px-4 py-10 text-sm text-muted-foreground">
              <PackageX className="mb-2 h-6 w-6 opacity-40" />
              No movements yet
            </div>
          ) : (
            <ol className="divide-y divide-border">
              {movements.map((m) => (
                <li key={m.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      m.movementType === "in"
                        ? "bg-success"
                        : m.movementType === "out"
                          ? "bg-destructive"
                          : "bg-warning",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium capitalize">
                        Stock {m.movementType} · {m.quantity > 0 ? "+" : ""}
                        {m.quantity}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.reason}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard/batches/$batchId" params={{ batchId: batch.id }}>
              Open full batch page <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
