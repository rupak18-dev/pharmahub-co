import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EditStaffDialog({ profile, open, onOpenChange }) {
  const profiles = useDb((d) => d.profiles);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open || !profile) return;
    setName(profile.name ?? "");
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
    setDesignation(profile.designation ?? "");
    setErrors({});
  }, [open, profile]);

  const handleSave = () => {
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Please enter the staff member's name.";
    if (!email.trim()) nextErrors.email = "Please enter a valid work email.";
    else if (!EMAIL_PATTERN.test(email.trim()))
      nextErrors.email = "Please enter a valid work email.";
    else if (
      profiles.some(
        (p) => p.id !== profile.id && p.email.toLowerCase() === email.trim().toLowerCase(),
      )
    )
      nextErrors.email = "A staff member with this email already exists.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    db.set((d) => {
      const p = d.profiles.find((x) => x.id === profile.id);
      if (p) {
        p.name = name.trim();
        p.email = email.trim();
        p.phone = phone.trim() || undefined;
        p.designation = designation.trim() || undefined;
      }
    });
    toast.success("Staff details updated.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" /> Edit Staff
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Update contact details for {profile?.name}.
          </p>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Full Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              className={errors.name ? "border-destructive focus-visible:ring-destructive/30" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Work Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              className={errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
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

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" className="h-9 text-xs font-semibold" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
