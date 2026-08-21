import { useMemo, useState } from "react";
import { Plus, Search, ShieldAlert } from "lucide-react";
import { ROLE_CATEGORIES, categoryLabel } from "@/lib/roleCatalog";
import { useRoles } from "@/hooks/useRoles";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { usePermission } from "@/hooks/usePermission";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { EmptyState } from "@/Components/shared/EmptyState";
import { RoleCard } from "./RoleCard";
import { RoleDetailModal } from "./RoleDetailModal";
import { CreateCustomRoleDialog } from "./CreateCustomRoleDialog";

function RoleCardSkeleton() {
  return (
    <div className="flex h-full min-h-[220px] flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted/70" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-muted/70" />
      </div>
      <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
        <div className="h-3 w-full animate-pulse rounded bg-muted/70" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted/70" />
      </div>
      <div className="mt-auto pt-4">
        <div className="h-8 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function RolesPanel() {
  const { status, error, roles: backendRoles, refresh } = useRoles();
  // Assigned staff per role come from the same persisted backend members list
  // rendered by the Users and Staff Access tabs.
  const { members } = useTeamMembers();
  const has = usePermission();
  const canCreate = has("users", "update");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRole, setSelectedRole] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const roles = useMemo(
    () =>
      backendRoles.map((r) => ({
        ...r,
        assignedUsers: members.filter((m) => !m.invitationId && !m.isDemo && m.role === r.name),
      })),
    [backendRoles, members],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roles.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (q) {
        const haystack = `${r.name} ${r.description} ${categoryLabel(r.category)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [roles, search, categoryFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Role Definitions</h3>
          <p className="text-xs text-muted-foreground">
            System roles that control staff access across PharmaHub modules.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search roles by name, description, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 bg-white"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-48 bg-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {ROLE_CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-40 bg-white">
              <SelectValue placeholder="Role Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="system">System Role</SelectItem>
              <SelectItem value="custom">Custom Role</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canCreate && (
          <Button size="sm" className="h-9 shrink-0 gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Custom Role
          </Button>
        )}
      </div>

      {status === "loading" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Loading roles...</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <RoleCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {status === "error" && (
        <EmptyState
          icon={ShieldAlert}
          title="Unable to load roles"
          description="Please try again."
          action={
            <Button size="sm" onClick={refresh}>
              Retry
            </Button>
          }
        />
      )}

      {status === "loaded" && roles.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title="No roles available"
          description="Create or configure roles to manage staff access."
        />
      )}

      {status === "loaded" && roles.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={Search}
          title="No roles match your search"
          description="Try adjusting your search or filters."
        />
      )}

      {status === "loaded" && filtered.length > 0 && (
        <div className="space-y-8">
          {ROLE_CATEGORIES.map((cat) => {
            const items = filtered.filter((r) => r.category === cat.key);
            if (items.length === 0) return null;
            return (
              <section key={cat.key}>
                <div className="mb-3 flex items-baseline gap-2">
                  <h4 className="text-sm font-semibold text-foreground">{cat.label}</h4>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((role) => (
                    <RoleCard
                      key={role.roleId}
                      role={role}
                      onConfigure={() => setSelectedRole(role)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <RoleDetailModal
        role={selectedRole}
        open={!!selectedRole}
        onClose={() => setSelectedRole(null)}
        onSaved={refresh}
      />
      <CreateCustomRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
