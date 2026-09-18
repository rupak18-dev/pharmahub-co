import { useState } from "react";
import { Check, KeyRound, Lock, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getAuthToken } from "@/lib/api";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { cn } from "@/lib/utils";

const REQUIREMENTS = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function SecurityRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <dt className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function PasswordDialog({ open, onOpenChange }) {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleChangePassword = async () => {
    const nextErrors = {};
    if (!form.current) nextErrors.current = "Enter your current password.";
    if (!form.next) nextErrors.next = "Enter a new password.";
    else if (!REQUIREMENTS.every((r) => r.test(form.next)))
      nextErrors.next = "Meet all the password requirements.";
    if (!form.confirm) nextErrors.confirm = "Confirm your new password.";
    else if (form.next !== form.confirm) nextErrors.confirm = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await changePassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      onOpenChange(false);
      toast.success("Password updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update your password.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Security Settings</DialogTitle>
          <DialogDescription>Keep your account password secure and up to date.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={form.current}
              onChange={(e) => setField("current", e.target.value)}
            />
            {errors.current && <p className="text-xs text-destructive">{errors.current}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={form.next}
                onChange={(e) => setField("next", e.target.value)}
              />
              {errors.next && <p className="text-xs text-destructive">{errors.next}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setField("confirm", e.target.value)}
              />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
            </div>
          </div>
          <ul className="grid gap-1.5 sm:grid-cols-2" aria-label="Password requirements">
            {REQUIREMENTS.map((r) => {
              const met = form.next ? r.test(form.next) : false;
              return (
                <li
                  key={r.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    met ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded-full border",
                      met ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                    aria-hidden="true"
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {r.label}
                </li>
              );
            })}
          </ul>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            onClick={handleChangePassword}
          >
            <KeyRound className="h-3.5 w-3.5" /> Change Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SecuritySection() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const passwordSet = Boolean(user?.password || getAuthToken());

  return (
    <ProfileSectionCard
      id="security"
      icon={ShieldCheck}
      title="Security"
      description="Keep your account secure."
      className="w-full"
    >
      <dl>
        <SecurityRow icon={Lock} label="Password">
          <div className="flex items-center gap-2">
            {passwordSet ? (
              <Badge variant="success">Set</Badge>
            ) : (
              <Badge variant="secondary">Not set</Badge>
            )}
            <Button
              variant="outline"
              size="xs"
              onClick={() => setOpen(true)}
              className="h-7 text-xs px-2.5 font-medium gap-1.5 hover:border-primary/50 hover:text-primary transition-colors"
            >
              <KeyRound className="h-3 w-3 text-primary" /> Change Password
            </Button>
          </div>
        </SecurityRow>
        <SecurityRow icon={KeyRound} label="Two-factor authentication">
          <Badge variant="secondary">Not configured</Badge>
        </SecurityRow>
        <SecurityRow icon={MonitorSmartphone} label="Active Sessions">
          <span className="text-sm text-muted-foreground">No data</span>
        </SecurityRow>
        <SecurityRow icon={ShieldCheck} label="Login Activity">
          <span className="text-sm text-muted-foreground">No login activity recorded</span>
        </SecurityRow>
      </dl>

      <PasswordDialog open={open} onOpenChange={setOpen} />
    </ProfileSectionCard>
  );
}
