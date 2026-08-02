import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { applyStockMovement } from "@/lib/stock";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { format, isValid } from "date-fns";

const safeFormat = (dateStr: string | undefined | null, fmt: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : "—";
};
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { downloadCsv } from "@/lib/csv";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/expiry")({
  head: () => ({ meta: [{ title: "Expiry · PharmacyOS" }] }),
  component: ExpiryPage,
});

function ExpiryPage() {
  const { user } = useAuth();
  const has = usePermission();
  const batches = useDb((d) => d.batches);
  const inventoryStock = useDb((d) => d.inventoryStock);
  const medicines = useDb((d) => d.medicines);
  const near = useDb((d) => d.settings.nearExpiryDays);
  const currency = useDb((d) => d.settings.currency);

  const [tab, setTab] = useState("near");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [days, setDays] = useState<number | null>(null);

  const medName = useMemo(() => {
    const m = new Map(medicines.map((x) => [x.id, x.name]));
    return (id: string) => m.get(id) ?? "—";
  }, [medicines]);

  const now = Date.now();
  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    inventoryStock.forEach((s) => map.set(s.batchId, (map.get(s.batchId) || 0) + s.quantityOnHand));
    return map;
  }, [inventoryStock]);

  const grouped = useMemo(() => {
    const nearMs = near * 24 * 60 * 60 * 1000;
    const nearList = batches.filter((b) => {
      const t = new Date(b.expiryDate).getTime();
      const st = stockMap.get(b.id) || 0;
      if (!(st > 0 && t > now)) return false;
      if (days !== null && t - now > days * 24 * 60 * 60 * 1000) return false;
      return t - now <= nearMs;
    });
    const expiredList = batches.filter((b) => {
      const t = new Date(b.expiryDate).getTime();
      const st = stockMap.get(b.id) || 0;
      return st > 0 && t <= now;
    });
    return { nearList, expiredList, disposedList: [] };
  }, [batches, stockMap, near, now, days]);

  const currentList =
    tab === "near"
      ? grouped.nearList
      : tab === "expired"
        ? grouped.expiredList
        : grouped.disposedList;

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selected.size === currentList.length) setSelected(new Set());
    else setSelected(new Set(currentList.map((b) => b.id)));
  };

  const disposeSelected = () => {
    if (!user) return;
    if (!selected.size) return;
    if (!confirm(`Dispose ${selected.size} batch(es)? Stock will be written off.`)) return;
    Array.from(selected).forEach((id) => {
      const b = db.get().batches.find((x) => x.id === id);
      const allStock = db
        .get()
        .inventoryStock.filter((s) => s.batchId === id && s.quantityOnHand > 0);
      if (!b || !allStock.length) return;

      allStock.forEach((s) => {
        applyStockMovement({
          batchId: b.id,
          locationType: s.locationType,
          rackCode: s.rackCode,
          movementType: "Adjustment",
          quantityChange: -s.quantityOnHand,
          userId: user.id,
          userName: user.name,
        });
      });
    });
    toast.success(`${selected.size} batch(es) disposed`);
    setSelected(new Set());
  };

  const exportCsv = () => {
    const rows = currentList.map((b) => {
      const st = stockMap.get(b.id) || 0;
      return {
        medicine: medName(b.medicineId),
        batch: b.batchNumber,
        expiry: b.expiryDate.slice(0, 10),
        daysRemaining: differenceInDays(new Date(b.expiryDate), new Date()),
        stock: st,
        valueAtCost: (st * (b.purchasePrice || 0)).toFixed(2),
      };
    });
    downloadCsv(`expiry-${tab}-${Date.now()}.csv`, rows);
  };

  const canDispose = has("expiry", "update") || has("expiry", "approve");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expiry"
        description="Track batches approaching or past expiry and dispose stock as needed."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!currentList.length}>
              <Download className="mr-1 h-4 w-4" /> Export CSV
            </Button>
            {tab !== "disposed" && canDispose && (
              <Button
                size="sm"
                variant="destructive"
                onClick={disposeSelected}
                disabled={!selected.size}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Dispose ({selected.size})
              </Button>
            )}
          </>
        }
      />

      <div className="flex w-fit items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
        {[30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setDays((cur) => (cur === d ? null : d));
              setSelected(new Set());
            }}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors",
              days === d
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            Expires in {d} days
          </button>
        ))}
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          setSelected(new Set());
          setDays(null);
        }}
      >
        <TabsList>
          <TabsTrigger value="near">Near expiry ({grouped.nearList.length})</TabsTrigger>
          <TabsTrigger value="expired">
            Expired with stock ({grouped.expiredList.length})
          </TabsTrigger>
          <TabsTrigger value="disposed">Disposed ({grouped.disposedList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {!currentList.length ? (
            <EmptyState title="Nothing here" description="No batches match this filter." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {tab !== "disposed" && (
                      <th className="px-3 py-2.5">
                        <Checkbox
                          checked={selected.size === currentList.length && currentList.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </th>
                    )}
                    <th className="px-4 py-2.5 font-medium">Medicine</th>
                    <th className="px-4 py-2.5 font-medium">Batch</th>
                    <th className="px-4 py-2.5 font-medium">Expiry</th>
                    <th className="px-4 py-2.5 font-medium text-right">Days</th>
                    <th className="px-4 py-2.5 font-medium text-right">Stock</th>
                    <th className="px-4 py-2.5 font-medium text-right">Value at cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentList.map((b) => {
                    const days = differenceInDays(new Date(b.expiryDate), new Date());
                    return (
                      <tr key={b.id} className="hover:bg-muted/30">
                        {tab !== "disposed" && (
                          <td className="px-3 py-3">
                            <Checkbox
                              checked={selected.has(b.id)}
                              onCheckedChange={() => toggle(b.id)}
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 font-medium">{medName(b.medicineId)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{b.batchNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {safeFormat(b.expiryDate, "PP")}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono ${days < 0 ? "text-destructive" : days <= 30 ? "text-warning-foreground" : ""}`}
                        >
                          {days}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {stockMap.get(b.id) || 0}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {currency}
                          {((stockMap.get(b.id) || 0) * b.purchasePrice).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
