import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ALL_ACTIONS, ALL_MODULES, ALL_ROLES } from "@/lib/permissions";
import type { RoleName } from "@/lib/types";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/dashboard/users")({
  head: () => ({ meta: [{ title: "Users & Roles Â· PharmaHub" }] }),
  component: UsersPage,
});

function UsersPage() {
  const has = usePermission();
  if (!has("users", "view")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Users & Roles" />
        <EmptyState
          icon={ShieldCheck}
          title="You don't have permission to view this module"
          description="Contact an Owner or Admin to request access."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Manage team access and configure permissions per role."
      />
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="permissions">Permission matrix</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="permissions" className="mt-4">
          <PermissionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const profiles = useDb((d) => d.profiles);
  const { user } = useAuth();
  const has = usePermission();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleName>("Cashier");

  const invite = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (
      profiles.find(
        (p) => p.email.toLowerCase() === email.trim().toLowerCase(),
      )
    ) {
      toast.error("A user with that email already exists");
      return;
    }
    db.set((d) => {
      d.profiles.push({
        id: db.uid(),
        name: name.trim(),
        email: email.trim(),
        role,
        active: true,
        createdAt: new Date().toISOString(),
      });
    });
    toast.success("User invited");
    setOpen(false);
    setName("");
    setEmail("");
  };

  const toggleActive = (id: string) => {
    if (user?.id === id) {
      toast.error("You can't deactivate yourself");
      return;
    }
    db.set((d) => {
      const p = d.profiles.find((x) => x.id === id);
      if (p) p.active = !p.active;
    });
  };

  const changeRole = (id: string, next: RoleName) => {
    db.set((d) => {
      const p = d.profiles.find((x) => x.id === id);
      if (p) p.role = next;
    });
    toast.success("Role updated");
  };

  return (
    <div className="space-y-4">
      {has("users", "create") && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-1 h-4 w-4" /> Invite user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite team member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as RoleName)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={invite}>Send invite</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  {p.name}
                  {user?.id === p.id && (
                    <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      You
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                <td className="px-4 py-3">
                  {has("users", "update") ? (
                    <Select
                      value={p.role}
                      onValueChange={(v) => changeRole(p.id, v as RoleName)}
                      disabled={p.role === "Owner" && user?.id !== p.id}
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{p.role}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <X className="h-3 w-3" /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {has("users", "update") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(p.id)}
                      disabled={user?.id === p.id}
                    >
                      {p.active ? "Deactivate" : "Activate"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PermissionsTab() {
  const perms = useDb((d) => d.permissions);
  const has = usePermission();
  const canEdit = has("users", "update");

  const toggle = (role: RoleName, moduleKey: string, action: string) => {
    if (role === "Owner") return;
    db.set((d) => {
      const r = d.permissions[role];
      // @ts-expect-error indexing
      r[moduleKey][action] = !r[moduleKey][action];
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        Owner always has every permission. Changes apply immediately across the app.
      </div>
      <div className="overflow-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2.5">Role</th>
              <th className="px-3 py-2.5">Module</th>
              {ALL_ACTIONS.map((a) => (
                <th key={a} className="px-3 py-2.5 text-center capitalize">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ALL_ROLES.flatMap((role) =>
              ALL_MODULES.map((mod, i) => (
                <tr key={`${role}-${mod.key}`} className="hover:bg-muted/30">
                  {i === 0 ? (
                    <td
                      rowSpan={ALL_MODULES.length}
                      className="sticky left-0 z-10 border-r border-border bg-card px-3 py-2.5 align-top font-semibold"
                    >
                      {role}
                    </td>
                  ) : null}
                  <td className="px-3 py-2 text-muted-foreground">{mod.label}</td>
                  {ALL_ACTIONS.map((a) => (
                    <td key={a} className="px-3 py-2 text-center">
                      <Checkbox
                        checked={perms[role][mod.key][a]}
                        disabled={!canEdit || role === "Owner"}
                        onCheckedChange={() => toggle(role, mod.key, a)}
                      />
                    </td>
                  ))}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
