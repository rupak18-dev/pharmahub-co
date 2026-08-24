import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { BATCH_LOCATIONS } from "@/lib/batch-schema";
import { PageHeader } from "@/Components/shared/PageHeader";
import { EmptyState } from "@/Components/shared/EmptyState";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

const UNITS = ["Boxes", "Strips", "Vials", "Units"];

const editSchema = z
  .object({
    manufacturingDate: z.string().min(1, "Required"),
    expiryDate: z.string().min(1, "Required"),
    purchasePrice: z.coerce.number().min(0, "Must be 0 or more"),
    mrp: z.coerce.number().min(0, "Must be 0 or more"),
    sellingPrice: z.coerce.number().min(0, "Must be 0 or more"),
    gstRate: z.coerce.number().min(0, "Must be 0 or more"),
    locationType: z.enum(BATCH_LOCATIONS),
    rackCode: z.string().trim().min(1, "Required").max(20),
    quantityOnHand: z.coerce.number().int("Whole numbers only").min(0, "Must be 0 or more"),
    uom: z.string().min(1, "Required"),
  })
  .refine((v) => new Date(v.expiryDate) > new Date(v.manufacturingDate), {
    message: "Expiry must be after manufacture date",
    path: ["expiryDate"],
  });

export const handle = { title: "Edit batch · PharmaHub" };

function FieldError({ error }) {
  if (!error) return null;
  return <p className="text-xs text-destructive">{error.message}</p>;
}

export default function EditBatchPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [medName, setMedName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(editSchema) });
  const locationType = watch("locationType");
  const uom = watch("uom");

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
        reset({
          manufacturingDate: data.dates?.manufacturingDate ?? "",
          expiryDate: data.dates?.expiryDate ?? "",
          purchasePrice: data.pricing?.purchasePrice ?? 0,
          mrp: data.pricing?.mrp ?? 0,
          sellingPrice: data.pricing?.sellingPrice ?? 0,
          gstRate: data.pricing?.gstRate ?? 0,
          locationType: data.warehouse?.locationType ?? "Front Shelf",
          rackCode: data.warehouse?.rackCode ?? "",
          quantityOnHand: data.stock?.quantityOnHand ?? 0,
          uom: data.stock?.uom ?? "Units",
        });
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId, reset]);

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

  const onSubmit = async (v) => {
    try {
      await apiRequest(`/batches/${batchId}`, {
        method: "PATCH",
        body: JSON.stringify({
          dates: {
            manufacturingDate: v.manufacturingDate,
            expiryDate: v.expiryDate,
          },
          pricing: {
            purchasePrice: v.purchasePrice,
            mrp: v.mrp,
            sellingPrice: v.sellingPrice,
            gstRate: v.gstRate,
          },
          warehouse: { locationType: v.locationType, rackCode: v.rackCode },
          stock: { quantityOnHand: v.quantityOnHand, uom: v.uom },
        }),
      });
      toast.success("Batch updated");
      navigate(`/batches/${batchId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update batch");
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
          title={`Edit batch ${batch.batchNumber}`}
          description={medName ?? "Update batch details"}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold">Identity</h3>
          <p className="text-xs text-muted-foreground">
            Medicine and batch number cannot be changed.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Medicine
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{medName ?? "—"}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Batch number
              </div>
              <div className="mt-1 font-mono text-sm text-foreground">{batch.batchNumber}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Important dates</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manufacturingDate">Manufacture date *</Label>
              <Input
                id="manufacturingDate"
                type="date"
                className="h-11 text-base sm:text-sm"
                {...register("manufacturingDate")}
              />
              <FieldError error={errors.manufacturingDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry date *</Label>
              <Input
                id="expiryDate"
                type="date"
                className="h-11 text-base sm:text-sm"
                {...register("expiryDate")}
              />
              <FieldError error={errors.expiryDate} />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Pricing</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase price *</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min={0}
                className="h-11 text-base sm:text-sm"
                {...register("purchasePrice")}
              />
              <FieldError error={errors.purchasePrice} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP *</Label>
              <Input
                id="mrp"
                className="h-11 text-base sm:text-sm"
                type="number"
                step="0.01"
                min={0}
                {...register("mrp")}
              />
              <FieldError error={errors.mrp} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling price *</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                min={0}
                className="h-11 text-base sm:text-sm"
                {...register("sellingPrice")}
              />
              <FieldError error={errors.sellingPrice} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstRate">GST rate (%) *</Label>
              <Input
                id="gstRate"
                className="h-11 text-base sm:text-sm"
                type="number"
                step="0.01"
                min={0}
                {...register("gstRate")}
              />
              <FieldError error={errors.gstRate} />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Warehouse</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Location type *</Label>
              <Select value={locationType || ""} onValueChange={(v) => setValue("locationType", v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={errors.locationType} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rackCode">Rack code *</Label>
              <Input
                id="rackCode"
                placeholder="e.g. FS-A1"
                className="h-11 text-base sm:text-sm"
                {...register("rackCode")}
              />
              <FieldError error={errors.rackCode} />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Stock</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantityOnHand">Quantity on hand *</Label>
              <Input
                id="quantityOnHand"
                type="number"
                min={0}
                step={1}
                className="font-mono h-11 text-base sm:text-sm"
                {...register("quantityOnHand")}
              />
              <FieldError error={errors.quantityOnHand} />
            </div>
            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select value={uom || ""} onValueChange={(v) => setValue("uom", v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={errors.uom} />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to={`/batches/${batchId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            <Save className="mr-1.5 h-4 w-4" />
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
