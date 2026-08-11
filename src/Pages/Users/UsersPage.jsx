import { useState, useMemo } from "react";
import {
  ArrowUpDown,
  Building2,
  CalendarDays,
  Eye,
  Filter,
  LayoutGrid,
  List,
  Mail,
  MoreVertical,
  Pause,
  Pencil,
  Phone,
  Play,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ALL_ROLES } from "@/lib/permissions";
import { PageHeader } from "@/Components/shared/PageHeader";
import { EmptyState } from "@/Components/shared/EmptyState";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { StaffAccessPanel } from "./components/StaffAccessPanel";
import { RolesPanel } from "./components/RolesPanel";
import { StaffStatusBadge, resolveStatus } from "./components/StaffStatusBadge";
import { ChangeRoleDialog } from "./components/ChangeRoleDialog";
import { StaffProfileDialog } from "./components/StaffProfileDialog";
import { EditStaffDialog } from "./components/EditStaffDialog";
import { openInviteStaff } from "@/Components/shared/InviteStaffDrawer";
export const handle = { title: "Users & Roles · PharmaHub" };
// ─── Helpers ──────────────────────────────────────────────────────────────────
// Role label is displayed as plain text — no pill
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
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
        description="Manage your team, invite staff, and control what each member can access."
        actions={
          has("users", "create") ? (
            <Button
              size="sm"
              className="h-9 px-4 gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-xs"
              onClick={openInviteStaff}
            >
              <UserPlus className="h-4 w-4" />
              Invite Staff
            </Button>
          ) : null
        }
      />
      <Tabs defaultValue="users">
        <TabsList className="h-10 rounded-lg border border-border bg-muted/40 p-1">
          <TabsTrigger
            value="users"
            className="rounded-md px-5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="rounded-md px-5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Shield className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger
            value="policy"
            className="rounded-md px-5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <UserCog className="mr-2 h-4 w-4" />
            Staff Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-6">
          <RolesPanel />
        </TabsContent>
        <TabsContent value="policy" className="mt-6">
          <StaffAccessPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
