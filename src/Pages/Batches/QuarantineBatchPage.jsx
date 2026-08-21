import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { ArrowLeft, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { PageHeader } from "@/Components/shared/PageHeader";
import { EmptyState } from "@/Components/shared/EmptyState";
import { StatusBadge } from "@/Components/shared/StatusBadge";
import { computeBatchStatus } from "@/lib/stock";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";

const quarantineSchema = z.object({
  reason: z.string().trim().min(1, "Reason required").max(200, "Max 200 characters"),
  quarantineUntil: z.string().optional(),
});

export const handle = { title: "Quarantine batch · PharmaHub" };

const DEFAULT_UNTIL = () => format(addDays(new Date(), 14), "yyyy-MM-dd");

function SummaryTile({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-muted/40 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export default function QuarantineBatchPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [medName, setMedName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [releasing, setReleasing] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(quarantineSchema),
    defaultValues: { reason: "", quarantineUntil: DEFAULT_UNTIL() },
  });

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
        setMedName(
          (medData ?? []).find((m) => String(m._id ?? m.id) === String(data.medicineId))?.name ??
            null,
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
  const status = computeBatchStatus(batch, totalStock, 90);
  const alreadyQuarantined =
    batch.status?.state === "QUARANTINED" || (batch.stock?.quarantined ?? 0) > 0;

  const onSubmit = async (v) => {
    try {
      await apiRequest(`/batches/${batchId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "quarantine", reason: v.reason.trim() }),
      });
      if (v.quarantineUntil) {
        await apiRequest(`/batches/${batchId}`, {
          method: "PATCH",
          body: JSON.stringify({ dates: { quarantineUntil: v.quarantineUntil } }),
        });
      }
      toast.success("Batch moved to quarantine");
      navigate(`/batches/${batchId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not quarantine batch");
    }
  };

  const releaseFromQuarantine = async () => {
    setReleasing(true);
    try {
      await apiRequest(`/batches/${batchId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "activate", reason: "Released from quarantine" }),
      });
      toast.success("Batch released from quarantine");
      navigate(`/batches/${batchId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not release batch");
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to={`/batches/${batchId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to batch
          </Link>
        </Button>
        <PageHeader
          title={`Quarantine batch ${batch.batchNumber}`}
          description={medName ?? "Move this batch out of sellable stock"}
        />
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold">Batch summary</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryTile label="Medicine" value={medName ?? "—"} />
            <SummaryTile label="Current stock" value={`${totalStock} ${batch.stock?.uom ?? ""}`} />
            <SummaryTile label="Location" value={batch.warehouse?.locationType ?? "—"} />
            <SummaryTile label="Status" value={<StatusBadge status={status} />} />
          </div>
        </div>

        {alreadyQuarantined && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  This batch is already quarantined.
                </p>
                <p className="text-xs text-muted-foreground">
                  Reason: {batch.status?.quarantineReason ?? "—"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={releaseFromQuarantine}
              disabled={releasing}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              {releasing ? "Releasing…" : "Release from quarantine"}
            </Button>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl border border-border bg-card p-4"
        >
          <h3 className="text-sm font-semibold">Quarantine details</h3>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="e.g. Failed QC check, temperature excursion…"
              rows={3}
              className="text-base sm:text-sm"
              {...register("reason")}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
          <div className="space-y-2 sm:w-1/2">
            <Label htmlFor="quarantineUntil">Quarantined until</Label>
            <Input
              id="quarantineUntil"
              type="date"
              className="h-11 text-base sm:text-sm"
              {...register("quarantineUntil")}
            />
            <p className="text-xs text-muted-foreground">Defaults to two weeks from today.</p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to={`/batches/${batchId}`}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || alreadyQuarantined}
              className="w-full sm:w-auto"
            >
              <ShieldAlert className="mr-1.5 h-4 w-4" />
              {isSubmitting ? "Quarantining…" : "Quarantine batch"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
