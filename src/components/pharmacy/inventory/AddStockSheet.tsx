import { useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ConfigProvider, DatePicker } from "antd";
import dayjs from "dayjs";
import { CheckCircle2, PackagePlus, ReceiptText } from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { RACK_LOCATIONS } from "@/lib/racks";
import { STOCK_TYPES } from "@/lib/types";
import { formatINR } from "@/lib/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const schema = z
  .object({
    medicineId: z.string().min(1, "Pick the medicine you received"),
    unitType: z.string().min(1, "Pick the type of stock"),
    supplierId: z.string().min(1, "Pick the supplier"),
    invoice: z.string().trim().optional(),
    batchNumber: z.string().trim().min(1, "Enter the batch number"),
    mfgDate: z.string().optional(),
    expiryDate: z.string().min(1, "Enter the expiry date"),
    purchaseRate: z.coerce
      .number({ invalid_type_error: "Enter a valid purchase rate" })
      .positive("Purchase rate must be above zero"),
    mrp: z.coerce
      .number({ invalid_type_error: "Enter a valid MRP" })
      .positive("MRP must be above zero"),
    quantity: z.coerce
      .number({ invalid_type_error: "Enter a quantity" })
      .positive("Quantity must be above zero"),
    storageLocation: z.string().min(1, "Pick where it will be stored"),
  })
  .refine((v) => !v.mfgDate || !v.expiryDate || new Date(v.expiryDate) > new Date(v.mfgDate), {
    message: "Expiry must be after the manufacturing date",
    path: ["expiryDate"],
  });

