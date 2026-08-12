import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, QrCode, ScanLine, Wand2 } from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { apiRequest } from "@/lib/api";
import { batchSchema, BATCH_TYPES, LOCATION_PREFIXES } from "@/lib/batch-schema";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { DatePicker } from "@/Components/shared/DatePicker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/Components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
const UNITS = ["Boxes", "Strips", "Vials", "Units"];
// Batch number structure: [Prefix] + [Year] + [Batch Type] + [Sequential Identifier]
// Format: LL-YY-T-NNN  (e.g. FS-26-C-014)
function genBatchNumber(locationType, mfgDate, batchType, batches) {
  const prefix = LOCATION_PREFIXES[locationType] ?? "PH";
  const year = String(
    (mfgDate ? new Date(mfgDate).getFullYear() : new Date().getFullYear()) % 100,
  ).padStart(2, "0");
  const re = new RegExp(`^${prefix}-${year}-${batchType}-(\\d{3})$`);
  let max = 0;
  (batches ?? []).forEach((b) => {
    const m = re.exec(b.batchNumber);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `${prefix}-${year}-${batchType}-${String(max + 1).padStart(3, "0")}`;
}
export function AddBatchSheet({
  open,
  onOpenChange,
  onSubmit,
  meds: medsProp,
  batches,
  suppliers: suppliersProp,
}) {
  const localMeds = useDb((d) => d.medicines);
  const localSuppliers = useDb((d) => d.suppliers);
  const settings = useDb((d) => d.settings);
  const meds = medsProp ?? localMeds;
  const suppliers = (suppliersProp ?? localSuppliers).map((s) => ({ ...s, id: s._id ?? s.id }));
  const [unit, setUnit] = useState("Boxes");
  const [batchType, setBatchType] = useState("C");
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [showNewRack, setShowNewRack] = useState(false);
  const [newRackCode, setNewRackCode] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(batchSchema) });
  const mfgDate = watch("mfgDate");
  const expiryDate = watch("expiryDate");
  const minExpiry =
    mfgDate && new Date(mfgDate).getTime()
      ? new Date(new Date(mfgDate).getTime() + 86400000)
      : undefined;
  useEffect(() => {
    if (mfgDate && expiryDate && new Date(expiryDate) <= new Date(mfgDate)) {
      setValue("expiryDate", "", { shouldValidate: true });
    }
  }, [mfgDate, expiryDate, setValue]);
  useEffect(() => {
    if (!open) {
      setShowNewSupplier(false);
      setShowNewRack(false);
      setNewSupplierName("");
      setNewRackCode("");
    }
  }, [open]);
  const autoGenerate = () => {
    const locationType = watch("locationType");
    setValue("batchNumber", genBatchNumber(locationType, mfgDate, batchType, batches), {
      shouldValidate: true,
    });
  };
  const locationType = watch("locationType");
  const batchNumber = watch("batchNumber");
  useEffect(() => {
    if (batchNumber || !locationType || !mfgDate) return;
    setValue("batchNumber", genBatchNumber(locationType, mfgDate, batchType, batches), {
      shouldValidate: true,
    });
  }, [batchNumber, locationType, mfgDate, batchType, setValue, batches]);
  const rackOptions = useMemo(() => {
    const set = new Set();
    (settings?.racks ?? [])
      .filter((r) => !locationType || !r.locationType || r.locationType === locationType)
      .forEach((r) => set.add(r.code));
    (batches ?? [])
      .filter((b) => !locationType || b.warehouse?.locationType === locationType)
      .forEach((b) => b.warehouse?.rackCode && set.add(b.warehouse.rackCode));
    return Array.from(set).sort();
  }, [settings, batches, locationType]);
  const saveNewSupplier = async () => {
    const name = newSupplierName.trim();
    if (!name) {
      toast.error("Enter a supplier name");
      return;
    }
    try {
      const created = await apiRequest("/suppliers", {
        method: "POST",
        body: JSON.stringify({ name, contactInfo: "", gstNumber: "", paymentTerms: "" }),
      });
      const id = created?._id ?? created?.id;
      if (!id) throw new Error("Supplier created but no id was returned");
      setValue("supplierId", id);
      setNewSupplierName("");
      setShowNewSupplier(false);
      toast.success(`Supplier "${name}" added`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create supplier");
    }
  };
  const saveNewRack = () => {
    const code = newRackCode.trim();
    if (!code) {
      toast.error("Enter a rack code");
      return;
    }
    db.set((d) => {
      d.settings = d.settings ?? {};
      d.settings.racks = d.settings.racks ?? [];
      d.settings.racks.push({ locationType: locationType || "Front Shelf", code });
    });
    setValue("rackCode", code, { shouldValidate: true });
    setNewRackCode("");
    setShowNewRack(false);
    toast.success(`Rack "${code}" added`);
  };
  const submitAndPrint = () => {
    handleSubmit((v) => {
      onSubmit({ ...v, unit, batchType });
      reset();
      toast.success("QR label queued for printing");
    })();
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto bg-background sm:max-w-xl">
        <SheetHeader className="pr-8">
          <SheetTitle>Add New Batch</SheetTitle>
          <SheetDescription className="mt-1">
            Log incoming stock lot and link it to inventory.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit((v) => {
            onSubmit({ ...v, unit, batchType });
            reset();
          })}
          className="space-y-4 py-4"
        >
          <button
            type="button"
            onClick={() => toast("Launching GS1 2D barcode scanner…")}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-accent/50 px-3 py-2.5 text-left transition-colors hover:bg-accent"
          >
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <QrCode className="h-5 w-5" strokeWidth={1.5} />
              <span className="absolute -inset-1 animate-pulse rounded-md border border-primary/40" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-primary">
                Scan GS1 2D Barcode / QR Code
              </span>
              <span className="block text-xs text-muted-foreground">
                Point your camera at the lot label to autofill this form
              </span>
            </span>
            <ScanLine className="h-5 w-5 shrink-0 text-primary/60" strokeWidth={1.5} />
          </button>

          <div className="space-y-2">
            <Label>Medicine *</Label>
            <Select
              value={watch("medicineId") || ""}
              onValueChange={(v) => setValue("medicineId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Search & select medicine" />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="batchNumber">Batch number *</Label>
                <button
                  type="button"
                  onClick={autoGenerate}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Wand2 className="h-3 w-3" strokeWidth={1.5} /> Auto-generate
                </button>
              </div>
              <Input
                id="batchNumber"
                placeholder="e.g. FS-26-C-001"
                className="font-mono"
                {...register("batchNumber")}
              />
              {errors.batchNumber && (
                <p className="text-xs text-destructive">{errors.batchNumber.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Batch type *</Label>
              <Select value={batchType} onValueChange={setBatchType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch type" />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="quantityReceived">Quantity received *</Label>
              <div className="flex gap-2">
                <Input
                  id="quantityReceived"
                  type="number"
                  min={1}
                  placeholder="e.g. 120"
                  className="font-mono"
                  {...register("quantityReceived")}
                />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.quantityReceived && (
                <p className="text-xs text-destructive">{errors.quantityReceived.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Location Type *</Label>
              <Select
                value={watch("locationType") || ""}
                onValueChange={(v) => setValue("locationType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Front Shelf">Front Shelf</SelectItem>
                  <SelectItem value="Backroom">Backroom</SelectItem>
                  <SelectItem value="Cold Storage">Cold Storage</SelectItem>
                  <SelectItem value="Quarantine">Quarantine</SelectItem>
                </SelectContent>
              </Select>
              {errors.locationType && (
                <p className="text-xs text-destructive">{errors.locationType.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rackCode">Rack code *</Label>
              <Select
                value={watch("rackCode") || ""}
                onValueChange={(v) => {
                  if (v === "__new_rack__") {
                    setShowNewRack(true);
                    setValue("rackCode", "");
                  } else {
                    setShowNewRack(false);
                    setValue("rackCode", v, { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rack" />
                </SelectTrigger>
                <SelectContent>
                  {rackOptions.length === 0 && !showNewRack && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No racks yet</div>
                  )}
                  {rackOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new_rack__">
                    <span className="flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5" strokeWidth={2} /> New rack
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {showNewRack && (
                <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="newRackCode">New rack code *</Label>
                    <Input
                      id="newRackCode"
                      value={newRackCode}
                      onChange={(e) => setNewRackCode(e.target.value)}
                      placeholder="e.g. Shelf A1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" className="flex-1" onClick={saveNewRack}>
                      Save rack
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowNewRack(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {errors.rackCode && (
                <p className="text-xs text-destructive">{errors.rackCode.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Manufacture date *</Label>
              <DatePicker
                value={watch("mfgDate") || ""}
                onChange={(v) => setValue("mfgDate", v, { shouldValidate: true })}
              />
              {errors.mfgDate && (
                <p className="text-xs text-destructive">{errors.mfgDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Expiry date *</Label>
              <DatePicker
                value={watch("expiryDate") || ""}
                onChange={(v) => setValue("expiryDate", v, { shouldValidate: true })}
                disabled={minExpiry ? { before: minExpiry } : undefined}
              />
              {errors.expiryDate && (
                <p className="text-xs text-destructive">{errors.expiryDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select
              value={watch("supplierId") || ""}
              onValueChange={(v) => {
                if (v === "__new_supplier__") {
                  setShowNewSupplier(true);
                  setValue("supplierId", "");
                } else {
                  setShowNewSupplier(false);
                  setValue("supplierId", v);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier / stockist" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
                <SelectItem value="__new_supplier__">
                  <span className="flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} /> New supplier
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {showNewSupplier && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newSupplierName">New supplier name *</Label>
                  <Input
                    id="newSupplierName"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="e.g. MedPlus Distributors"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" className="flex-1" onClick={saveNewSupplier}>
                    Save supplier
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowNewSupplier(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="mt-2 gap-2 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-primary/30 bg-accent/50 text-primary hover:bg-accent hover:text-accent-foreground"
              onClick={submitAndPrint}
            >
              <QrCode className="h-4 w-4" strokeWidth={1.5} /> Add Batch & Print QR Label
            </Button>
            <Button type="submit" className="flex-1">
              Add Batch
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
