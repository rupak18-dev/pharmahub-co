import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Store,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Badge } from "@/Components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";

export const handle = { title: "Manage Organizations · PharmaHub" };

const BUSINESS_TYPES = [
  "Independent Pharmacy",
  "Pharmacy Chain",
  "Hospital Pharmacy",
  "Clinic Pharmacy",
  "Wholesale Distributor",
];

const INITIAL_BRANCHES = [
  { id: "main", name: "Main Branch (HQ)", address: "Shop 12, Main Street, Central Plaza", phone: "+91 98765 43210", status: "Active" },
  { id: "downtown", name: "Downtown Pharmacy", address: "Commercial Complex, Sector 4", phone: "+91 98765 43211", status: "Active" },
  { id: "westside", name: "Westside Clinic", address: "Medical Hub, West Avenue", phone: "+91 98765 43212", status: "Active" },
];

export default function OrganizationsPage() {
  const { user } = useAuth();
  const owner = useDb((d) => d.profiles.find((p) => p.role === "Owner")) || user;

  const [form, setForm] = useState({
    orgName: owner?.orgName || "PharmaHub Pharmacy",
    businessType: owner?.businessType || BUSINESS_TYPES[0],
    phone: owner?.phone || "",
    businessEmail: owner?.businessEmail || "",
    gstin: owner?.gstin || "",
    address: owner?.address || "",
  });

  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSaveOrg = () => {
    setSaving(true);
    db.set((d) => {
      const own = d.profiles.find((p) => p.id === user?.id) || d.profiles[0];
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
        action: "Updated organization details",
        entityType: "organization",
        createdAt: new Date().toISOString(),
      });
    });

    setTimeout(() => {
      setSaving(false);
      toast.success("Organization details saved!");
    }, 300);
  };

  const handleAddBranch = () => {
    if (!newBranchName.trim()) {
      toast.error("Branch name is required");
      return;
    }

    const created = {
      id: "branch-" + Date.now(),
      name: newBranchName.trim(),
      address: newBranchAddress.trim() || "Address pending",
      phone: newBranchPhone.trim() || "+91 98765 00000",
      status: "Active",
    };

    setBranches((prev) => [...prev, created]);
    setNewBranchName("");
    setNewBranchAddress("");
    setNewBranchPhone("");
    setAddBranchOpen(false);
    toast.success(`Branch "${created.name}" added successfully`);
  };

  return (
    <div className="w-full pb-16 pt-2">
      <div className="mx-auto w-full max-w-[1000px] space-y-8 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Manage Organizations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organization profile, business classification, and multi-branch management.
            </p>
          </div>

          <Button
            onClick={handleSaveOrg}
            disabled={saving}
            className="self-start sm:self-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2 rounded-xl shadow-sm px-5 py-2.5"
          >
            <Save className="h-4 w-4" /> Save Organization
          </Button>
        </div>

        {/* Organization Info Form */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Organization Identity
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Primary organization details applied across all branches.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="orgName" className="text-xs font-semibold">Organization Name</Label>
              <Input
                id="orgName"
                value={form.orgName}
                onChange={setField("orgName")}
                placeholder="PharmaHub Pharmacy"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="businessType" className="text-xs font-semibold">Business Classification</Label>
              <Select
                value={form.businessType}
                onValueChange={(v) => setForm((f) => ({ ...f, businessType: v }))}
              >
                <SelectTrigger id="businessType" className="rounded-xl text-sm">
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
              <Label className="text-xs font-semibold">Operating Status</Label>
              <div className="flex h-10 items-center">
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-xs font-semibold px-3 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Active Organization
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">HQ Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={setField("phone")}
                placeholder="+91 98765 43210"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="businessEmail" className="text-xs font-semibold">HQ Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={form.businessEmail}
                onChange={setField("businessEmail")}
                placeholder="contact@pharmahub.example"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="gstin" className="text-xs font-semibold">GSTIN / Tax ID</Label>
              <Input
                id="gstin"
                value={form.gstin}
                onChange={setField("gstin")}
                placeholder="27ABCDE1234F1Z5"
                className="rounded-xl text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address" className="text-xs font-semibold">HQ Registered Address</Label>
              <Textarea
                id="address"
                rows={2}
                value={form.address}
                onChange={setField("address")}
                placeholder="Shop 12, Main Street, Central Plaza"
                className="rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Branch Management Section */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" /> Store Branches ({branches.length})
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Physical store locations under this organization.
              </p>
            </div>

            <Button
              onClick={() => setAddBranchOpen(true)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-9 text-xs font-semibold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Branch
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">{b.name}</h4>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-200">
                    {b.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                  {b.address}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                  {b.phone}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Add Branch Modal */}
        <Dialog open={addBranchOpen} onOpenChange={setAddBranchOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add New Store Branch</DialogTitle>
              <DialogDescription className="text-xs">
                Register a new physical pharmacy location.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="bname" className="text-xs font-semibold">Branch Name</Label>
                <Input
                  id="bname"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Northside Pharmacy"
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bphone" className="text-xs font-semibold">Branch Contact Phone</Label>
                <Input
                  id="bphone"
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baddr" className="text-xs font-semibold">Branch Address</Label>
                <Textarea
                  id="baddr"
                  rows={2}
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  placeholder="Full street address..."
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setAddBranchOpen(false)} className="rounded-xl h-9 text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddBranch} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-9 text-xs font-semibold">
                Save Branch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
