import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { QrCode, ScanLine, Wand2 } from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { batchSchema, type BatchFormValues } from "@/lib/batch-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/pharmacy/DatePicker";
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

const UNITS = ["Boxes", "Strips", "Vials", "Units"];

function genBatchNumber() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const num = Math.floor(1000 + Math.random() * 9000);
  const letter = letters[Math.floor(Math.random() * letters.length)];
  return `B${num}${letter}`;
}

export function AddBatchSheet({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: BatchFormValues) => void;
}) {
  const meds = useDb((d) => d.medicines);
  const suppliers = useDb((d) => d.suppliers);
  const [unit, setUnit] = useState("Boxes");
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BatchFormValues>({ resolver: zodResolver(batchSchema) });

  const submitAndPrint = () => {
    handleSubmit((v) => {
      onSubmit(v);
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
            onSubmit(v);
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
                  onClick={() => setValue("batchNumber", genBatchNumber())}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Wand2 className="h-3 w-3" strokeWidth={1.5} /> Auto-generate
                </button>
              </div>
              <Input
                id="batchNumber"
                placeholder="e.g. B1020C"
                className="font-mono"
                {...register("batchNumber")}
              />
              {errors.batchNumber && (
                <p className="text-xs text-destructive">{errors.batchNumber.message}</p>
              )}
            </div>
            <div className="space-y-2">
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
                onValueChange={(v) =>
                  setValue("locationType", v as BatchFormValues["locationType"])
                }
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
              <Input id="rackCode" placeholder="e.g. Shelf A1" {...register("rackCode")} />
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
              onValueChange={(v) => setValue("supplierId", v)}
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
              </SelectContent>
            </Select>
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
