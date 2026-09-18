import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
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
import { Textarea } from "@/Components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { ProfileSectionCard } from "./ProfileSectionCard";

const BUSINESS_TYPES = [
  "Independent Pharmacy",
  "Pharmacy Chain",
  "Hospital Pharmacy",
  "Clinic Pharmacy",
  "Wholesale Distributor",
];

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-foreground">
          {value || <span className="text-muted-foreground">Not provided</span>}
        </p>
      </div>
    </div>
  );
}

function OrganizationManageDialog({ open, onOpenChange }) {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    orgName: user?.orgName ?? "",
    businessType: user?.businessType ?? BUSINESS_TYPES[0],
    phone: user?.phone ?? "",
    businessEmail: user?.businessEmail ?? "",
    gstin: user?.gstin ?? "",
    address: user?.address ?? "",
  });

  // Re-seed the form from the signed-in user's record whenever the dialog
  // opens so it never shows stale values after a save.
  useEffect(() => {
    if (!open) return;
    setForm({
      orgName: user?.orgName ?? "",
      businessType: user?.businessType ?? BUSINESS_TYPES[0],
      phone: user?.phone ?? "",
      businessEmail: user?.businessEmail ?? "",
      gstin: user?.gstin ?? "",
      address: user?.address ?? "",
    });
  }, [open, user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Persist to the backend profile (all fields are in the API whitelist). The
  // backend derives the target user from the JWT — never from the client.
  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({
        orgName: form.orgName,
        businessType: form.businessType,
        phone: form.phone,
        businessEmail: form.businessEmail,
        gstin: form.gstin,
        address: form.address,
      });
      onOpenChange(false);
      toast.success("Organization details saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save organization details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Manage Organization</DialogTitle>
          <DialogDescription>
            Update your pharmacy organization details. Applied to your profile.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={form.orgName}
              onChange={set("orgName")}
              placeholder="PharmaHub"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-type">Business Type</Label>
            <Select
              value={form.businessType}
              onValueChange={(v) => setForm((f) => ({ ...f, businessType: v }))}
            >
              <SelectTrigger id="org-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Operating Status</Label>
            <div className="flex h-9 items-center">
              <Badge variant="success">
                <BadgeCheck className="mr-1 h-3 w-3" /> Active
              </Badge>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-phone">Phone</Label>
            <Input
              id="org-phone"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-email">Email</Label>
            <Input
              id="org-email"
              type="email"
              value={form.businessEmail}
              onChange={set("businessEmail")}
              placeholder="contact@pharmahub.example"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-gstin">GSTIN</Label>
            <Input
              id="org-gstin"
              value={form.gstin}
              onChange={set("gstin")}
              placeholder="27ABCDE1234F1Z5"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="org-address">Pharmacy Address</Label>
            <Textarea
              id="org-address"
              rows={3}
              value={form.address}
              onChange={set("address")}
              placeholder="Shop 12, Main Street, New Delhi 110001"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button size="sm" className="h-9 text-xs font-semibold" onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {saving ? "Saving…" : "Save organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrganizationSection() {
  const { user } = useAuth();
  const has = usePermission();
  const canEdit = has("admin", "update");
  const [open, setOpen] = useState(false);

  return (
    <ProfileSectionCard
      id="organization"
      icon={Building2}
      title="Organization"
      description="Your pharmacy organization details."
      className="col-span-12"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Applies organization-wide.</span>
          <Button
            variant="outline"
            size="xs"
            className="h-7 gap-1.5 text-xs font-medium hover:border-primary/50 hover:text-primary transition-colors"
            onClick={() => setOpen(true)}
            disabled={!canEdit}
          >
            <Settings2 className="h-3 w-3" />
            Manage Organization
          </Button>
        </div>
      }
    >
      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryRow icon={Building2} label="Organization Name" value={user?.orgName} />
        <SummaryRow icon={BadgeCheck} label="Business Type" value={user?.businessType} />
        <SummaryRow icon={Phone} label="Phone" value={user?.phone} />
        <SummaryRow icon={Mail} label="Email" value={user?.businessEmail} />
        <SummaryRow icon={Landmark} label="GSTIN" value={user?.gstin} />
        <SummaryRow icon={MapPin} label="Pharmacy Address" value={user?.address} />
      </div>

      <OrganizationManageDialog open={open} onOpenChange={setOpen} />
    </ProfileSectionCard>
  );
}
