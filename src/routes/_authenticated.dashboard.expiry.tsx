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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { downloadCsv } from "@/lib/csv";
import { format, differenceInDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard/expiry")({
  head: () => ({ meta: [{ title: "Expiry · PharmacyOS" }] }),
  component: ExpiryPage,
});

function ExpiryPage() {
  const { user } = useAuth();
  const has = usePermission();
  const batches = useDb((d) => d.batches);
  const medicines = useDb((d) => d.medicines);
  const near = useDb((d) => d.settings.nearExpiryDays);
  const currency = useDb((d) => d.settings.currency);

  const [tab, setTab] = useState("near");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const medName = useMemo(() => {
    const m = new Map(medicines.map((x) => [x.id, x.name]));
    return (id: string) => m.get(id) ?? "—";
  }, [medicines]);

  const now = Date.now();
  const grouped = useMemo(() => {
    const nearMs = near * 24 * 60 * 60 * 1000;
    const nearList = batches.filter((b) => {
      const t = new Date(b.expiryDate).getTime();
      return b.status !== "disposed" && b.currentStock > 0 && t > now && t - now <= nearMs;
    });
    const expiredList = batches.filter((b) => {
      const t = new Date(b.expiryDate).getTime();
      return b.status !== "disposed" && b.currentStock > 0 && t <= now;
    });
    const disposedList = batches.filter((b) => b.status === "disposed");
    return { nearList, expiredList, disposedList };
  }, [batches, near, now]);

  const currentList =
    tab === "near" ? grouped.nearList : tab === "expired" ? grouped.expiredList : grouped.disposedList;

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
      if (!b || b.currentStock <= 0) return;
      applyStockMovement({
        medicineId: b.medicineId,
        batchId: b.id,
        movementType: "adjustment",
        quantity: -b.currentStock,
        reason: "Disposed – expired",
        userId: user.id,
        userName: user.name,
      });
      db.set((d) => {
        const bb = d.batches.find((x) => x.id === id);
        if (bb) bb.status = "disposed";
      });
    });
    toast.success(`${selected.size} batch(es) disposed`);
    setSelected(new Set());
  };

  const exportCsv = () => {
    const rows = currentList.map((b) => ({
      medicine: medName(b.medicineId),
      batch: b.batchNumber,
      expiry: b.expiryDate.slice(0, 10),
      daysRemaining: differenceInDays(new Date(b.expiryDate), new Date()),
      stock: b.currentStock,
      valueAtCost: (b.currentStock * b.purchasePrice).toFixed(2),
      status: b.status,
    }));
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
              <Button size="sm" variant="destructive" onClick={disposeSelected} disabled={!selected.size}>
                <Trash2 className="mr-1 h-4 w-4" /> Dispose ({selected.size})
              </Button>
            )}
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSelected(new Set()); }}>
        <TabsList>
          <TabsTrigger value="near">Near expiry ({grouped.nearList.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired with stock ({grouped.expiredList.length})</TabsTrigger>
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
                            <Checkbox checked={selected.has(b.id)} onCheckedChange={() => toggle(b.id)} />
                          </td>
                        )}
                        <td className="px-4 py-3 font-medium">{medName(b.medicineId)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{b.batchNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground">{format(new Date(b.expiryDate), "PP")}</td>
                        <td className={`px-4 py-3 text-right font-mono ${days < 0 ? "text-destructive" : days <= 30 ? "text-warning-foreground" : ""}`}>
                          {days}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{b.currentStock}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {currency}{(b.currentStock * b.purchasePrice).toLocaleString()}
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
