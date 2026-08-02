import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Power, PowerOff, Barcode } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { usePermission } from "@/hooks/usePermission";
import { logActivity } from "@/lib/stock";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { StatusBadge } from "@/components/pharmacy/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Medicine } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard/medicines")({
  head: () => ({ meta: [{ title: "Medicines · PharmacyOS" }] }),
  component: MedicinesPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Required").max(120),
  genericName: z.string().trim().max(120).optional().or(z.literal("")),
  brandName: z.string().trim().max(120).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  manufacturerId: z.string().optional().or(z.literal("")),
  hsnCode: z.string().trim().max(20).optional().or(z.literal("")),
  gstRate: z.coerce.number().min(0).max(100),
  storageRequirements: z.string().trim().max(200).optional().or(z.literal("")),
  barcode: z.string().trim().max(64).optional().or(z.literal("")),
  reorderThreshold: z.coerce.number().min(0).max(100000),
});

type FormValues = z.infer<typeof schema>;

function MedicinesPage() {
  const medicines = useDb((d) => d.medicines);
  const categories = useDb((d) => d.categories);
  const manufacturers = useDb((d) => d.manufacturers);
  const batches = useDb((d) => d.batches);
  const inventoryStock = useDb((d) => d.inventoryStock);
  const has = usePermission();
  const { user } = useAuth();

  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [mfrFilter, setMfrFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Medicine | null>(null);

  const stockByMed = useMemo(() => {
    const m = new Map<string, number>();
    inventoryStock.forEach((s) => {
      const b = batches.find((b) => b.id === s.batchId);
      if (b) m.set(b.medicineId, (m.get(b.medicineId) ?? 0) + s.quantityOnHand);
    });
    return m;
  }, [batches, inventoryStock]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return medicines
      .filter((m) => {
        if (activeFilter === "active" && !m.isActive) return false;
        if (activeFilter === "inactive" && m.isActive) return false;
        if (catFilter !== "all" && m.categoryId !== catFilter) return false;
        if (mfrFilter !== "all" && m.manufacturerId !== mfrFilter) return false;
        if (!s) return true;
        return (
          m.name.toLowerCase().includes(s) ||
          (m.genericName ?? "").toLowerCase().includes(s) ||
          (m.brandName ?? "").toLowerCase().includes(s) ||
          (m.barcode ?? "").toLowerCase().includes(s)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [medicines, q, catFilter, mfrFilter, activeFilter]);

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (m: Medicine) => {
    setEditing(m);
    setSheetOpen(true);
  };

  const submit = (values: FormValues) => {
    if (editing) {
      db.set((d) => {
        const m = d.medicines.find((x) => x.id === editing.id);
        if (!m) return;
        Object.assign(m, {
          ...values,
          genericName: values.genericName || undefined,
          brandName: values.brandName || undefined,
          categoryId: values.categoryId || undefined,
          manufacturerId: values.manufacturerId || undefined,
          hsnCode: values.hsnCode || undefined,
          storageRequirements: values.storageRequirements || undefined,
          barcode: values.barcode || undefined,
        });
      });
      if (user)
        logActivity({
          userId: user.id,
          userName: user.name,
          action: `Updated medicine ${values.name}`,
          entityType: "medicine",
          entityId: editing.id,
        });
      toast.success("Medicine updated");
    } else {
      const id = db.uid();
      const now = new Date().toISOString();
      db.set((d) => {
        d.medicines.push({
          id,
          isActive: true,
          createdAt: now,
          ...values,
          genericName: values.genericName || undefined,
          brandName: values.brandName || undefined,
          categoryId: values.categoryId || undefined,
          manufacturerId: values.manufacturerId || undefined,
          hsnCode: values.hsnCode || undefined,
          storageRequirements: values.storageRequirements || undefined,
          barcode: values.barcode || `PH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        });
      });
      if (user)
        logActivity({
          userId: user.id,
          userName: user.name,
          action: `Added medicine ${values.name}`,
          entityType: "medicine",
          entityId: id,
        });
      toast.success("Medicine added");
    }
    setSheetOpen(false);
  };

  const toggleActive = (m: Medicine) => {
    db.set((d) => {
      const t = d.medicines.find((x) => x.id === m.id);
      if (t) t.isActive = !t.isActive;
    });
    if (user)
      logActivity({
        userId: user.id,
        userName: user.name,
        action: `${m.isActive ? "Deactivated" : "Activated"} medicine ${m.name}`,
        entityType: "medicine",
        entityId: m.id,
      });
    toast.success(`Medicine ${m.isActive ? "deactivated" : "activated"}`);
    setConfirmDeactivate(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicine master"
        description="Manage your catalog of medicines, generics, and brands."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/medicines/categories">Categories</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/medicines/manufacturers">Manufacturers</Link>
            </Button>
            {has("medicines", "create") && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" /> Add medicine
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, generic, brand, or barcode…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-none">
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={mfrFilter} onValueChange={setMfrFilter}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Manufacturer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All manufacturers</SelectItem>
              {manufacturers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={activeFilter}
            onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}
          >
            <SelectTrigger className="sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No medicines found"
          description="Try adjusting your filters or add a new medicine."
          action={
            has("medicines", "create") && (
              <Button onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" /> Add medicine
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Medicine</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Manufacturer</th>
                  <th className="px-4 py-2.5 font-medium text-right">Stock</th>
                  <th className="px-4 py-2.5 font-medium text-right">GST</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => {
                  const stock = stockByMed.get(m.id) ?? 0;
                  const stockTone =
                    stock === 0
                      ? "out"
                      : stock <= m.reorderThreshold
                        ? "low"
                        : "healthy";
                  return (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{m.name}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          {m.genericName && <span>{m.genericName}</span>}
                          {m.barcode && (
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Barcode className="h-3 w-3" /> {m.barcode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {categories.find((c) => c.id === m.categoryId)?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {manufacturers.find((x) => x.id === m.manufacturerId)?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{stock}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                        {m.gstRate}%
                      </td>
                      <td className="px-4 py-3">
                        {m.isActive ? (
                          <StatusBadge status={stockTone} />
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {has("medicines", "update") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(m)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {has("medicines", "delete") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setConfirmDeactivate(m)}
                            >
                              {m.isActive ? (
                                <PowerOff className="h-4 w-4 text-destructive" />
                              ) : (
                                <Power className="h-4 w-4 text-success" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {filtered.map((m) => {
              const stock = stockByMed.get(m.id) ?? 0;
              const stockTone =
                stock === 0 ? "out" : stock <= m.reorderThreshold ? "low" : "healthy";
              return (
                <div key={m.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{m.name}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {m.genericName} · {manufacturers.find((x) => x.id === m.manufacturerId)?.name}
                      </div>
                    </div>
                    {m.isActive ? (
                      <StatusBadge status={stockTone} />
                    ) : (
                      <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Stock</div>
                      <div className="font-mono">{stock}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">GST</div>
                      <div className="font-mono">{m.gstRate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Reorder</div>
                      <div className="font-mono">{m.reorderThreshold}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {has("medicines", "update") && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(m)}>
                        <Pencil className="mr-1 h-4 w-4" /> Edit
                      </Button>
                    )}
                    {has("medicines", "delete") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setConfirmDeactivate(m)}
                      >
                        {m.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <MedicineFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        onSubmit={submit}
      />

      <AlertDialog
        open={!!confirmDeactivate}
        onOpenChange={(o) => !o && setConfirmDeactivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDeactivate?.isActive ? "Deactivate" : "Activate"} medicine?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeactivate?.isActive
                ? "It will be hidden from sales and reorder alerts. Existing batches are preserved."
                : "It will be selectable again in sales and inventory."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeactivate && toggleActive(confirmDeactivate)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MedicineFormSheet({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Medicine | null;
  onSubmit: (v: FormValues) => void;
}) {
  const categories = useDb((d) => d.categories);
  const manufacturers = useDb((d) => d.manufacturers);
  const settings = useDb((d) => d.settings);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          name: editing.name,
          genericName: editing.genericName ?? "",
          brandName: editing.brandName ?? "",
          categoryId: editing.categoryId ?? "",
          manufacturerId: editing.manufacturerId ?? "",
          hsnCode: editing.hsnCode ?? "",
          gstRate: editing.gstRate,
          storageRequirements: editing.storageRequirements ?? "",
          barcode: editing.barcode ?? "",
          reorderThreshold: editing.reorderThreshold,
        }
      : {
          name: "",
          genericName: "",
          brandName: "",
          categoryId: "",
          manufacturerId: "",
          hsnCode: "",
          gstRate: settings.gstDefault,
          storageRequirements: "",
          barcode: "",
          reorderThreshold: settings.lowStockDefault,
        },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit medicine" : "Add medicine"}</SheetTitle>
          <SheetDescription>
            Details entered here appear across inventory, batches, and sales.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit((v) => {
            onSubmit(v);
            reset();
          })}
          className="flex-1 overflow-y-auto space-y-4 py-4 px-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="genericName">Generic name</Label>
              <Input id="genericName" {...register("genericName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand name</Label>
              <Input id="brandName" {...register("brandName")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={watch("categoryId") || ""}
                onValueChange={(v) => setValue("categoryId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Select
                value={watch("manufacturerId") || ""}
                onValueChange={(v) => setValue("manufacturerId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="hsnCode">HSN code</Label>
              <Input id="hsnCode" {...register("hsnCode")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstRate">GST %</Label>
              <Input id="gstRate" type="number" step="0.5" {...register("gstRate")} />
              {errors.gstRate && (
                <p className="text-xs text-destructive">{errors.gstRate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderThreshold">Reorder at</Label>
              <Input
                id="reorderThreshold"
                type="number"
                {...register("reorderThreshold")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="storageRequirements">Storage requirements</Label>
            <Textarea
              id="storageRequirements"
              rows={2}
              placeholder="e.g. Store below 25°C, protect from light"
              {...register("storageRequirements")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode / QR</Label>
            <Input
              id="barcode"
              placeholder="Leave empty to auto-generate"
              {...register("barcode")}
            />
          </div>
          <SheetFooter className="mt-2 flex-row gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editing ? "Save changes" : "Add medicine"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
