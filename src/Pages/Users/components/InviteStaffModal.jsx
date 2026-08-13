import { useEffect, useState } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { ALL_ROLES } from "@/lib/permissions";
import { getRoleMeta } from "./staffRoles";

const DEPARTMENTS = [
  "Pharmacy Operations",
  "Sales & POS",
  "Inventory",
  "Purchasing",
  "Administration",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteStaffModal({ open, onOpenChange, onInvited }) {
  const profiles = useDb((d) => d.profiles);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setPhone("");
    setRole("");
    setDepartment("");
    setDesignation("");
    setErrors({});
    setDone(false);
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = () => {
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Please enter the staff member's name.";
    if (!email.trim()) nextErrors.email = "Please enter a valid work email.";
    else if (!EMAIL_PATTERN.test(email.trim()))
      nextErrors.email = "Please enter a valid work email.";
    else if (profiles.some((p) => p.email.toLowerCase() === email.trim().toLowerCase()))
      nextErrors.email = "A staff member with this email already exists.";
    if (!role) nextErrors.role = "Please select a role.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    db.set((d) => {
      d.profiles.push({
        id: db.uid(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        department: department || undefined,
        designation: designation.trim() || undefined,
        active: false,
        status: "pending",
        orgName: "PharmaHub",
        createdAt: new Date().toISOString(),
      });
    });
    toast.success(`Invitation prepared for ${email.trim()}.`);
    onInvited?.(name.trim());
    setDone(true);
  };

  const meta = getRoleMeta(role);
  const RoleIcon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Invite Staff Member
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Add a staff member and assign their role in PharmaHub.
          </p>
        </DialogHeader>

        {done ? (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Invitation Sent</p>
              <p className="mt-1 text-sm text-muted-foreground">
                An invitation has been prepared for <strong>{email.trim()}</strong>.
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The staff member is listed as pending until they confirm.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name *</Label>
                <Input
                  placeholder="Ravi Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  aria-invalid={!!errors.name}
                  className={
                    errors.name ? "border-destructive focus-visible:ring-destructive/30" : ""
                  }
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Work Email *</Label>
                <Input
                  type="email"
                  placeholder="ravi@pharmacy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  className={
                    errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""
                  }
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger
                    className={`h-9 text-sm ${errors.role ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => {
                      const rm = getRoleMeta(r);
                      const Icon = rm.icon;
                      return (
                        <SelectItem key={r} value={r}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            {r}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Designation</Label>
                <Input
                  placeholder="Senior Pharmacist"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>
            </div>

            {role && (
              <div className="mt-4 rounded-lg border border-border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <RoleIcon className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">{role}</p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {meta.description}
                </p>
              </div>
            )}
          </div>
        )}

        {!done && (
          <DialogFooter className="border-t border-border px-6 py-4">
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="sm" className="h-9 text-xs font-semibold" onClick={handleSubmit}>
              Send Invitation
            </Button>
          </DialogFooter>
        )}

        {done && (
          <DialogFooter className="border-t border-border px-6 py-4">
            <Button size="sm" className="h-9 text-xs font-semibold" onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
