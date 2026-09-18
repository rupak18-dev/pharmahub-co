import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { format, isValid } from "date-fns";
import { ArrowLeft, Download, FileSpreadsheet, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { apiRequest } from "@/lib/api";
import { PageHeader } from "@/Components/shared/PageHeader";
import { StatusBadge } from "@/Components/shared/StatusBadge";
import { EmptyState } from "@/Components/shared/EmptyState";
import { computeBatchStatus } from "@/lib/stock";
import { exportBatchesCsv, exportBatchesPdf } from "@/lib/batch-export";
import BatchQrSheet from "@/Components/shared/BatchQrSheet";
import { Button } from "@/Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
const safeFormat = (dateStr, fmt) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : "—";
};
export const handle = { title: "Batch detail · PharmaHub" };

function InfoTile({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm tabular-nums text-foreground">{value}</div>
    </div>
  );
}

export default function BatchDetailPage() {
  const { batchId } = useParams();
  const rawSettings = useDb((d) => d.settings);
  const settings = { currency: "₹", nearExpiryDays: 90, ...(rawSettings ?? {}) };
  const [batch, setBatch] = useState(null);
  const [med, setMed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrItems, setQrItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, medData] = await Promise.all([
          apiRequest(`/batches/${batchId}`),
          apiRequest("/medicines"),
        ]);
        if (cancelled) return;
        setBatch(data);
        setMed(
          (medData ?? []).find((m) => String(m._id ?? m.id) === String(data.medicineId)) ?? null,
        );
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  if (loading && !batch) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading batch…" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="space-y-6">
        <PageHeader title="Batch not found" />
        <EmptyState
          title="This batch doesn't exist"
          description={error ?? "It may have been deleted."}
          action={
            <Button asChild>
              <Link to="/batches">Back to batches</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const totalStock = batch.stock?.quantityOnHand ?? 0;
  const status = computeBatchStatus(batch, totalStock, settings.nearExpiryDays);
  const row = {
    batch,
    med,
    status,
    totalStock,
    locations: batch.warehouse
      ? [{ locationType: batch.warehouse.locationType, rackCode: batch.warehouse.rackCode }]
      : [],
  };
  const handleExport = async (dataRows, format) => {
    try {
      const ok =
        format === "csv" ? exportBatchesCsv(dataRows, []) : await exportBatchesPdf(dataRows, []);
      if (ok) toast.success(`Batch exported to ${format.toUpperCase()}`);
      else toast.error("Nothing to export");
    } catch (err) {
      toast.error(err.message || "Export failed");
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/batches">
            <ArrowLeft className="mr-1 h-4 w-4" /> All batches
          </Link>
        </Button>
        <PageHeader
          title={`Batch ${batch.batchNumber}`}
          description={med?.name ?? "—"}
          actions={
            <>
              <StatusBadge status={status} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQrItems([{ batch, med }]);
                  setQrOpen(true);
                }}
              >
                <QrCode className="mr-1.5 h-4 w-4" /> Print QR label
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-muted-foreground">
                    <Download className="mr-1.5 h-4 w-4" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport([row], "csv")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport([row], "pdf")}>
                    <Download className="mr-2 h-4 w-4" /> Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoTile
          label="Manufacture"
          value={safeFormat(batch.dates?.manufacturingDate, "dd MMM yyyy")}
        />
        <InfoTile label="Expiry" value={safeFormat(batch.dates?.expiryDate, "dd MMM yyyy")} />
        <InfoTile label="Current stock" value={`${totalStock} ${batch.stock?.uom ?? ""}`} />
        <InfoTile
          label="Quarantined"
          value={`${batch.stock?.quarantined ?? 0} ${batch.stock?.uom ?? ""}`}
        />
        <InfoTile
          label="MRP"
          value={`${settings.currency}${(batch.pricing?.mrp ?? 0).toFixed(2)}`}
        />
        <InfoTile
          label="Purchase price"
          value={`${settings.currency}${(batch.pricing?.purchasePrice ?? 0).toFixed(2)}`}
        />
        <InfoTile
          label="Selling price"
          value={`${settings.currency}${(batch.pricing?.sellingPrice ?? 0).toFixed(2)}`}
        />
        <InfoTile
          label="Total stock value"
          value={`${settings.currency}${(totalStock * (batch.pricing?.purchasePrice ?? 0)).toFixed(2)}`}
        />
        <InfoTile label="Location" value={batch.warehouse?.locationType ?? "—"} />
        <InfoTile label="Rack" value={batch.warehouse?.rackCode ?? "—"} />
        <InfoTile label="Batch state" value={batch.status?.state ?? "—"} />
        <InfoTile label="Version" value={`v${batch.version ?? 1}`} />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Lifecycle</h3>
          <p className="text-xs text-muted-foreground">
            Every stock movement recorded for this batch.
          </p>
        </div>
        <div className="p-6">
          <EmptyState title="No movements yet" description="Movements will appear here." />
        </div>
      </div>

      <BatchQrSheet open={qrOpen} onOpenChange={setQrOpen} items={qrItems} />
    </div>
  );
}
