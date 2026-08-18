import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
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
          {value || <span className="text-muted-foreground">Not configured</span>}
        </p>
      </div>
    </div>
  );
}

function OrganizationManageDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const has = usePermission();
  const owner = useDb((d) => d.profiles.find((p) => p.role === "Owner"));
  const canEdit = has("admin", "update");
  const [form, setForm] = useState({
    orgName: owner?.orgName ?? "",
    businessType: owner?.businessType ?? BUSINESS_TYPES[0],
    phone: owner?.phone ?? "",
    businessEmail: owner?.businessEmail ?? "",
    gstin: owner?.gstin ?? "",
    address: owner?.address ?? "",
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = () => {
    db.set((d) => {
      const own = d.profiles.find((p) => p.role === "Owner");
      if (own) {
        own.orgName = form.orgName;
        own.businessType = form.businessType;
        own.phone = form.phone;
        own.businessEmail = form.businessEmail;
        own.gstin = form.gstin;
        own.address = form.address;
      }
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user?.id ?? "",
        userName: user?.name ?? "",
        action: "Updated organization profile",
        entityType: "settings",
        createdAt: new Date().toISOString(),
      });
    });
    onOpenChange(false);
    toast.success("Organization details saved");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Manage Organization</DialogTitle>
          <DialogDescription>
            Update your pharmacy organization details. Applied organization-wide.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={form.orgName}
              onChange={set("orgName")}
              disabled={!canEdit}
              placeholder="PharmaHub"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-type">Business Type</Label>
            <Select
              value={form.businessType}
              onValueChange={(v) => setForm((f) => ({ ...f, businessType: v }))}
              disabled={!canEdit}
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
              disabled={!canEdit}
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
              disabled={!canEdit}
              placeholder="contact@pharmahub.example"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-gstin">GSTIN</Label>
            <Input
              id="org-gstin"
              value={form.gstin}
              onChange={set("gstin")}
              disabled={!canEdit}
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
              disabled={!canEdit}
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
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-9 text-xs font-semibold"
            onClick={save}
            disabled={!canEdit}
          >
            <Save className="mr-1.5 h-4 w-4" /> Save organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrganizationSection() {
  const owner = useDb((d) => d.profiles.find((p) => p.role === "Owner"));
  const [open, setOpen] = useState(false);

  return (
    <ProfileSectionCard
      id="organization"
      icon={Building2}
      title="Organization"
      description="Your pharmacy organization details."
      className="col-span-12"
      footer={<span className="text-xs text-muted-foreground">Applies organization-wide.</span>}
    >
      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryRow icon={Building2} label="Organization Name" value={owner?.orgName} />
        <SummaryRow icon={BadgeCheck} label="Business Type" value={owner?.businessType} />
        <SummaryRow icon={Phone} label="Phone" value={owner?.phone} />
        <SummaryRow icon={Mail} label="Email" value={owner?.businessEmail} />
        <SummaryRow icon={Landmark} label="GSTIN" value={owner?.gstin} />
        <SummaryRow icon={MapPin} label="Pharmacy Address" value={owner?.address} />
      </div>

      <OrganizationManageDialog open={open} onOpenChange={setOpen} />
    </ProfileSectionCard>
  );
}
