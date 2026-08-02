import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Upload, RefreshCw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  head: () => ({ meta: [{ title: "System Admin · PharmaHub" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const has = usePermission();
  const settings = useDb((d) => d.settings);
  const owner = useDb((d) => d.profiles.find((p) => p.role === "Owner"));

  const [orgName, setOrgName] = useState(owner?.orgName ?? "");
  const [currency, setCurrency] = useState(settings.currency);
  const [gstDefault, setGstDefault] = useState(settings.gstDefault);
  const [nearExpiry, setNearExpiry] = useState(settings.nearExpiryDays);
  const [deadStock, setDeadStock] = useState(settings.deadStockDays);
  const [lowStock, setLowStock] = useState(settings.lowStockDefault);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!has("admin", "view")) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        You don't have access to system administration.
      </div>
    );
  }

  const saveOrg = () => {
    db.set((d) => {
      const own = d.profiles.find((p) => p.role === "Owner");
      if (own) own.orgName = orgName;
      d.settings.currency = currency;
      d.settings.gstDefault = gstDefault;
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user?.id ?? "",
        userName: user?.name ?? "",
        action: "Updated organization settings",
        entityType: "settings",
        createdAt: new Date().toISOString(),
      });
    });
    toast.success("Organization saved");
  };

  const saveThresholds = () => {
    db.set((d) => {
      d.settings.nearExpiryDays = nearExpiry;
      d.settings.deadStockDays = deadStock;
      d.settings.lowStockDefault = lowStock;
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user?.id ?? "",
        userName: user?.name ?? "",
        action: "Updated thresholds",
        entityType: "settings",
        details: { nearExpiry, deadStock, lowStock },
        createdAt: new Date().toISOString(),
      });
    });
    toast.success("Thresholds saved");
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(db.get(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PharmaHub-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    if (!confirm("Importing will overwrite ALL current data. Continue?")) return;
    file.text().then((txt) => {
      try {
        const parsed = JSON.parse(txt);
        db.set(() => parsed);
        toast.success("Backup restored");
      } catch {
        toast.error("Invalid backup file");
      }
    });
  };

  const resetDemo = () => {
    if (!confirm("Reset to demo seed data? All current data will be lost.")) return;
    db.reset();
    toast.success("Demo data restored");
  };

  const clearLogs = () => {
    if (!confirm("Clear all activity logs?")) return;
    db.set((d) => { d.activityLogs = []; });
    toast.success("Activity logs cleared");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="System Admin" description="Organization settings, thresholds, roles, and data management." />

      <Tabs defaultValue="org">
        <TabsList>
          <TabsTrigger value="org">Organization</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="org" className="mt-4">
          <div className="max-w-lg space-y-4 rounded-lg border border-border bg-card p-6">
            <div className="space-y-1.5">
              <Label>Organization name</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Currency symbol</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={4} />
              </div>
              <div className="space-y-1.5">
                <Label>Default GST %</Label>
                <Input type="number" value={gstDefault} onChange={(e) => setGstDefault(Number(e.target.value) || 0)} />
              </div>
            </div>
            <Button onClick={saveOrg}>Save organization</Button>
          </div>
        </TabsContent>

        <TabsContent value="thresholds" className="mt-4">
          <div className="max-w-lg space-y-4 rounded-lg border border-border bg-card p-6">
            <div className="space-y-1.5">
              <Label>Near expiry window (days)</Label>
              <Input type="number" value={nearExpiry} onChange={(e) => setNearExpiry(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Dead stock window (days)</Label>
              <Input type="number" value={deadStock} onChange={(e) => setDeadStock(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Default low-stock threshold</Label>
              <Input type="number" value={lowStock} onChange={(e) => setLowStock(Number(e.target.value) || 0)} />
            </div>
            <Button onClick={saveThresholds}>Save thresholds</Button>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Manage staff, roles, and the permission matrix on the Users & Roles page.
            </p>
            <Button variant="outline" className="mt-3" asChild>
              <Link to="/dashboard/users"><Users className="mr-1 h-4 w-4" /> Open Users & Roles</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="data" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionCard
              icon={Download}
              title="Export full backup"
              description="Download every table as a single JSON file."
              action={<Button onClick={exportJson}>Export JSON</Button>}
            />
            <ActionCard
              icon={Upload}
              title="Import backup"
              description="Restore an exported JSON. Overwrites all data."
              action={
                <>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
                  />
                  <Button variant="outline" onClick={() => fileInput.current?.click()}>Choose file</Button>
                </>
              }
            />
            <ActionCard
              icon={RefreshCw}
              title="Reset demo data"
              description="Wipe current state and re-seed the demo dataset."
              action={<Button variant="outline" onClick={resetDemo}>Reset</Button>}
            />
            <ActionCard
              icon={Trash2}
              title="Clear activity logs"
              description="Remove every entry from the audit log."
              action={<Button variant="destructive" onClick={clearLogs}>Clear logs</Button>}
            />
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <div className="max-w-lg space-y-2 rounded-lg border border-border bg-card p-6 text-sm">
            <p><span className="text-muted-foreground">Product:</span> PharmaHub</p>
            <p><span className="text-muted-foreground">Version:</span> 1.0.0 (frontend preview)</p>
            <p><span className="text-muted-foreground">Data store:</span> local browser storage (MongoDB backend coming)</p>
            <p><span className="text-muted-foreground">Signed in as:</span> {user?.name} · {user?.role}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActionCard({
  icon: Icon, title, description, action,
}: {
  icon: typeof Download;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
