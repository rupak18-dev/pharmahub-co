import { useMemo } from "react";
import { Pill, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BUCKET_META } from "@/lib/expiry";
import type { Batch, Medicine } from "@/lib/types";

export function MedicineDrawer({
  medicine,
  open,
  onOpenChange,
  currency,
  categoryName,
  manufacturerName,
  batches,
  medicines,
  supplierName,
}: {
  medicine: Medicine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  categoryName: string;
  manufacturerName: string;
  batches: Batch[];
  medicines: Medicine[];
  supplierName: (id?: string) => string;
}) {
  const liveBatches = useMemo(
    () =>
      batches
        .filter((b) => b.status !== "disposed" && b.currentStock > 0)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()),
    [batches],
  );

  const totalStock = useMemo(
    () => liveBatches.reduce((s, b) => s + b.currentStock, 0),
    [liveBatches],
  );

  const alternatives = useMemo(() => {
    if (!medicine?.genericName) return [];
    return medicines
      .filter((m) => m.genericName === medicine.genericName && m.id !== medicine.id)
      .map((m) => {
        const medBatches = batches.filter(
          (b) => b.medicineId === m.id && b.status !== "disposed" && b.currentStock > 0,
        );
        return {
          medicine: m,
          units: medBatches.reduce((s, b) => s + b.currentStock, 0),
          batches: medBatches.length,
          sameStrength: !!m.strength && m.strength === medicine.strength,
        };
      })
      .filter((a) => a.units > 0);
  }, [medicine, medicines, batches]);

  if (!medicine) return null;

  const info: { label: string; value: string }[] = [
    { label: "Generic / salt", value: medicine.genericName ?? "—" },
    { label: "Strength", value: medicine.strength ?? "—" },
    { label: "Dosage form", value: medicine.dosageForm ?? "—" },
    { label: "Brand", value: medicine.brandName ?? "—" },
    { label: "Category", value: categoryName },
    { label: "Manufacturer", value: manufacturerName },
    { label: "HSN code", value: medicine.hsnCode ?? "—" },
    { label: "GST", value: `${medicine.gstRate}%` },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pr-8 text-left">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Medicine details
            </span>
          </div>
          <SheetTitle className="text-lg">{medicine.name}</SheetTitle>
          <SheetDescription>{medicine.genericName ?? "—"}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center gap-4">
          {medicine.imageUrl ? (
            <img
              src={medicine.imageUrl}
              alt={medicine.name}
              className="h-20 w-20 shrink-0 rounded-xl border border-border object-cover"
            />
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border border-border bg-muted/40">
              <Pill className="h-9 w-9 text-muted-foreground/60" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {currency}
              {totalStock.toLocaleString()} <span className="text-muted-foreground">in stock</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {liveBatches.length} active batch{liveBatches.length !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {info.map((t) => (
            <div key={t.label} className="rounded-lg border border-border bg-card p-2.5">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t.label}
              </div>
              <div className="mt-0.5 truncate text-sm font-medium text-foreground">{t.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Batches by expiry</h3>
            <p className="text-xs text-muted-foreground">Earliest expiring first.</p>
          </div>
          {liveBatches.length === 0 ? (
            <div className="grid place-items-center px-4 py-8 text-sm text-muted-foreground">
              No live batches
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {liveBatches.map((b) => {
                const days = Math.round(
                  (new Date(b.expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
                );
                const bucket =
                  days < 0 ? "expired" : days === 0 ? "today" : days <= 3 ? "critical" : "warning";
                const meta = BUCKET_META[bucket];
                return (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        <span className="font-mono">{b.batchNumber}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {b.currentStock} units · {supplierName(b.supplierId)}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          meta.chip,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                        {days < 0
                          ? `${Math.abs(days)}d overdue`
                          : days === 0
                            ? "today"
                            : `${days}d`}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {currency}
                        {(b.currentStock * b.purchasePrice).toLocaleString()}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Alternate medicines</h3>
            <p className="text-xs text-muted-foreground">Same salt · same-strength marked.</p>
          </div>
          {alternatives.length === 0 ? (
            <div className="grid place-items-center px-4 py-8 text-sm text-muted-foreground">
              No in-stock alternatives for this salt
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {alternatives.map((a) => (
                <li
                  key={a.medicine.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.medicine.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.medicine.strength || "—"} · {a.units} units across {a.batches} batch
                      {a.batches !== 1 ? "es" : ""}
                    </p>
                  </div>
                  {a.sameStrength && (
                    <span className="shrink-0 rounded bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                      Same strength
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
