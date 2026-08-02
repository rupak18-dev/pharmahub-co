import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/lib/auth";
import { applyStockMovement, computeBatchStatus, logActivity } from "@/lib/stock";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { StatusBadge } from "@/components/pharmacy/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard/batches")({
  head: () => ({ meta: [{ title: "Batches Â· PharmaHub" }] }),
  component: BatchesPage,
});

const schema = z
  .object({
    medicineId: z.string().min(1, "Select a medicine"),
    batchNumber: z.string().trim().min(1, "Batch number required").max(40),
    mfgDate: z.string().min(1, "Required"),
    expiryDate: z.string().min(1, "Required"),
    mrp: z.coerce.number().min(0),
    purchasePrice: z.coerce.number().min(0),
    sellingPrice: z.coerce.number().min(0),
    supplierId: z.string().optional().or(z.literal("")),
    quantityReceived: z.coerce.number().int().min(1, "At least 1"),
  })
  .refine((v) => new Date(v.expiryDate) > new Date(v.mfgDate), {
    message: "Expiry must be after manufacture date",
    path: ["expiryDate"],
  });

type FormValues = z.infer<typeof schema>;

function BatchesPage() {
  const batches = useDb((d) => d.batches);
  const meds = useDb((d) => d.medicines);
  const settings = useDb((d) => d.settings);
  const suppliers = useDb((d) => d.suppliers);
  const has = usePermission();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [medFilter, setMedFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "near_expiry" | "expired" | "sold_out">("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return batches
      .map((b) => {
        const med = meds.find((m) => m.id === b.medicineId);
        const status = computeBatchStatus(b, settings.nearExpiryDays);
        return { batch: b, med, status };
      })
      .filter(({ batch, med, status }) => {
        if (medFilter !== "all" && batch.medicineId !== medFilter) return false;
        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (!s) return true;
        return (
          batch.batchNumber.toLowerCase().includes(s) ||
          (med?.name ?? "").toLowerCase().includes(s)
        );
      })
      .sort((a, b) => a.batch.expiryDate.localeCompare(b.batch.expiryDate));
  }, [batches, meds, settings.nearExpiryDays, q, medFilter, statusFilter]);

  const submit = (v: FormValues) => {
    const id = db.uid();
    const now = new Date().toISOString();
    db.set((d) => {
      d.batches.push({
        id,
        medicineId: v.medicineId,
        batchNumber: v.batchNumber,
        mfgDate: new Date(v.mfgDate).toISOString(),
        expiryDate: new Date(v.expiryDate).toISOString(),
        mrp: v.mrp,
        purchasePrice: v.purchasePrice,
        sellingPrice: v.sellingPrice,
        supplierId: v.supplierId || undefined,
        quantityReceived: v.quantityReceived,
        currentStock: v.quantityReceived,
        status: "active",
        createdAt: now,
      });
    });
    if (user) {
      applyStockMovement({
        medicineId: v.medicineId,
        batchId: id,
        movementType: "in",
        quantity: v.quantityReceived,
        reason: "New batch received",
        userId: user.id,
        userName: user.name,
      });
      logActivity({
        userId: user.id,
        userName: user.name,
        action: `Added batch ${v.batchNumber}`,
        entityType: "batch",
        entityId: id,
      });
    }
    toast.success("Batch added");
    setSheetOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Every unit is tracked by batch â€” including MRP, cost, expiry and supplier."
        actions={
          has("batches", "create") && (
            <Button size="sm" onClick={() => setSheetOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add batch
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by batch number or medicineâ€¦"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-none">
          <Select value={medFilter} onValueChange={setMedFilter}>
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="Medicine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All medicines</SelectItem>
              {meds.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="near_expiry">Near expiry</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="sold_out">Sold out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No batches match" description="Adjust your filters or add a batch." />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Batch</th>
                  <th className="px-4 py-2.5 font-medium">Medicine</th>
                  <th className="px-4 py-2.5 font-medium">Expiry</th>
                  <th className="px-4 py-2.5 font-medium text-right">MRP</th>
                  <th className="px-4 py-2.5 font-medium text-right">Stock</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ batch, med, status }) => (
                  <tr key={batch.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        to="/dashboard/batches/$batchId"
                        params={{ batchId: batch.id }}
                        className="font-mono font-medium text-primary hover:underline"
                      >
                        {batch.batchNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{med?.name ?? "â€”"}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {format(new Date(batch.expiryDate), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {settings.currency}
                      {batch.mrp.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {batch.currentStock}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2 md:hidden">
            {rows.map(({ batch, med, status }) => (
              <Link
                key={batch.id}
                to="/dashboard/batches/$batchId"
                params={{ batchId: batch.id }}
                className="block rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold text-primary">
                      {batch.batchNumber}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {med?.name}
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Expiry</div>
                    <div className="font-mono">{format(new Date(batch.expiryDate), "dd MMM yy")}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">MRP</div>
                    <div className="font-mono">
                      {settings.currency}
                      {batch.mrp.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Stock</div>
                    <div className="font-mono">{batch.currentStock}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <AddBatchSheet open={sheetOpen} onOpenChange={setSheetOpen} onSubmit={submit} />
    </div>
  );
}

function AddBatchSheet({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: FormValues) => void;
}) {
  const meds = useDb((d) => d.medicines);
  const suppliers = useDb((d) => d.suppliers);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Add batch</SheetTitle>
          <SheetDescription>
            Create a new batch for an existing medicine and log the incoming stock.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit((v) => {
            onSubmit(v);
            reset();
          })}
          className="flex-1 overflow-y-auto space-y-4 py-4 px-4"
        >
          <div className="space-y-2">
            <Label>Medicine *</Label>
            <Select
              value={watch("medicineId") || ""}
              onValueChange={(v) => setValue("medicineId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select medicine" />
              </SelectTrigger>
              <SelectContent>
                {meds
                  .filter((m) => m.isActive)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.medicineId && (
              <p className="text-xs text-destructive">{errors.medicineId.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch number *</Label>
              <Input id="batchNumber" {...register("batchNumber")} />
              {errors.batchNumber && (
                <p className="text-xs text-destructive">{errors.batchNumber.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityReceived">Quantity received *</Label>
              <Input
                id="quantityReceived"
                type="number"
                min={1}
                {...register("quantityReceived")}
              />
              {errors.quantityReceived && (
                <p className="text-xs text-destructive">{errors.quantityReceived.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mfgDate">Manufacture date *</Label>
              <Input id="mfgDate" type="date" {...register("mfgDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry date *</Label>
              <Input id="expiryDate" type="date" {...register("expiryDate")} />
              {errors.expiryDate && (
                <p className="text-xs text-destructive">{errors.expiryDate.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP *</Label>
              <Input id="mrp" type="number" step="0.01" {...register("mrp")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Cost *</Label>
              <Input id="purchasePrice" type="number" step="0.01" {...register("purchasePrice")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling *</Label>
              <Input id="sellingPrice" type="number" step="0.01" {...register("sellingPrice")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select
              value={watch("supplierId") || ""}
              onValueChange={(v) => setValue("supplierId", v)}
            >
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
          <SheetFooter className="mt-2 flex-row gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add batch
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
