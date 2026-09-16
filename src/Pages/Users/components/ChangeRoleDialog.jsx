import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  Sparkles,
  UserPlus,
  ShoppingBag,
  ClipboardCheck,
  Truck,
  Download,
  Bell,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/Components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { ALL_ROLES } from "@/lib/permissions";
import { getRoleMeta } from "./staffRoles";
import { getAccessModule } from "./accessModules";
import { AddAccessPopover } from "./AddAccessPopover";

export function ChangeRoleDialog({ open, onOpenChange, profile, onSave }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(profile?.role ?? "");
  const [access, setAccess] = useState(profile?.accessIds ?? []);

  // Track the ID of the staff member currently being edited so background refetches
  // do not reset step back to 1 or overwrite unsaved changes while the dialog is open.
  const initializedIdRef = useRef(null);

  // Features state
  const [features, setFeatures] = useState({
    processSales: true,
    stockAudit: true,
    purchasing: true,
    dataExport: true,
    notifications: true,
    userAdmin: false,
  });

  useEffect(() => {
    if (!open) {
      initializedIdRef.current = null;
      return;
    }

    // Only initialize form fields and reset step when newly opened or switching to a different user
    if (profile && initializedIdRef.current !== profile.id) {
      initializedIdRef.current = profile.id;
      setStep(1);
      setName(profile.name ?? "");
      setEmail(profile.email ?? "");
      setPhone(profile.phone ?? "");
      setRole(profile.role ?? "");
      setAccess(profile.accessIds ?? []);

      const isAdmin = profile.role === "Store Administrator" || profile.role === "Pharmacy Manager";
      const storedFeatures = profile.featureAccess ?? {};
      setFeatures({
        processSales: storedFeatures.processSales ?? true,
        stockAudit: storedFeatures.stockAudit ?? true,
        purchasing: storedFeatures.purchasing ?? true,
        dataExport: storedFeatures.dataExport ?? true,
        notifications: storedFeatures.notifications ?? true,
        userAdmin: storedFeatures.userAdmin ?? isAdmin,
      });
    }
  }, [open, profile?.id]);


  const meta = getRoleMeta(role);
  const addAccess = (ids) => setAccess((prev) => [...new Set([...prev, ...ids])]);
  const removeAccess = (id) => setAccess((prev) => prev.filter((x) => x !== id));

  const handleSave = () => {
    onSave?.({
      role,
      accessIds: access,
      name,
      phone,
      features,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col h-full bg-background border-l border-border shadow-2xl z-50 overflow-hidden [&>button]:hidden"
      >
        {/* Header */}
        <div className="border-b border-border/80 bg-card px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <SheetTitle className="text-lg font-bold text-foreground">
                Edit Staff & Change Role
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
              Update staff details, role assignment, and permissions for{" "}
              {profile?.name ?? "staff member"}.
            </SheetDescription>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Stepper Bar */}
        <div className="border-b border-border/60 bg-muted/30 px-6 py-3 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            {[
              { num: 1, label: "Details" },
              { num: 2, label: "Permissions" },
              { num: 3, label: "Features" },
            ].map((s) => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setStep(s.num)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : isDone
                        ? "bg-primary/15 text-primary hover:bg-primary/25"
                        : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      isActive
                        ? "bg-white text-primary font-bold"
                        : isDone
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : s.num}
                  </span>
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Work Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Role *</Label>
                  <Select value={role ?? ""} onValueChange={setRole}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {ALL_ROLES.filter((r) => r !== "Owner" && r !== "Admin").map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {meta && (
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {role} Overview
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {meta.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-xs text-primary">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    Select pages this staff member will have access to.
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Customize navigation and module permissions for {name || "staff"}.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Configured Access Modules</Label>
                  <AddAccessPopover selectedIds={access} onAdd={addAccess} />
                </div>

                {access.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No specific module access assigned.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {access.map((id) => {
                      const mod = getAccessModule(id);
                      if (!mod) return null;
                      const Icon = mod.icon;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {mod.name}
                          <button
                            type="button"
                            onClick={() => removeAccess(id)}
                            className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs">
                <div className="h-8 w-8 rounded-lg bg-background border border-border/80 flex items-center justify-center text-muted-foreground shrink-0 shadow-2xs">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-xs">Configure Operational Capabilities</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    Toggle feature capabilities and special privileges for {name || "this staff member"}.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    key: "processSales",
                    icon: ShoppingBag,
                    title: "Process Sales & POS Checkout",
                    desc: "Allow checkout in POS billing, processing transactions, and issuing refunds.",
                  },
                  {
                    key: "stockAudit",
                    icon: ClipboardCheck,
                    title: "Stock Audit & Adjustments",
                    desc: "Allow inventory count adjustments, batch stock updates, and expiry write-offs.",
                  },
                  {
                    key: "purchasing",
                    icon: Truck,
                    title: "Supplier Purchase Orders",
                    desc: "Allow creating supplier purchase orders, logging deliveries, and receiving stock.",
                  },
                  {
                    key: "dataExport",
                    icon: Download,
                    title: "Data Export & Reports",
                    desc: "Allow downloading analytics, stock sheets, and financial reports as Excel or CSV.",
                  },
                  {
                    key: "notifications",
                    icon: Bell,
                    title: "Automated Stock & Expiry Alerts",
                    desc: "Receive real-time alerts for low stock levels and expiring batches.",
                  },
                  {
                    key: "userAdmin",
                    icon: ShieldCheck,
                    title: "Staff & Security Administration",
                    desc: "Allow inviting new team members, changing roles, and configuring system security.",
                  },
                ].map((feat) => {
                  const Icon = feat.icon;
                  const isChecked = features[feat.key] ?? false;
                  return (
                    <div
                      key={feat.key}
                      className={cn(
                        "flex items-start justify-between p-3 rounded-xl border transition-all duration-150 gap-3.5",
                        isChecked
                          ? "border-primary/30 bg-card shadow-2xs"
                          : "border-border/60 bg-muted/10 opacity-75 hover:opacity-100",
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors mt-0.5",
                            isChecked
                              ? "border-primary/25 bg-primary/10 text-primary"
                              : "border-border bg-muted/60 text-muted-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">{feat.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {feat.desc}
                          </p>
                        </div>
                      </div>

                      <Switch
                        checked={isChecked}
                        onCheckedChange={(val) =>
                          setFeatures((prev) => ({ ...prev, [feat.key]: val }))
                        }
                        className="mt-1 data-[state=checked]:bg-primary scale-90"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
          {step === 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs rounded-xl"
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => s - 1)}
              className="h-9 text-xs rounded-xl gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}

          {step < 3 ? (
            <Button
              size="sm"
              onClick={() => setStep((s) => s + 1)}
              className="h-9 px-5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSave}
              className="h-9 px-6 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" /> Save Changes
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
