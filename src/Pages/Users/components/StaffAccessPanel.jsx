import { useMemo, useState } from "react";
import {
  Eye,
  Filter,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ALL_ROLES } from "@/lib/permissions";
import { categoryLabel, getRoleByName } from "@/lib/roleCatalog";
import { EmptyState } from "@/Components/shared/EmptyState";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { buildStaffAccess, getRoleMeta } from "./staffRoles";
import { StaffStatusBadge } from "./StaffStatusBadge";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { RoleInfoDialog } from "./RoleInfoDialog";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending Invitation" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" },
];

function getInitials(name) {
  return (name ?? "U")
    .trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hasValidRole(roleName) {
  return Boolean(roleName) && ALL_ROLES.includes(roleName);
}

function RoleChip({ roleName }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-xs font-medium text-foreground/80">
      {roleName}
    </span>
  );
}

function StaffRowSkeleton() {
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-40 animate-pulse rounded bg-muted/70" />
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <div className="h-2.5 w-44 animate-pulse rounded bg-muted/70" />
      </td>
      <td className="px-4 py-3">
        <div className="h-2.5 w-24 animate-pulse rounded bg-muted/70" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="ml-auto h-7 w-24 animate-pulse rounded-md bg-muted" />
      </td>
    </tr>
  );
}

export function StaffAccessPanel() {
  const { status, error, profiles, refresh } = useRoles();
  const { user } = useAuth();
  const has = usePermission();
  const canUpdate = has("users", "update");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [roleChange, setRoleChange] = useState(null);
  const [roleInfo, setRoleInfo] = useState(null);

  const staff = useMemo(() => buildStaffAccess(profiles), [profiles]);

  const filtered = useMemo(() => {
    let list = staff;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => {
        const role = getRoleByName(s.roleName);
        const haystack = [
          s.name,
          s.email,
          s.department ?? "",
          s.designation ?? "",
          s.roleName ?? "",
          categoryLabel(role.category),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    if (filterRole !== "all") list = list.filter((s) => s.roleName === filterRole);
    if (filterStatus !== "all") list = list.filter((s) => s.status === filterStatus);
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [staff, search, filterRole, filterStatus]);

  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.status === "active").length;
  const rolesAssigned = new Set(staff.map((s) => s.roleName).filter(Boolean)).size;

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

  const summary = [
    { label: "Total Staff", value: totalStaff, icon: Users },
    { label: "Active Staff", value: activeStaff, icon: UserCheck },
    { label: "Roles Assigned", value: rolesAssigned, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Staff Access</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Assign roles and manage access for your pharmacy team.
        </p>
      </div>

      {status === "loading" && (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {["Staff Member", "Email", "Department", "Role", "Status", "Action"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                      h === "Email" ? "hidden lg:table-cell" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <StaffRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {status === "error" && (
        <EmptyState
          icon={ShieldAlert}
          title="Unable to load staff"
          description="Please try again."
          action={
            <Button size="sm" onClick={refresh}>
              Retry
            </Button>
          }
        />
      )}

      {status === "loaded" && staff.length === 0 && (
        <EmptyState
          icon={Users}
          title="No staff members yet"
          description="Add staff members to assign pharmacy roles and manage access."
        />
      )}

      {status === "loaded" && staff.length > 0 && (
        <>
          <div className="flex flex-wrap divide-x divide-border rounded-xl border border-border bg-white shadow-sm">
            {summary.map((m) => (
              <div key={m.label} className="flex min-w-[150px] flex-1 items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-bold leading-tight text-foreground">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap gap-2">
              <div className="relative min-w-[200px] max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 bg-white pl-9"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="h-9 w-40 bg-white">
                  <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
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
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-44 bg-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No staff members match your search"
              description="Try adjusting your search or filters."
            />
          ) : (
            <>
              {/* Desktop / tablet table */}
              <div className="hidden overflow-hidden rounded-xl border border-border bg-white shadow-sm md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Staff Member
                      </th>
                      <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((s) => {
                      const isSelf = user?.id === s.id;
                      const isOwner = s.roleName === "Owner";
                      const validRole = hasValidRole(s.roleName);
                      const role = getRoleByName(s.roleName);
                      const department =
                        s.department ?? (validRole ? categoryLabel(role.category) : "—");
                      const canChangeRole =
                        canUpdate && (isSelf ? user?.role === "Owner" : !isOwner);
                      return (
                        <tr key={s.id} className="group transition-colors hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {getInitials(s.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium leading-tight text-foreground">
                                  {s.name}
                                  {isSelf && (
                                    <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="truncate text-xs text-muted-foreground lg:hidden">
                                  {s.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                            {s.email}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{department}</td>
                          <td className="px-4 py-3">
                            {validRole ? (
                              <RoleChip roleName={s.roleName} />
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground">
                                No role assigned
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StaffStatusBadge status={s.status} className="text-[11px]" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {validRole && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => setRoleInfo(s.roleName)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View Role
                                </Button>
                              )}
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-semibold"
                                disabled={!canChangeRole}
                                title={
                                  canChangeRole
                                    ? undefined
                                    : isOwner
                                      ? "Owner access cannot be changed"
                                      : "You don't have permission to change roles"
                                }
                                onClick={() => setRoleChange(s.id)}
                              >
                                <UserCog className="h-3.5 w-3.5" />
                                {validRole ? "Change Role" : "Assign Role"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="border-t border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                  Showing {filtered.length} of {staff.length} staff
                </div>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filtered.map((s) => {
                  const isSelf = user?.id === s.id;
                  const isOwner = s.roleName === "Owner";
                  const validRole = hasValidRole(s.roleName);
                  const role = getRoleByName(s.roleName);
                  const department =
                    s.department ?? (validRole ? categoryLabel(role.category) : "—");
                  const canChangeRole = canUpdate && (isSelf ? user?.role === "Owner" : !isOwner);
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-border bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {getInitials(s.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium leading-tight text-foreground">
                              {s.name}
                              {isSelf && (
                                <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                        <StaffStatusBadge status={s.status} className="text-[10px]" />
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Role</span>
                          {validRole ? (
                            <RoleChip roleName={s.roleName} />
                          ) : (
                            <span className="font-medium text-muted-foreground">
                              No role assigned
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Department</span>
                          <span className="font-medium text-foreground">{department}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        {validRole && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 flex-1 gap-1 text-xs"
                            onClick={() => setRoleInfo(s.roleName)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Role
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="h-8 flex-1 gap-1.5 text-xs font-semibold"
                          disabled={!canChangeRole}
                          onClick={() => setRoleChange(s.id)}
                        >
                          <UserCog className="h-3.5 w-3.5" />
                          {validRole ? "Change Role" : "Assign Role"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <ChangeRoleDialog
        open={!!roleChange}
        onOpenChange={() => setRoleChange(null)}
        profile={roleChange ? profiles.find((p) => p.id === roleChange) : null}
        onSave={(payload) => changeRole(roleChange, payload)}
      />
      <RoleInfoDialog
        roleName={roleInfo}
        open={!!roleInfo}
        onOpenChange={() => setRoleInfo(null)}
      />
    </div>
  );
}