type FormValues = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function AddStockSheet() {
  const d = useDb((db) => db);
  const [done, setDone] = useState<FormValues | null>(null);
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const values = watch();
  const quantity = Number(values.quantity || 0);
  const rate = Number(values.purchaseRate || 0);
  const total = quantity * rate;
  const selectedMedicine = d.medicines.find((m) => m.id === values.medicineId);
  const unit = values.unitType || selectedMedicine?.unitLabel || "units";

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setDone(data);
  };

  const resetAll = () => {
    reset();
    setDone(null);
  };

  const medicineName = done
    ? (d.medicines.find((m) => m.id === done.medicineId)?.brandName ??
      d.medicines.find((m) => m.id === done.medicineId)?.name ??
      "—")
    : "";
  const supplierName = done ? (d.suppliers.find((s) => s.id === done.supplierId)?.name ?? "—") : "";

  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) resetAll();
      }}
    >
      <SheetTrigger asChild>
        <Button className="shrink-0">
          <PackagePlus className="h-4 w-4" />
          Add Stock
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle>Inward Stock Shipment Entry</SheetTitle>
          <SheetDescription>
            Record a new batch of stock you received from a supplier.
          </SheetDescription>
        </SheetHeader>

        {done ? (
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 overflow-y-auto px-6 py-8">
            <div className="rounded-xl border border-success/30 bg-success/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <div>
                  <p className="font-medium text-foreground">Stock entry logged</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    This is a preview — the write-back to the stock ledger lands in a later phase.
                  </p>
                </div>
              </div>
            </div>

            <dl className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Medicine</dt>
                <dd className="truncate text-right font-medium text-foreground">{medicineName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Supplier</dt>
                <dd className="truncate text-right font-medium text-foreground">{supplierName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Batch</dt>
                <dd className="font-mono text-right">{done.batchNumber}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Expiry</dt>
                <dd className="text-right">{done.expiryDate}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Quantity</dt>
                <dd className="text-right">
                  {done.quantity.toLocaleString("en-IN")} {done.unitType || unit}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Storage</dt>
                <dd className="font-mono text-right">{done.storageLocation}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2.5">
                <dt className="font-medium text-foreground">Expected cost</dt>
                <dd className="font-semibold tabular-nums">
                  {formatINR(done.quantity * done.purchaseRate)}
                </dd>
              </div>
            </dl>

            <Button onClick={resetAll} variant="outline">
              Log another entry
            </Button>
          </div>
        ) : (
          <ConfigProvider
            theme={{ token: { colorPrimary: "#007A5A", borderRadius: 10, fontSize: 13 } }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div className="space-y-2">
                  <Label htmlFor="medicine">Medicine</Label>
                  <Controller
                    control={control}
                    name="medicineId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const med = d.medicines.find((m) => m.id === value);
                          if (med?.unitLabel) setValue("unitType", med.unitLabel);
                        }}
                      >
                        <SelectTrigger id="medicine" className="w-full">
                          <SelectValue placeholder="Search or pick a medicine" />
                        </SelectTrigger>
                        <SelectContent>
                          {d.medicines
                            .filter((m) => m.isActive)
                            .map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.brandName ?? m.name} · {m.unitLabel ?? "units"}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.medicineId?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockType">Type of stock</Label>
                  <Controller
                    control={control}
                    name="unitType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="stockType" className="w-full">
                          <SelectValue placeholder="Tablets, strips, syrup…" />
                        </SelectTrigger>
                        <SelectContent>
                          {STOCK_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-fills from the medicine — change it if you received it differently.
                  </p>
                  <FieldError message={errors.unitType?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier / Distributor</Label>
                  <Controller
                    control={control}
                    name="supplierId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="supplier" className="w-full">
                          <SelectValue placeholder="Pick a supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {d.suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.supplierId?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice">Purchase invoice number</Label>
                  <Input id="invoice" placeholder="INV-8821" {...register("invoice")} />
                  <p className="text-xs text-muted-foreground">
                    Optional — helps you match the bill later.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch number</Label>
                    <Input id="batch" placeholder="B1002C" {...register("batchNumber")} />
                    <FieldError message={errors.batchNumber?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mfg">Manufacturing date</Label>
                    <Controller
                      control={control}
                      name="mfgDate"
                      render={({ field }) => (
                        <DatePicker
                          id="mfg"
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(d) => field.onChange(d ? d.format("YYYY-MM-DD") : "")}
                          format="DD/MM/YYYY"
                          placeholder="DD/MM/YYYY"
                          disabledDate={(d) => d.isAfter(dayjs(), "day")}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry date</Label>
                  <Controller
                    control={control}
                    name="expiryDate"
                    render={({ field }) => (
                      <DatePicker
                        id="expiry"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(d) => field.onChange(d ? d.format("YYYY-MM-DD") : "")}
                        format="DD/MM/YYYY"
                        placeholder="DD/MM/YYYY"
                        className="w-full"
                      />
                    )}
                  />
                  <FieldError message={errors.expiryDate?.message} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseRate">Purchase rate (₹)</Label>
                    <Input
                      id="purchaseRate"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="22.00"
                      {...register("purchaseRate")}
                    />
                    <FieldError message={errors.purchaseRate?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mrp">MRP (₹)</Label>
                    <Input
                      id="mrp"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="30.00"
                      {...register("mrp")}
                    />
                    <FieldError message={errors.mrp?.message} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity received</Label>
                  <div className="flex gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="500"
                      className="flex-1"
                      {...register("quantity")}
                    />
                    <div className="grid w-24 shrink-0 place-items-center rounded-md border border-border bg-muted/40 text-sm text-muted-foreground">
                      {unit}
                    </div>
                  </div>
                  <FieldError message={errors.quantity?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Storage location</Label>
                  <Controller
                    control={control}
                    name="storageLocation"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="location" className="w-full">
                          <SelectValue placeholder="Pick a rack or fridge" />
                        </SelectTrigger>
                        <SelectContent>
                          {RACK_LOCATIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.storageLocation?.message} />
                </div>
              </div>

              <div className="border-t border-border px-6 py-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <ReceiptText className="h-4 w-4" />
                    Expected cost
                  </span>
                  <span className="font-semibold tabular-nums">{formatINR(total)}</span>
                </div>
                <Button type="submit" className="w-full">
                  Confirm &amp; Log Stock
                </Button>
              </div>
            </form>
          </ConfigProvider>
        )}
      </SheetContent>
    </Sheet>
  );
}
