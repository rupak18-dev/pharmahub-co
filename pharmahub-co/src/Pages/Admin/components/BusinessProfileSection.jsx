import { useState } from "react";
import { IdCard, Landmark, Mail, MapPin, Phone, Save } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/Components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";

export function BusinessProfileSection() {
  const { user } = useAuth();
  const has = usePermission();
  const owner = useDb((d) => d.profiles.find((p) => p.role === "Owner"));
  const canEdit = has("admin", "update");
  const [form, setForm] = useState({
    gstin: owner?.gstin ?? "",
    licenseNo: owner?.licenseNo ?? "",
    phone: owner?.phone ?? "",
    businessEmail: owner?.businessEmail ?? "",
    address: owner?.address ?? "",
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const save = () => {
    db.set((d) => {
      const own = d.profiles.find((p) => p.role === "Owner");
      if (own) {
        own.gstin = form.gstin;
        own.licenseNo = form.licenseNo;
        own.phone = form.phone;
        own.businessEmail = form.businessEmail;
        own.address = form.address;
      }
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user?.id ?? "",
        userName: user?.name ?? "",
        action: "Updated business profile",
        entityType: "settings",
        createdAt: new Date().toISOString(),
      });
    });
    toast.success("Business profile saved");
  };
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Business Profile</CardTitle>
        <CardDescription>
          Registration and contact information used on invoices, receipts, and reports.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>GSTIN</Label>
          <div className="relative">
            <Landmark className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              value={form.gstin}
              onChange={set("gstin")}
              disabled={!canEdit}
              placeholder="27ABCDE1234F1Z5"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Pharmacy license number</Label>
          <div className="relative">
            <IdCard className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              value={form.licenseNo}
              onChange={set("licenseNo")}
              disabled={!canEdit}
              placeholder="DL-27-1234-5678"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              value={form.phone}
              onChange={set("phone")}
              disabled={!canEdit}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Business email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              className="pl-8"
              value={form.businessEmail}
              onChange={set("businessEmail")}
              disabled={!canEdit}
              placeholder="contact@pharmahub.example"
            />
          </div>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Registered address</Label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              rows={3}
              className="pl-8"
              value={form.address}
              onChange={set("address")}
              disabled={!canEdit}
              placeholder="Shop 12, Main Street, New Delhi 110001"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={save} disabled={!canEdit}>
          <Save className="mr-1.5 h-4 w-4" /> Save business profile
        </Button>
      </CardFooter>
    </Card>
  );
}
