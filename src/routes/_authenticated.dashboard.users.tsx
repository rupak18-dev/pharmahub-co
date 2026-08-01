import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Check,
  X,
  ShieldCheck,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Eye,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ALL_ROLES } from "@/lib/permissions";
import type { Profile, RoleName } from "@/lib/types";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { KpiCard } from "@/components/pharmacy/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// New Enterprise Components
import { InviteUserWizard } from "@/components/users/InviteUserWizard";
import { AccessPolicyBuilder } from "@/components/users/AccessPolicyBuilder";
import { RoleCard, getRoleDescription } from "@/components/users/RoleCard";
import { RoleDetailModal } from "@/components/users/RoleDetailModal";

export const Route = createFileRoute("/_authenticated/dashboard/users")({
  head: () => ({ meta: [{ title: "Users & Roles · PharmacyOS" }] }),
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
        description="Manage team access, configure security roles, and audit access policies."
      />
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="builder">Access Policy Builder</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <RolesTab />
        </TabsContent>
        <TabsContent value="builder" className="mt-4">
          <AccessPolicyBuilderTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Consistent Badge Styling Helper
function getRoleBadgeStyle(role: RoleName): string {
  switch (role) {
    case "Owner":
      return "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300";
    case "Admin":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
    case "Pharmacist":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "Cashier":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "Store Keeper":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
    case "Inventory Manager":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/* =====================================================================
   USERS TAB (100% Dynamic - Zero Dummy Records)
   ===================================================================== */

function UsersTab() {
  const profiles = useDb((d) => d.profiles);
  const permissions = useDb((d) => d.permissions);
  const { user } = useAuth();
  const has = usePermission();

  // Search, filter, and sort state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "created" | "role">("name");

  // Wizard state
  const [inviteWizardOpen, setInviteWizardOpen] = useState(false);

  // User details & edit sheet states
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [editUserSheetOpen, setEditUserSheetOpen] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);

  // Metrics derived 100% dynamically from actual database state
  const stats = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter((p) => p.active).length;
    const inactive = profiles.filter((p) => !p.active).length;
    const rolesCount = new Set(profiles.map((p) => p.role)).size;
    return { total, active, inactive, rolesCount };
  }, [profiles]);

  // Reactive Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles
      .filter((p) => {
        if (roleFilter !== "all" && p.role !== roleFilter) return false;
        if (statusFilter === "active" && !p.active) return false;
        if (statusFilter === "inactive" && p.active) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "created") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "role") {
          return a.role.localeCompare(b.role);
        }
        return a.name.localeCompare(b.name);
      });
  }, [profiles, search, roleFilter, statusFilter, sortBy]);

  const toggleActive = (id: string, name: string) => {
    if (user?.id === id) {
      toast.error("You cannot suspend your own account");
      return;
    }
    db.set((d) => {
      const p = d.profiles.find((x) => x.id === id);
      if (p) p.active = !p.active;
    });
    const updated = profiles.find((x) => x.id === id);
    toast.success(`User ${name} ${updated?.active ? "activated" : "suspended"}`);
  };

  const openEditSheet = (p: Profile) => {
    setEditUser({ ...p });
    setEditUserSheetOpen(true);
  };

  const saveEditUser = () => {
    if (!editUser) return;
    db.set((d) => {
      const p = d.profiles.find((x) => x.id === editUser.id);
      if (p) {
        p.name = editUser.name;
        p.email = editUser.email;
        p.role = editUser.role;
        p.active = editUser.active;
      }
    });
    toast.success(`Updated details for ${editUser.name}`);
    setEditUserSheetOpen(false);
    setEditUser(null);
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortBy("name");
  };

  return (
    <div className="space-y-5">
      {/* 1. Real KPI Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total team members"
          value={stats.total}
          hint="Registered database profiles"
          icon={Users}
          tone="default"
        />
        <KpiCard
          label="Active users"
          value={stats.active}
          hint="Active system accounts"
          icon={UserCheck}
          tone="success"
        />
        <KpiCard
          label="Suspended / Inactive"
          value={stats.inactive}
          hint="Deactivated accounts"
          icon={UserX}
          tone={stats.inactive > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Active assigned roles"
          value={stats.rolesCount}
          hint={`Out of ${ALL_ROLES.length} system definitions`}
          icon={Shield}
          tone="info"
        />
      </div>

      {/* 2. Search & Filter Toolbar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-xs"
              placeholder="Search users by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 sm:w-36 text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 sm:w-32 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="h-8 sm:w-32 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="created">Sort by Date</SelectItem>
              <SelectItem value="role">Sort by Role</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Primary Action Button - Opens Centered Onboarding Wizard */}
        {has("users", "create") && (
          <Button
            size="sm"
            className="h-8 text-xs shrink-0"
            onClick={() => setInviteWizardOpen(true)}
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Invite user
          </Button>
        )}
      </div>

      {/* 3. Empty States & Users Table */}
      {profiles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members registered"
          description="There are no user profiles registered in your pharmacy workspace yet. Invite your first employee to assign security roles and manage system permissions."
          action={
            has("users", "create") ? (
              <Button size="sm" onClick={() => setInviteWizardOpen(true)}>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Invite first employee
              </Button>
            ) : undefined
          }
        />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match your criteria"
          description="Try adjusting your search query or clear active role and status filters."
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Created</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((p) => {
                  const isCurrent = user?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedUser(p)}
                      className="group cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      {/* Avatar & Name */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                              {getInitials(p.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 text-sm">
                            {p.name}
                            {isCurrent && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                        {p.email}
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${getRoleBadgeStyle(
                            p.role,
                          )}`}
                        >
                          {p.role}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-2.5">
                        {p.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            <X className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                        {format(new Date(p.createdAt), "MMM d, yyyy")}
                      </td>

                      {/* Dropdown Menu Actions */}
                      <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 text-xs">
                            <DropdownMenuItem onClick={() => setSelectedUser(p)}>
                              <Eye className="mr-2 h-3.5 w-3.5" /> View Profile
                            </DropdownMenuItem>

                            {has("users", "update") && (
                              <DropdownMenuItem onClick={() => openEditSheet(p)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Details
                              </DropdownMenuItem>
                            )}

                            {has("users", "update") && !isCurrent && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => toggleActive(p.id, p.name)}
                                  className={p.active ? "text-destructive" : "text-emerald-600"}
                                >
                                  {p.active ? (
                                    <>
                                      <PowerOff className="mr-2 h-3.5 w-3.5" /> Suspend
                                    </>
                                  ) : (
                                    <>
                                      <Power className="mr-2 h-3.5 w-3.5" /> Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Centered Employee Onboarding Wizard Modal */}
      <InviteUserWizard
        isOpen={inviteWizardOpen}
        onClose={() => setInviteWizardOpen(false)}
      />

      {/* Edit User Sheet */}
      <Sheet open={editUserSheetOpen} onOpenChange={setEditUserSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit user profile</SheetTitle>
            <SheetDescription>Update profile details, role assignment, or account status.</SheetDescription>
          </SheetHeader>
          {editUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sheet-edit-name">Full name</Label>
                <Input
                  id="sheet-edit-name"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheet-edit-email">Email address</Label>
                <Input
                  id="sheet-edit-email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned role</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(v) => setEditUser({ ...editUser, role: v as RoleName })}
                  disabled={editUser.role === "Owner" && user?.id !== editUser.id}
                >
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

              {/* Status Button */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Account status</Label>
                  <p className="text-[11px] text-muted-foreground">
                    {editUser.active ? "User can sign in and operate" : "User is suspended from signing in"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={editUser.active ? "outline" : "secondary"}
                  size="sm"
                  disabled={user?.id === editUser.id}
                  onClick={() => setEditUser({ ...editUser, active: !editUser.active })}
                  className="h-7 text-xs"
                >
                  {editUser.active ? "Active" : "Suspended"}
                </Button>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditUserSheetOpen(false);
                    setEditUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={saveEditUser}>
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* =====================================================================
   ROLES TAB (Factual Metrics, Human-Readable Summaries, Direct Policy Modal)
   ===================================================================== */

function RolesTab() {
  const [selectedRoleModal, setSelectedRoleModal] = useState<RoleName | null>(null);

  return (
    <div className="space-y-5">
      {/* Overview Banner */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Security Policy Definitions
          </h3>
          <p className="text-xs text-muted-foreground">
            Click any role card to launch the Access Policy Builder and Live Access Preview.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono font-medium text-primary">
            {ALL_ROLES.length} Enterprise Roles
          </span>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_ROLES.map((roleName) => (
          <RoleCard
            key={roleName}
            roleName={roleName}
            onConfigure={(role) => setSelectedRoleModal(role)}
          />
        ))}
      </div>

      {/* Role Details & Access Policy Modal */}
      <RoleDetailModal
        roleName={selectedRoleModal}
        isOpen={!!selectedRoleModal}
        onClose={() => setSelectedRoleModal(null)}
      />
    </div>
  );
}

/* =====================================================================
   ACCESS POLICY BUILDER TAB (Split-Panel Layout)
   ===================================================================== */

function AccessPolicyBuilderTab() {
  return <AccessPolicyBuilder />;
}
