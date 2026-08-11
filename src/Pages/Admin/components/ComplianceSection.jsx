import { useState } from "react";
import { Building2, FileCheck, IdCard, Landmark, Save, Settings2 } from "lucide-react";
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
import { ProfileSectionCard } from "./ProfileSectionCard";

function ComplianceRow({ icon: Icon, label, value, badge }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <dt className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd>
        {badge ?? (
          <span className="text-sm font-medium text-foreground">
            {value || <span className="font-normal text-muted-foreground">Not configured</span>}
          </span>
        )}
      </dd>
    </div>
  );
}

function ComplianceDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const has = usePermission();
  const owner = useDb((d) => d.profiles.find((p) => p.role === "Owner"));
  const canEdit = has("admin", "update");
  const [licenseNo, setLicenseNo] = useState(owner?.licenseNo ?? "");
  const [gstin, setGstin] = useState(owner?.gstin ?? "");

  const save = () => {
    db.set((d) => {
      const own = d.profiles.find((p) => p.role === "Owner");
      if (own) {
        own.licenseNo = licenseNo.trim();
        own.gstin = gstin.trim();
      }
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user?.id ?? "",
        userName: user?.name ?? "",
        action: "Updated compliance details",
        entityType: "settings",
        createdAt: new Date().toISOString(),
      });
    });
    onOpenChange(false);
    toast.success("Compliance details saved");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Manage Compliance</DialogTitle>
          <DialogDescription>Registration details used for pharmacy compliance.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="compliance-license">Pharmacy License</Label>
            <div className="relative">
              <IdCard className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="compliance-license"
                className="pl-8"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                disabled={!canEdit}
                placeholder="DL-27-1234-5678"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compliance-gstin">GST Registration (GSTIN)</Label>
            <div className="relative">
              <Landmark className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="compliance-gstin"
                className="pl-8"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                disabled={!canEdit}
                placeholder="27ABCDE1234F1Z5"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Drug License and Business Registration will be available once the compliance documents
            module is connected.
          </p>
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
            <Save className="mr-1.5 h-4 w-4" /> Save compliance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ComplianceSection() {
  const owner = useDb((d) => d.profiles.find((p) => p.role === "Owner"));
  const [open, setOpen] = useState(false);

  return (
    <ProfileSectionCard
      id="compliance-documents"
      icon={FileCheck}
      title="Compliance & Documents"
      description="Licenses and registrations for your pharmacy."
      className="col-span-12 md:col-span-6 lg:col-span-5"
      footer={
        <>
          <Button size="sm" className="h-9 text-xs font-semibold" onClick={() => setOpen(true)}>
            <Settings2 className="mr-1.5 h-4 w-4" /> Manage Compliance
          </Button>
        </>
      }
    >
      <dl>
        <ComplianceRow icon={IdCard} label="Pharmacy License" value={owner?.licenseNo} />
        <ComplianceRow
          icon={FileCheck}
          label="Drug License"
          badge={<Badge variant="secondary">Not configured</Badge>}
        />
        <ComplianceRow icon={Landmark} label="GST Registration" value={owner?.gstin} />
        <ComplianceRow
          icon={Building2}
          label="Business Registration"
          badge={<Badge variant="secondary">Not configured</Badge>}
        />
      </dl>

      <ComplianceDialog open={open} onOpenChange={setOpen} />
    </ProfileSectionCard>
  );
}
