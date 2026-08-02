import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format, subDays, isAfter } from "date-fns";
import { useDb } from "@/hooks/useDb";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { applyStockMovement } from "@/lib/stock";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export const Route = createFileRoute("/_authenticated/dashboard/inventory")({
  head: () => ({ meta: [{ title: "Inventory Â· PharmaHub" }] }),
  component: InventoryPage,
});

type MovementKind = "in" | "out" | "adjust";
const schema = z.object({
  batchId: z.string().min(1, "Select a batch"),
  quantity: z.coerce.number().refine((n) => n !== 0, "Enter a non-zero quantity"),
  reason: z.string().trim().min(2, "Please give a reason").max(200),
});
type FormValues = z.infer<typeof schema>;

function InventoryPage() {
  const meds = useDb((d) => d.medicines);
  const batches = useDb((d) => d.batches);
  const movements = useDb((d) => d.stockMovements);
  const settings = useDb((d) => d.settings);
  const { user } = useAuth();
  const has = usePermission();

  const [kind, setKind] = useState<MovementKind | null>(null);

  const stockByMed = useMemo(() => {
    const m = new Map<string, number>();
    batches.forEach((b) => m.set(b.medicineId, (m.get(b.medicineId) ?? 0) + b.currentStock));
    return m;
  }, [batches]);

  const valuation = useMemo(
    () =>
      meds
        .filter((m) => m.isActive)
        .map((m) => {
          const batchesForMed = batches.filter((b) => b.medicineId === m.id);
          const stock = batchesForMed.reduce((s, b) => s + b.currentStock, 0);
          const value = batchesForMed.reduce((s, b) => s + b.currentStock * b.purchasePrice, 0);
          return { medicine: m, stock, value };
        })
        .sort((a, b) => b.value - a.value),
    [meds, batches],
  );

  const reorderList = useMemo(
    () =>
      meds
        .filter((m) => m.isActive && (stockByMed.get(m.id) ?? 0) <= m.reorderThreshold)
        .map((m) => ({ medicine: m, stock: stockByMed.get(m.id) ?? 0 }))
        .sort((a, b) => a.stock - b.stock),
    [meds, stockByMed],
  );

  const movementRanking = useMemo(() => {
    const since = subDays(new Date(), 30);
    const counts = new Map<string, number>();
    movements.forEach((mv) => {
      if (mv.movementType !== "out") return;
      if (!isAfter(new Date(mv.createdAt), since)) return;
      counts.set(mv.medicineId, (counts.get(mv.medicineId) ?? 0) + Math.abs(mv.quantity));
    });
    const arr = meds
      .filter((m) => m.isActive)
      .map((m) => ({ medicine: m, sold: counts.get(m.id) ?? 0 }))
      .sort((a, b) => b.sold - a.sold);
    return arr;
  }, [movements, meds]);

  const deadStock = useMemo(() => {
    const cutoff = subDays(new Date(), settings.deadStockDays);
    const lastMove = new Map<string, Date>();
    movements.forEach((mv) => {
      const d = new Date(mv.createdAt);
      const prev = lastMove.get(mv.medicineId);
      if (!prev || d > prev) lastMove.set(mv.medicineId, d);
    });
    return meds
      .filter((m) => m.isActive && (stockByMed.get(m.id) ?? 0) > 0)
      .filter((m) => {
        const last = lastMove.get(m.id);
        return !last || last < cutoff;
      })
      .map((m) => ({ medicine: m, stock: stockByMed.get(m.id) ?? 0, last: lastMove.get(m.id) ?? null }));
  }, [meds, movements, stockByMed, settings.deadStockDays]);

  const totalValue = valuation.reduce((s, v) => s + v.value, 0);

  const submit = (v: FormValues) => {
    if (!user) return;
    const batch = batches.find((b) => b.id === v.batchId);
    if (!batch) return;
    try {
      applyStockMovement({
        medicineId: batch.medicineId,
        batchId: batch.id,
        movementType: kind === "in" ? "in" : kind === "out" ? "out" : "adjustment",
        quantity: v.quantity,
        reason: v.reason,
        userId: user.id,
        userName: user.name,
      });
      toast.success("Stock movement recorded");
      setKind(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Live stock levels, valuation, and movement analytics across all batches."
        actions={
          has("inventory", "create") && (
            <>
              <Button size="sm" variant="outline" onClick={() => setKind("in")}>
                <ArrowDownToLine className="mr-1 h-4 w-4" /> Stock in
              </Button>
              <Button size="sm" variant="outline" onClick={() => setKind("out")}>
                <ArrowUpFromLine className="mr-1 h-4 w-4" /> Stock out
              </Button>
              <Button size="sm" variant="outline" onClick={() => setKind("adjust")}>
                <SlidersHorizontal className="mr-1 h-4 w-4" /> Adjustment
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Total stock value</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-primary">
            {settings.currency}
            {Math.round(totalValue).toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Reorder alerts</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-warning-foreground">
            {reorderList.length}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Dead stock items</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-destructive">
            {deadStock.length}
          </div>
        </div>
      </div>

      <Tabs defaultValue="valuation">
        <TabsList>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="reorder">Reorder alerts</TabsTrigger>
          <TabsTrigger value="movement">Fast / slow</TabsTrigger>
          <TabsTrigger value="dead">Dead stock</TabsTrigger>
          <TabsTrigger value="movements">Recent movements</TabsTrigger>
        </TabsList>

        <TabsContent value="valuation" className="mt-4">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Medicine</th>
                  <th className="px-4 py-2.5 text-right">Stock</th>
                  <th className="px-4 py-2.5 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {valuation.map(({ medicine, stock, value }) => (
                  <tr key={medicine.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        to="/dashboard/medicines"
                        className="font-medium hover:text-primary"
                      >
                        {medicine.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{medicine.genericName}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{stock}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {settings.currency}
                      {value.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="reorder" className="mt-4">
          {reorderList.length === 0 ? (
            <EmptyState title="Stock is healthy" description="No medicines are below their reorder threshold." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Medicine</th>
                    <th className="px-4 py-2.5 text-right">Stock</th>
                    <th className="px-4 py-2.5 text-right">Threshold</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reorderList.map(({ medicine, stock }) => (
                    <tr key={medicine.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{medicine.name}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{stock}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                        {medicine.reorderThreshold}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-warning-foreground">
                          <AlertTriangle className="h-3 w-3" /> Reorder
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="movement" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RankPanel title="Fast movers (30d)" items={movementRanking.slice(0, 10)} />
            <RankPanel title="Slow movers (30d)" items={[...movementRanking].reverse().slice(0, 10)} />
          </div>
        </TabsContent>

        <TabsContent value="dead" className="mt-4">
          {deadStock.length === 0 ? (
            <EmptyState title="No dead stock" description={`All active stock has moved within ${settings.deadStockDays} days.`} />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Medicine</th>
                    <th className="px-4 py-2.5 text-right">Stock</th>
                    <th className="px-4 py-2.5">Last movement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deadStock.map((d) => (
                    <tr key={d.medicine.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{d.medicine.name}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{d.stock}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d.last ? format(d.last, "dd MMM yyyy") : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          {movements.length === 0 ? (
            <EmptyState title="No movements yet" />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">When</th>
                    <th className="px-4 py-2.5">Medicine</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5 text-right">Qty</th>
                    <th className="px-4 py-2.5">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movements.slice(0, 50).map((mv) => {
                    const med = meds.find((m) => m.id === mv.medicineId);
                    return (
                      <tr key={mv.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {format(new Date(mv.createdAt), "dd MMM Â· HH:mm")}
                        </td>
                        <td className="px-4 py-3">{med?.name ?? "â€”"}</td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">
                          {mv.movementType}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono tabular-nums ${
                            mv.quantity > 0 ? "text-success" : mv.quantity < 0 ? "text-destructive" : ""
                          }`}
                        >
                          {mv.quantity > 0 ? "+" : ""}
                          {mv.quantity}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{mv.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MovementSheet kind={kind} onClose={() => setKind(null)} onSubmit={submit} />
    </div>
  );
}

function RankPanel({
  title,
  items,
}: {
  title: string;
  items: { medicine: { id: string; name: string }; sold: number }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">{title}</div>
      <ol className="divide-y divide-border">
        {items.map((r, i) => (
          <li key={r.medicine.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="flex items-center gap-3">
              <span className="w-5 text-right font-mono text-xs text-muted-foreground">
                {i + 1}
              </span>
              <span>{r.medicine.name}</span>
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">{r.sold}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MovementSheet({
  kind,
  onClose,
  onSubmit,
}: {
  kind: MovementKind | null;
  onClose: () => void;
  onSubmit: (v: FormValues) => void;
}) {
  const batches = useDb((d) => d.batches);
  const meds = useDb((d) => d.medicines);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const title =
    kind === "in" ? "Stock in" : kind === "out" ? "Stock out" : "Stock adjustment";
  const description =
    kind === "in"
      ? "Add stock to an existing batch (manual receipt)."
      : kind === "out"
        ? "Remove stock (damage, sample, wastage)."
        : "Adjust stock up or down with a reason.";

  return (
    <Sheet open={!!kind} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit((v) => {
            onSubmit(v);
            reset();
          })}
          className="flex-1 overflow-y-auto space-y-4 py-4 px-4"
        >
          <div className="space-y-2">
            <Label>Batch *</Label>
            <Select value={watch("batchId") || ""} onValueChange={(v) => setValue("batchId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => {
                  const med = meds.find((m) => m.id === b.medicineId);
                  return (
                    <SelectItem key={b.id} value={b.id}>
                      {med?.name} Â· {b.batchNumber} Â· {b.currentStock} in stock
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.batchId && <p className="text-xs text-destructive">{errors.batchId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity {kind === "adjust" ? "(signed: +/-)" : ""}*
            </Label>
            <Input
              id="quantity"
              type="number"
              step={1}
              {...register("quantity")}
              placeholder={kind === "adjust" ? "e.g. -3 or 5" : "e.g. 10"}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive">{errors.quantity.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea id="reason" rows={3} {...register("reason")} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
          <SheetFooter className="mt-2 flex-row gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Record
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
