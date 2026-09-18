import { useMemo } from "react";
import {
  ArrowRightLeft,
  BadgePercent,
  Lightbulb,
  ListOrdered,
  RotateCcw,
  Sparkles,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Switch } from "@/Components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/Components/ui/sheet";
import { BUCKET_META, suggestedDiscountPct, isReturnable } from "@/lib/expiry";
import { getAlternatives } from "@/lib/expiry";
export function RecommendationPanel({
  open,
  onOpenChange,
  batchId,
  rows,
  batches,
  medicines,
  currency,
  supplierName,
  onReturn,
  onDiscount,
  onTransfer,
  onPriority,
  onSuggest,
  autoSwap,
  onToggleAutoSwap,
  windowLabel,
}) {
  const row = rows.find((r) => r.batch.id === batchId) ?? null;
  const alternatives = useMemo(
    () => (row ? getAlternatives(row.batch, batches, medicines) : []),
    [row, batches, medicines],
  );
  const meta = row ? BUCKET_META[row.bucket] : null;
  const returnable = row ? isReturnable(row) : false;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {row && meta ? (
          <>
            <SheetHeader className="pr-8 text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Smart recommendations
                </span>
                {windowLabel && (
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {windowLabel}
                  </span>
                )}
              </div>
              <SheetTitle className="text-lg">{row.medicineName}</SheetTitle>
              <SheetDescription>
                {row.salt} · Batch <span className="font-mono">{row.batchNumber}</span> ·{" "}
                {supplierName(row.batch.supplierId)}
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
                {meta.label} ·{" "}
                {row.days < 0
                  ? `${Math.abs(row.days)}d overdue`
                  : row.days === 0
                    ? "today"
                    : `in ${row.days} days`}
              </span>
              <Badge variant="secondary" className="font-mono">
                {currency}
                {row.stockValue.toLocaleString()} in stock
              </Badge>
              <Badge variant="outline" className="font-mono">
                {row.quantity} units
              </Badge>
            </div>

            {row.days <= 0 ? (
              <AlternativesBlock
                alternatives={alternatives}
                currency={currency}
                row={row}
                medicines={medicines}
                autoSwap={autoSwap}
                onToggleAutoSwap={onToggleAutoSwap}
              />
            ) : (
              <ActionGrid
                row={row}
                returnable={returnable}
                currency={currency}
                supplierName={supplierName}
                onReturn={() => onReturn(row)}
                onDiscount={() => onDiscount(row)}
                onTransfer={() => onTransfer(row)}
                onPriority={() => onPriority(row)}
                onSuggest={() => onSuggest(row)}
              />
            )}
          </>
        ) : (
          <SheetHeader className="pr-8 text-left">
            <SheetTitle>Smart recommendations</SheetTitle>
            <SheetDescription>Select a batch to see suggested actions.</SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}
function AlternativesBlock({ alternatives, currency, row, medicines, autoSwap, onToggleAutoSwap }) {
  const medById = new Map(medicines.map((m) => [m.id, m]));
  const current = medById.get(row.batch.medicineId);
  const toggleSuggest = (batchId) => {
    db.set((d) => {
      const b = d.batches.find((x) => x.id === batchId);
      if (b) b.suggestAtPos = !b.suggestAtPos;
    });
  };
  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning/10 p-3">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
        <div className="text-sm">
          <p className="font-medium">This batch can no longer be sold</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Swap prescriptions to the same-salt alternatives below to avoid losing the sale.
          </p>
        </div>
      </div>

      {alternatives.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          No in-stock same-salt alternatives found for {current?.genericName ?? "this salt"}.
          Consider reordering from your supplier.
        </div>
      ) : (
        <>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Same salt · {current?.genericName ?? ""}
            </h4>
            <div className="space-y-2">
              {alternatives.map((alt) => {
                const m = BUCKET_META[alt.bucket];
                return (
                  <div
                    key={alt.batch.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{alt.medicine?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono">{alt.batch.batchNumber}</span> ·{" "}
                        {alt.batch.currentStock} units · {currency}
                        {(alt.batch.currentStock * alt.batch.purchasePrice).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          m.chip,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
                        {alt.days <= 0
                          ? `${Math.abs(alt.days)}d overdue`
                          : alt.days === 0
                            ? "expires today"
                            : `${alt.days}d left`}
                      </span>
                      <Button
                        size="sm"
                        variant={alt.batch.suggestAtPos ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => toggleSuggest(alt.batch.id)}
                      >
                        {alt.batch.suggestAtPos ? "Suggested at POS" : "Suggest at POS"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Auto-swap at POS</span>
              </p>
              <p className="mt-0.5">
                When on, the cashier is prompted to swap to a suggested alternate on billing.
              </p>
            </div>
            <Switch checked={autoSwap} onCheckedChange={onToggleAutoSwap} />
          </div>
        </>
      )}
    </div>
  );
}
function ActionGrid({
  row,
  returnable,
  currency,
  supplierName,
  onReturn,
  onDiscount,
  onTransfer,
  onPriority,
  onSuggest,
}) {
  const discount = suggestedDiscountPct(row.days);
  const impact = row.stockValue;
  const cards = [
    {
      icon: RotateCcw,
      title: "Return to supplier",
      desc: `${supplierName(row.batch.supplierId)} accepts returns within the window.`,
      impact: `Recover ~${currency}${impact.toLocaleString()}`,
      tone: "text-info",
      cta: "Create return",
      disabled: !returnable,
      action: onReturn,
    },
    {
      icon: ArrowRightLeft,
      title: "Transfer to branch",
      desc: "Move stock to a branch with higher turnover for this medicine.",
      impact: "Clears ~2 weeks sooner",
      tone: "text-primary",
      cta: "Choose branch",
      action: onTransfer,
    },
    {
      icon: BadgePercent,
      title: "Discount for quick sale",
      desc: `${discount}% off accelerates sell-through before expiry.`,
      impact: `Saves ~${currency}${(impact * 0.6).toLocaleString()} of value`,
      tone: "text-warning-foreground",
      cta: "Apply discount",
      action: onDiscount,
    },
    {
      icon: ListOrdered,
      title: "Prioritize in billing",
      desc: "FEFO — bill this batch first at the counter.",
      impact: "First-expiry-first-out",
      tone: "text-success",
      cta: row.batch.fefo ? "On · tap to clear" : "Enable now",
      action: onPriority,
    },
    {
      icon: Sparkles,
      title: "Suggest at POS",
      desc: "Flag this batch to auto-swap at the counter.",
      impact: row.batch.suggestAtPos ? "Active at counter" : "Off — flag to enable",
      tone: "text-primary",
      cta: row.batch.suggestAtPos ? "Active · tap to clear" : "Flag for POS",
      action: onSuggest,
    },
  ];
  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <Store className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Act within the next <span className="font-medium text-foreground">{row.days} days</span>{" "}
          to protect{" "}
          <span className="font-medium text-foreground">
            {currency}
            {impact.toLocaleString()}
          </span>{" "}
          of stock value.
        </p>
      </div>

      {cards.map((c) => (
        <div
          key={c.title}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5"
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <c.icon className={cn("mt-0.5 h-4 w-4 shrink-0", c.tone)} />
            <div className="min-w-0">
              <p className="text-sm font-medium">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
              <p className="mt-0.5 text-xs font-medium text-foreground/80">{c.impact}</p>
            </div>
          </div>
          <Button size="sm" className="shrink-0" disabled={c.disabled} onClick={c.action}>
            {c.cta}
          </Button>
        </div>
      ))}
    </div>
  );
}