// ─── TAB 1: USERS ─────────────────────────────────────────────────────────────
function UsersTab() {
  const profiles = useDb((d) => d.profiles);
  const { user } = useAuth();
  const has = usePermission();
  const canUpdate = has("users", "update");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [profileView, setProfileView] = useState(null);
  const [profileEdit, setProfileEdit] = useState(null);
  const [roleChange, setRoleChange] = useState(null);
  const [viewMode, setViewMode] = useState("list");

  const setStatus = (id, status, active, message) => {
    if (user?.id === id) {
      toast.error("You can't change your own status.");
      return;
    }
    db.set((d) => {
      const p = d.profiles.find((x) => x.id === id);
      if (p) {
        p.status = status;
        p.active = active;
      }
    });
    toast.success(message);
  };

  const suspendStaff = (p) => setStatus(p.id, "suspended", false, `${p.name} has been suspended.`);
  const activateStaff = (p) => setStatus(p.id, "active", true, `${p.name} has been activated.`);
  const markInactive = (p) =>
    setStatus(p.id, "inactive", false, `${p.name} has been marked inactive.`);
  const resendInvite = (p) => toast.success(`Invitation resent to ${p.email}.`);

  const changeRole = (id, payload) => {
    db.set((d) => {
      const p = d.profiles.find((x) => x.id === id);
      if (p) {
        p.role = payload.role;
        p.accessIds = payload.accessIds ?? [];
      }
    });
    toast.success("Role and access updated.");
  };

  const filtered = useMemo(() => {
    let list = [...profiles];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q),
      );
    }
    if (filterRole !== "all") list = list.filter((p) => p.role === filterRole);
    if (filterStatus !== "all") list = list.filter((p) => resolveStatus(p) === filterStatus);
    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "role") return a.role.localeCompare(b.role);
      if (sortBy === "date") return b.createdAt.localeCompare(a.createdAt);
      return 0;
    });
    return list;
  }, [profiles, search, filterRole, filterStatus, sortBy]);

  const totalActive = profiles.filter((p) => resolveStatus(p) === "active").length;
  const totalPending = profiles.filter((p) => resolveStatus(p) === "pending").length;
  const totalDisabled = profiles.filter(
    (p) => resolveStatus(p) === "inactive" || resolveStatus(p) === "suspended",
  ).length;
  const rolesInUse = new Set(profiles.map((p) => p.role)).size;

  const metrics = [
    {
      label: "Total Staff",
      value: profiles.length,
      sub: totalPending > 0 ? `${totalPending} pending` : "All staff",
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Active",
      value: totalActive,
      sub: "Working accounts",
      icon: UserCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Inactive / Suspended",
      value: totalDisabled,
      sub: "Disabled accounts",
      icon: UserX,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
    },
    {
      label: "Roles in Use",
      value: rolesInUse,
      sub: `of ${ALL_ROLES.length} available`,
      icon: ShieldCheck,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending Invitation" },
    { value: "suspended", label: "Suspended" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <div className="space-y-6">
      {/* Metric strip */}
      <div className="flex flex-wrap rounded-xl border border-border bg-white shadow-sm">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`flex min-w-[160px] flex-1 items-center gap-3 px-5 py-3 ${
              i > 0 ? "border-l border-border" : ""
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.iconBg}`}
            >
              <m.icon className={`h-4 w-4 ${m.iconColor}`} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">{m.label}</p>
              <p className="text-xl font-bold leading-tight text-foreground">{m.value}</p>
              <p className="text-[11px] text-muted-foreground">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search staff by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-white"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="h-9 w-40 bg-white">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Role" />
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
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-44 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-40 bg-white">
              <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="role">Sort by Role</SelectItem>
              <SelectItem value="date">Sort by Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center rounded-lg border border-border bg-white p-0.5 shadow-2xs">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("grid")}
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Staff View: Table or Grid */}
      {viewMode === "grid" ? (
        filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-white p-12 text-center text-sm text-muted-foreground shadow-sm">
            No staff match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const status = resolveStatus(p);
              const isSelf = user?.id === p.id;
              const isOwner = p.role === "Owner";
              const canChangeRole = canUpdate && (isSelf ? user?.role === "Owner" : !isOwner);
              const canManageStatus = canUpdate && !isSelf;
              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/40"
                >
                  <div className="space-y-4">
                    {/* Header: Avatar + Info + Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-sm font-bold text-primary shadow-2xs">
                          {getInitials(p.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                            {p.name}
                            {isSelf && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                You
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {p.designation || p.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <StaffStatusBadge status={status} className="text-[10px]" />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted rounded-lg"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 rounded-xl">
                            <DropdownMenuItem onClick={() => setProfileView(p)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => setProfileEdit(p)} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Staff
                              </DropdownMenuItem>
                            )}
                            {canChangeRole && (
                              <DropdownMenuItem onClick={() => setRoleChange(p)} className="cursor-pointer">
                                <Shield className="mr-2 h-4 w-4" />
                                Change Role
                              </DropdownMenuItem>
                            )}
                            {status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                {canManageStatus && (
                                  <DropdownMenuItem onClick={() => resendInvite(p)} className="cursor-pointer">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Resend Invitation
                                  </DropdownMenuItem>
                                )}
                                {canManageStatus && (
                                  <DropdownMenuItem
                                    className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                                    onClick={() => activateStaff(p)}
                                  >
                                    <Play className="mr-2 h-4 w-4" />
                                    Activate Staff
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {status === "active" && canManageStatus && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => markInactive(p)} className="cursor-pointer">
                                  <UserX className="mr-2 h-4 w-4" />
                                  Mark Inactive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                  onClick={() => suspendStaff(p)}
                                >
                                  <Pause className="mr-2 h-4 w-4" />
                                  Suspend Staff
                                </DropdownMenuItem>
                              </>
                            )}
                            {(status === "suspended" || status === "inactive") && canManageStatus && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                                  onClick={() => activateStaff(p)}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Activate Staff
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Meta Details */}
                    <div className="space-y-2 text-xs border-t border-border/60 pt-3">
                      <div className="flex items-center gap-2 text-muted-foreground truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{p.email}</span>
                      </div>
                      {p.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{p.phone}</span>
                        </div>
                      )}
                      {p.department && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{p.department}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>Joined {formatDate(p.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Role Label */}
                  <div className="mt-4 border-t border-border/50 pt-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Role
                    </span>
                    <span className="text-xs font-medium text-foreground/80">
                      {p.role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Table List View */
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Staff Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No staff match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const status = resolveStatus(p);
                  const isSelf = user?.id === p.id;
                  const isOwner = p.role === "Owner";
                  const canChangeRole = canUpdate && (isSelf ? user?.role === "Owner" : !isOwner);
                  const canManageStatus = canUpdate && !isSelf;
                  return (
                    <tr key={p.id} className="group hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {getInitials(p.name)}
                          </div>
                          <div>
                            <p className="font-medium leading-tight">
                              {p.name}
                              {isSelf && (
                                <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                  You
                                </span>
                              )}
                            </p>
                            {p.designation && (
                              <p className="text-[11px] text-muted-foreground">{p.designation}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-foreground/80">
                          {p.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StaffStatusBadge status={status} className="text-[11px]" />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => setProfileView(p)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => setProfileEdit(p)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Staff
                              </DropdownMenuItem>
                            )}
                            {canChangeRole && (
                              <DropdownMenuItem onClick={() => setRoleChange(p)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Change Role
                              </DropdownMenuItem>
                            )}
                            {status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                {canManageStatus && (
                                  <DropdownMenuItem onClick={() => resendInvite(p)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Resend Invitation
                                  </DropdownMenuItem>
                                )}
                                {canManageStatus && (
                                  <DropdownMenuItem
                                    className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-500/10"
                                    onClick={() => activateStaff(p)}
                                  >
                                    <Play className="mr-2 h-4 w-4" />
                                    Activate Staff
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {status === "active" && canManageStatus && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => markInactive(p)}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Mark Inactive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={() => suspendStaff(p)}
                                >
                                  <Pause className="mr-2 h-4 w-4" />
                                  Suspend Staff
                                </DropdownMenuItem>
                              </>
                            )}
                            {(status === "suspended" || status === "inactive") && canManageStatus && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-500/10"
                                  onClick={() => activateStaff(p)}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Activate Staff
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="border-t border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
              Showing {filtered.length} of {profiles.length} staff
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <StaffProfileDialog
        profile={profileView}
        open={!!profileView}
        onOpenChange={() => setProfileView(null)}
      />
      <EditStaffDialog
        profile={profileEdit}
        open={!!profileEdit}
        onOpenChange={() => setProfileEdit(null)}
      />
      <ChangeRoleDialog
        open={!!roleChange}
        onOpenChange={() => setRoleChange(null)}
        profile={roleChange}
        onSave={(payload) => changeRole(roleChange.id, payload)}
      />
    </div>
  );
}
