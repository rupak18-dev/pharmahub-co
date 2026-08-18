import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Check,
  Building,
  Briefcase,
  Mail,
  User,
  Phone,
} from "lucide-react";
import { db } from "@/lib/db";
import { useDb } from "@/hooks/useDb";
import { invitationService } from "@/lib/invitationService";
import { ALL_MODULES, ALL_ROLES } from "@/lib/permissions";
import { getRoleDescription, getRoleIcon } from "@/lib/roleCatalog";
import { toast } from "sonner";
const ACTION_GROUPS = [
  {
    groupName: "General Access",
    actions: [{ key: "view", label: "View Data" }],
  },
  {
    groupName: "Management",
    actions: [
      { key: "create", label: "Create Records" },
      { key: "update", label: "Edit / Update" },
    ],
  },
  {
    groupName: "Advanced Operations",
    actions: [
      { key: "approve", label: "Approve Workflow" },
      { key: "export", label: "Export Data" },
      { key: "delete", label: "Delete Records" },
    ],
  },
];
export function InviteUserWizard({ isOpen, onClose }) {
  const profiles = useDb((d) => d.profiles);
  const permissionsState = useDb((d) => d.permissions);
  const [step, setStep] = useState(1);
  // Step 1 Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // Step 2 State
  const [selectedRole, setSelectedRole] = useState("Pharmacist");
  // Step 3 & 4 State (Custom permissions initialized from selected role)
  const [customPermissions, setCustomPermissions] = useState(() => permissionsState.Pharmacist);
  // When role changes in Step 2, update default customPermissions
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setCustomPermissions(structuredClone(permissionsState[role]));
  };
  // Toggle module view in Step 3
  const toggleModuleSelection = (modKey) => {
    setCustomPermissions((prev) => {
      const next = structuredClone(prev);
      const currentlyView = next[modKey]?.view;
      const newValue = !currentlyView;
      next[modKey].view = newValue;
      if (!newValue) {
        // If module is deselected, disable actions
        next[modKey].create = false;
        next[modKey].update = false;
        next[modKey].delete = false;
        next[modKey].approve = false;
        next[modKey].export = false;
      } else {
        // Default to view enabled
        next[modKey].view = true;
      }
      return next;
    });
  };
  // Toggle action pill in Step 4
  const toggleActionPill = (modKey, actionKey) => {
    setCustomPermissions((prev) => {
      const next = structuredClone(prev);
      next[modKey][actionKey] = !next[modKey][actionKey];
      // If an action is enabled, ensure view is also enabled
      if (next[modKey][actionKey]) {
        next[modKey].view = true;
      }
      return next;
    });
  };
  // Validate step transitions
  const canGoNext = () => {
    if (step === 1) {
      return fullName.trim().length > 0 && email.trim().length > 0 && email.includes("@");
    }
    return true;
  };
  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim() || !email.trim()) {
        toast.error("Full name and valid email are required.");
        return;
      }
      const existing = profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
      if (existing) {
        toast.error("A user profile with this email address already exists.");
        return;
      }
    }
    if (step < 5) {
      setStep((s) => s + 1);
    }
  };
  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setStep(1);
    setFullName("");
    setEmail("");
    setPhone("");
    setSelectedRole("Pharmacist");
    setCustomPermissions(structuredClone(permissionsState.Pharmacist));
  };
  const handleCreateEmployee = async () => {
    if (!fullName.trim() || !email.trim()) return;
    try {
      setSubmitting(true);
      const accessIds = selectedModules.map((m) => m.key);
      await invitationService.invite({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role: selectedRole,
        accessIds,
        permissions: customPermissions,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pharmahub:invitations-changed"));
      }

      toast.success(`Successfully sent invitation to ${fullName.trim()} (${email.trim()})`);
      resetForm();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite employee.");
    } finally {
      setSubmitting(false);
    }
  };
  // Selected modules list for Step 4 & Step 5
  const selectedModules = useMemo(() => {
    return ALL_MODULES.filter((m) => customPermissions[m.key]?.view);
  }, [customPermissions]);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[780px] max-h-[90vh] overflow-y-auto p-6">
        {/* Header & Step Tracker */}
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Onboard Employee Wizard
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Provision a new user account, assign security roles, and customize access policies.
              </DialogDescription>
            </div>
            <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              Step {step} of 5
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-4 grid grid-cols-5 gap-1.5 pt-2">
            {[
              "1. Employee Info",
              "2. Assign Role",
              "3. Select Modules",
              "4. Action Pills",
              "5. Review",
            ].map((label, idx) => {
              const stepNum = idx + 1;
              const isCurrent = step === stepNum;
              const isDone = step > stepNum;
              return (
                <div
                  key={label}
                  onClick={() => isDone && setStep(stepNum)}
                  className={`flex flex-col gap-1 border-t-2 pt-2 text-[11px] font-medium transition-all ${isDone ? "cursor-pointer" : "cursor-default"} ${
                    isCurrent
                      ? "border-primary text-primary"
                      : isDone
                        ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                        : "border-border text-muted-foreground/60"
                  }`}
                >
                  <span className="truncate">{label}</span>
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* STEP 1: Employee Information */}
        {step === 1 && (
          <div className="space-y-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wiz-name" className="text-xs font-semibold">
                  Full Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="wiz-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    className="pl-9 text-xs"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wiz-email" className="text-xs font-semibold">
                  Work Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="wiz-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="marcus@pharmacy.com"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wiz-phone" className="text-xs font-semibold">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="wiz-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Assign Role */}
        {step === 2 && (
          <div className="space-y-3 py-3">
            <div className="text-xs text-muted-foreground">
              Select an enterprise security role. Roles define baseline system access policies.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_ROLES.map((role) => {
                const RoleIcon = getRoleIcon(role);
                const desc = getRoleDescription(role);
                const isSelected = selectedRole === role;
                return (
                  <div
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`rounded-xl border p-3.5 space-y-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RoleIcon
                          className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <h4 className="font-semibold text-xs text-foreground">{role}</h4>
                      </div>
                      {isSelected && (
                        <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Assign Modules */}
        {step === 3 && (
          <div className="space-y-3 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Click module cards to enable or disable navigation access for this user.
              </span>
              <span className="font-mono font-medium text-foreground">
                {selectedModules.length} of 13 Selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto p-1">
              {ALL_MODULES.map((mod) => {
                const isSelected = customPermissions[mod.key]?.view ?? false;
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => toggleModuleSelection(mod.key)}
                    className={`flex items-center justify-between rounded-lg border p-3 text-xs font-medium transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span className="truncate">{mod.label}</span>
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ml-1.5 ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "border border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Assign Permissions (Action Pills) */}
        {step === 4 && (
          <div className="space-y-4 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Customize action pills for selected modules. Zero checkboxes or switches.
              </span>
            </div>

            {selectedModules.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <p>No modules were selected in Step 3.</p>
                <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                  Back to Select Modules
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {selectedModules.map((mod) => (
                  <div
                    key={mod.key}
                    className="rounded-xl border border-border bg-card p-3.5 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h4 className="font-semibold text-xs text-foreground">
                        {mod.label} Permissions
                      </h4>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        Module Key: {mod.key}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {ACTION_GROUPS.map((group) => (
                        <div key={group.groupName} className="space-y-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {group.groupName}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {group.actions.map((act) => {
                              const isEnabled = customPermissions[mod.key]?.[act.key] ?? false;
                              return (
                                <button
                                  key={act.key}
                                  type="button"
                                  onClick={() => toggleActionPill(mod.key, act.key)}
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                                    isEnabled
                                      ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                  }`}
                                >
                                  {isEnabled && <Check className="h-3 w-3" />}
                                  <span>{act.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Review & Confirm */}
        {step === 5 && (
          <div className="space-y-4 py-3 text-xs">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2">
                Employee Profile Overview
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Full Name:</span>
                  <div className="font-semibold text-foreground">{fullName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Email Address:</span>
                  <div className="font-mono text-foreground">{email}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned Role:</span>
                  <div>
                    <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {selectedRole}
                    </span>
                  </div>
                </div>
                {phone && (
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <div className="font-mono text-foreground">{phone}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Permissions Summary */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h4 className="font-semibold text-sm text-foreground">Configured Access Scope</h4>
                <span className="font-mono text-xs text-muted-foreground">
                  {selectedModules.length} Active Modules
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedModules.map((m) => (
                  <span
                    key={m.key}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-medium text-foreground"
                  >
                    <Check className="h-3 w-3 text-emerald-500" />
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={step === 1 ? onClose : handleBack}
            className="gap-1"
          >
            {step > 1 && <ChevronLeft className="h-4 w-4" />}
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 5 ? (
            <Button size="sm" disabled={!canGoNext()} onClick={handleNext} className="gap-1">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={submitting}
              onClick={handleCreateEmployee}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <UserPlus className="h-4 w-4" /> {submitting ? "Sending Invitation…" : "Provision & Create Account"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
