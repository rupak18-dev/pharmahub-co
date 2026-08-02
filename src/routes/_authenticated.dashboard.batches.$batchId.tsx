import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { StatusBadge } from "@/components/pharmacy/StatusBadge";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { computeBatchStatus } from "@/lib/stock";
import { Button } from "@/components/ui/button";

const safeFormat = (dateStr: string | undefined | null, fmt: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : "—";
};

export const Route = createFileRoute("/_authenticated/dashboard/batches/$batchId")({
  head: () => ({ meta: [{ title: "Batch detail Â· PharmaHub" }] }),
  component: BatchDetailPage,
});

function BatchDetailPage() {
  const { batchId } = useParams({ from: "/_authenticated/dashboard/batches/$batchId" });
  const batch = useDb((d) => d.batches.find((b) => b.id === batchId));
  const settings = useDb((d) => d.settings);
  const med = useDb((d) => (batch ? d.medicines.find((m) => m.id === batch.medicineId) : undefined));
  const supplier = useDb((d) => (batch?.supplierId ? d.suppliers.find((s) => s.id === batch.supplierId) : undefined));
  const ledger = useDb((d) => d.inventoryLedger.filter((m) => m.batchId === batchId));
  const stock = useDb((d) => d.inventoryStock.filter((s) => s.batchId === batchId));

  if (!batch) {
    return (
      <div className="space-y-6">
        <PageHeader title="Batch not found" />
        <EmptyState title="This batch doesn't exist" description="It may have been deleted." action={
          <Button asChild><Link to="/dashboard/batches">Back to batches</Link></Button>
        } />
      </div>
    );
  }

  const totalStock = stock.reduce((sum, s) => sum + s.quantityOnHand, 0);
  const status = computeBatchStatus(batch, totalStock, settings.nearExpiryDays);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/dashboard/batches">
            <ArrowLeft className="mr-1 h-4 w-4" /> All batches
          </Link>
        </Button>
        <PageHeader
          title={`Batch ${batch.batchNumber}`}
          description={med?.name}
          actions={<StatusBadge status={status} />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoTile label="Manufacture" value={safeFormat(batch.mfgDate, "dd MMM yyyy")} />
        <InfoTile label="Expiry" value={safeFormat(batch.expiryDate, "dd MMM yyyy")} />
        <InfoTile
          label="Current stock"
          value={`${totalStock}`}
        />
        <InfoTile label="Supplier" value={supplier?.name ?? "â€”"} />
        <InfoTile label="MRP" value={`${settings.currency}${batch.mrp.toFixed(2)}`} />
        <InfoTile label="Purchase price" value={`${settings.currency}${batch.purchasePrice.toFixed(2)}`} />
        <InfoTile label="Selling price" value={`${settings.currency}${batch.sellingPrice.toFixed(2)}`} />
        <InfoTile
          label="Total stock value"
          value={`${settings.currency}${(totalStock * (batch.purchasePrice || 0)).toFixed(2)}`}
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Lifecycle</h3>
          <p className="text-xs text-muted-foreground">Every stock movement recorded for this batch.</p>
        </div>
        {ledger.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No movements yet" />
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {ledger.map((m) => (
              <li key={m.id} className="flex items-start gap-3 px-4 py-3">
                <span
                  className={`mt-1 h-2 w-2 rounded-full ${
                    m.quantityChange > 0
                      ? "bg-success"
                      : m.quantityChange < 0
                        ? "bg-destructive"
                        : "bg-warning"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium capitalize">
                      Stock {m.movementType} Â· {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(m.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                  {m.referenceDocId && (
                    <p className="text-xs text-muted-foreground">Ref: {m.referenceDocId}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm tabular-nums text-foreground">{value}</div>
    </div>
  );
}
