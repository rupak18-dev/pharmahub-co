import { useState, useEffect, useCallback, useRef } from "react";
import {
  UserPlus,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  ShieldCheck,
  Sparkles,
  User,
  Mail,
  Phone,
  LayoutDashboard,
  Pill,
  Layers,
  ListChecks,
  Plug,
  ShoppingBag,
  Receipt,
  Users as UsersIcon,
  BarChart3,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { invitationService } from "@/lib/invitationService";
import { listRoles } from "@/lib/rolesService";
import { ALL_ROLES, ALL_MODULES, DEFAULT_PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import { Badge } from "@/Components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/Components/ui/sheet";

const DEPARTMENTS = [
  "Pharmacy Operations",
  "Sales & POS",
  "Inventory & Stock",
  "Purchasing & Supply Chain",
  "Administration & HR",
  "Accounts & Finance",
];

const MODULE_ICONS = {
  dashboard: LayoutDashboard,
  medicines: Pill,
  batches: Layers,
  expiry: AlertTriangle,
  audit: ClipboardCheck,
  purchases: ShoppingBag,
  sales: Receipt,
  shortbook: ListChecks,
  users: UsersIcon,
  reports: BarChart3,
  admin: ShieldCheck,
  integrations: Plug,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function openInviteStaff() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pharmahub:open-invite-staff"));
  }
}

export function InviteStaffDrawer({ open: controlledOpen, onOpenChange: controlledOnOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = useCallback(
    (val) => {
      if (isControlled) {
        controlledOnOpenChange?.(val);
      } else {
        setInternalOpen(val);
      }
    },
    [isControlled, controlledOnOpenChange],
  );

  useEffect(() => {
    const handleOpenEvent = () => handleOpenChange(true);
    window.addEventListener("pharmahub:open-invite-staff", handleOpenEvent);
    return () => window.removeEventListener("pharmahub:open-invite-staff", handleOpenEvent);
  }, [handleOpenChange]);

  // Workflow Step State (1: Details, 2: Permissions, 3: Features)
  const [step, setStep] = useState(1);

  // Step 1 Form Fields
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("Pharmacist");
  const [department, setDepartment] = useState("Pharmacy Operations");

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Step 2 Module Permissions Map
  const [moduleAccess, setModuleAccess] = useState({});
  // Role permission matrices fetched from the backend (GET /roles). The
  // toggles initialize from the role's configured defaults in the database,
  // falling back to the hardcoded defaults if the backend is unreachable.
  const [roleConfigs, setRoleConfigs] = useState({});
  const roleConfigsRef = useRef({});
  const moduleTouchedRef = useRef(false);

  // Step 3 Features Map
  const [features, setFeatures] = useState({
    processSales: true,
    stockAudit: true,
    purchasing: true,
    dataExport: true,
    notifications: true,
    userAdmin: false,
  });

  // Default module toggles for a role: backend role configuration when
  // available, otherwise the hardcoded role defaults. Reads configs through a
  // ref so the function identity stays stable across renders.
  const moduleDefaultsFor = useCallback((roleName) => {
    const map = {};
    const configured = roleConfigsRef.current[roleName];
    if (configured) {
      ALL_MODULES.forEach((m) => {
        map[m.key] = Boolean(configured[m.key]?.view);
      });
      return map;
    }
    const fallback = DEFAULT_PERMISSIONS[roleName] || {};
    ALL_MODULES.forEach((m) => {
      map[m.key] = fallback[m.key]?.view ?? false;
    });
    return map;
  }, []);

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFullName("");
      setWorkEmail("");
      setPhoneNumber("");
      setRole("Pharmacist");
      setDepartment("Pharmacy Operations");
      setErrors({});
      setSubmitting(false);
      submittingRef.current = false;
      moduleTouchedRef.current = false;

      // Initialize default module permissions for Pharmacist
      setModuleAccess(moduleDefaultsFor("Pharmacist"));

      setFeatures({
        processSales: true,
        stockAudit: true,
        purchasing: true,
        dataExport: true,
        notifications: true,
        userAdmin: false,
      });

      // Fetch the configured role matrices so toggles reflect what the
      // admin configured in Role Configuration (persisted in the database).
      let cancelled = false;
      listRoles()
        .then((roles) => {
          if (cancelled) return;
          const map = {};
          roles.forEach((r) => {
            map[r.name] = r.permissions;
          });
          roleConfigsRef.current = map;
          setRoleConfigs(map);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [isOpen, moduleDefaultsFor]);

  // Re-sync toggles once backend role configs arrive (unless already edited)
  useEffect(() => {
    if (!isOpen) return;
    if (moduleTouchedRef.current) return;
    setModuleAccess(moduleDefaultsFor(role));
  }, [roleConfigs, isOpen, moduleDefaultsFor, role]);

  // When Role changes in Step 1, auto update default perms
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    moduleTouchedRef.current = false;
    setModuleAccess(moduleDefaultsFor(newRole));

    const isAdminRole = newRole === "Owner" || newRole === "Admin";
    setFeatures((prev) => ({
      ...prev,
      userAdmin: isAdminRole,
    }));
  };

  const validateDetails = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = "Full Name is required.";
    if (!workEmail.trim()) errs.workEmail = "Work Email is required.";
    else if (!EMAIL_PATTERN.test(workEmail.trim()))
      errs.workEmail = "Please enter a valid work email.";
    if (!role) errs.role = "Role is required.";
    return errs;
  };

  // Step 1 Validation & Next
  const handleNextFromStep1 = () => {
    const errs = validateDetails();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStep(2);
  };

  // Generic Next handler — validates step 1, free-advances on step 2
  const handleNext = () => {
    if (step === 1) {
      handleNextFromStep1();
    } else if (step === 2) {
      setStep(3);
    }
  };

  // Toggle single module access in Step 2
  const toggleModule = (modKey) => {
    moduleTouchedRef.current = true;
    setModuleAccess((prev) => ({
      ...prev,
      [modKey]: !prev[modKey],
    }));
  };

  // Toggle single feature in Step 3
  const toggleFeature = (featKey) => {
    setFeatures((prev) => ({
      ...prev,
      [featKey]: !prev[featKey],
    }));
  };

  // Step 3 Submission — call backend invitation API
  const handleSubmit = async () => {
    if (submittingRef.current) return;

    const errs = validateDetails();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setStep(1);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    try {
      const accessIds = Object.entries(moduleAccess)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);

      const result = await invitationService.invite({
        name: fullName.trim(),
        email: workEmail.trim().toLowerCase(),
        phone: phoneNumber.trim() || undefined,
        department: department?.trim() || undefined,
        role,
        permissions: {},
        featureAccess: features,
        accessIds,
      });

      if (result?.emailSent) {
        toast.success(`Invitation sent to ${workEmail.trim()}`);
      } else if (result?.emailSkipped) {
        toast.info(
          `Invitation created for ${workEmail.trim()}. Email delivery skipped — SMTP is not configured.`,
        );
        if (result?.link) {
          await navigator.clipboard.writeText(result.link).catch(() => {});
          toast.info("Invitation link copied to clipboard for manual sharing.");
        }
      } else {
        toast.success(`Invitation created for ${workEmail.trim()}`);
      }

      // Notify the users list to refresh
      window.dispatchEvent(new Event("pharmahub:invitations-changed"));
      handleOpenChange(false);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to send invitation. Please try again.";
      toast.error(message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const initials = fullName.trim()
    ? fullName
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col h-full bg-background border-l border-border shadow-2xl z-50 overflow-hidden [&>button]:hidden"
      >
        {/* Drawer Header */}
        <div className="border-b border-border/80 bg-card px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <SheetTitle className="text-lg font-bold text-foreground">
                Invite Staff Member
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
              Add a staff member and configure their access.
            </SheetDescription>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Stepper Progress Bar */}
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

        {/* Scrollable Step Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* STEP 1: DETAILS */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-name" className="text-xs font-semibold">
                    Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="staff-name"
                      placeholder="e.g. Dr. Ananya Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`pl-9 text-xs rounded-xl ${errors.fullName ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-[11px] text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="staff-email" className="text-xs font-semibold">
                    Work Email *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="staff-email"
                      type="email"
                      placeholder="ananya@pharmahub.com"
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      className={`pl-9 text-xs rounded-xl ${errors.workEmail ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                    />
                  </div>
                  {errors.workEmail && (
                    <p className="text-[11px] text-destructive">{errors.workEmail}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="staff-phone" className="text-xs font-semibold">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="staff-phone"
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-9 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Role *</Label>
                  <Select value={role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-[11px] text-destructive">{errors.role}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PERMISSIONS */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Information Box */}
              <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-xs text-primary">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    Select pages this role will have access to.
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    Toggle module access for <strong>{fullName || "this staff member"}</strong>{" "}
                    (Role: {role}).
                  </p>
                </div>
              </div>

              {/* Permission Cards List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_MODULES.map((mod) => {
                  const Icon = MODULE_ICONS[mod.key] || ShieldCheck;
                  const isEnabled = moduleAccess[mod.key] ?? true;
                  return (
                    <div
                      key={mod.key}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isEnabled
                          ? "border-primary/30 bg-card shadow-2xs"
                          : "border-border/60 bg-muted/20 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                            isEnabled
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{mod.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {isEnabled ? "Access Enabled" : "Access Disabled"}
                          </p>
                        </div>
                      </div>

                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleModule(mod.key)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: FEATURES */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Information Box */}
              <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-xs text-primary">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Configure Feature Capabilities</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    Enable or disable specific operational capabilities and special privileges for{" "}
                    {fullName || "staff"}.
                  </p>
                </div>
              </div>

              {/* Feature Cards Grid */}
              <div className="space-y-3">
                {[
                  {
                    key: "processSales",
                    title: "Process Sales & Refunds",
                    desc: "Allow checkout in POS billing, processing transactions, and issuing customer refunds.",
                  },
                  {
                    key: "stockAudit",
                    title: "Stock Audit & Adjustments",
                    desc: "Allow physical inventory audit logging, batch stock updates, and expiry write-offs.",
                  },
                  {
                    key: "purchasing",
                    title: "Supplier Purchase Orders",
                    desc: "Allow creating purchase orders, logging supplier deliveries, and receiving stock.",
                  },
                  {
                    key: "dataExport",
                    title: "Data Export & Reports",
                    desc: "Allow downloading sales analytics, stock sheets, and financial reports as PDF or Excel.",
                  },
                  {
                    key: "notifications",
                    title: "Automated Expiry & Stock Alerts",
                    desc: "Receive real-time email and push notifications for critical stock levels & batch expiries.",
                  },
                  {
                    key: "userAdmin",
                    title: "Staff & Security Administration",
                    desc: "Allow inviting new team members, changing roles, and configuring system security.",
                  },
                ].map((feat) => {
                  const isChecked = features[feat.key] ?? false;
                  return (
                    <div
                      key={feat.key}
                      className="flex items-start justify-between p-4 rounded-xl border border-border/80 bg-card gap-4"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">{feat.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {feat.desc}
                        </p>
                      </div>

                      <Switch
                        checked={isChecked}
                        onCheckedChange={() => toggleFeature(feat.key)}
                        className="mt-0.5 data-[state=checked]:bg-primary"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
          {step === 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
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
              onClick={handleNext}
              className="h-9 px-5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="h-9 px-6 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Send Invitation
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
