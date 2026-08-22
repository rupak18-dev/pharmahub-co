import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Button } from "@/Components/ui/button";
import { Users, LayoutGrid, Sliders } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { categoryLabel } from "@/lib/roleCatalog";
import { resolvePermissionCount } from "@/lib/rolesService";
import { AccessPolicyBuilder } from "./AccessPolicyBuilder";
import { AccessPreview } from "./AccessPreview";
import { StaffStatusBadge, resolveStatus } from "./StaffStatusBadge";
import dayjs from "dayjs";
import { format } from "date-fns";

function getInitials(name) {
  const parts = (name ?? "U").trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name ?? "U").slice(0, 2).toUpperCase();
}

function MetaItem({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function RoleDetailModal({ role, open, onClose, onSaved }) {
  // Assigned users come from the same persisted backend members list rendered
  // by the Users and Staff Access tabs — never from the local database.
  const { members } = useTeamMembers();
  const [activeTab, setActiveTab] = useState("builder");
  // Live permission matrix for this role, persisted to the backend Role
  // collection by the Policy Builder on every change.
  const [matrix, setMatrix] = useState(role?.permissions ?? {});
  useEffect(() => {
    setMatrix(role?.permissions ?? {});
  }, [role?.roleId, role?.permissions]);
  const assignedUsers = useMemo(
    () => members.filter((p) => !p.invitationId && !p.isDemo && p.role === role?.name),
    [members, role],
  );
  if (!role) return null;
  const Icon = role.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border ${role.tileBg}`}
              >
                <Icon className={`h-6 w-6 ${role.iconColor}`} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  {role.name}
                </DialogTitle>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {role.description}
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {role.type === "system" ? "System Role" : "Custom Role"}
            </span>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-2 px-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetaItem
              label="Role Type"
              value={role.type === "system" ? "System Role" : "Custom Role"}
            />
            <MetaItem label="Category" value={categoryLabel(role.category)} />
            <MetaItem label="Assigned Staff" value={assignedUsers.length} />
            <MetaItem
              label="Permissions"
              value={
                resolvePermissionCount(matrix) != null
                  ? `${resolvePermissionCount(matrix)} configured`
                  : "Permissions not configured"
              }
            />
            <MetaItem label="Created" value="Not available" />
            <MetaItem label="Last Updated" value="Not available" />
          </div>

          <div className="border-t border-border px-6 pt-4 pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="builder" className="text-xs gap-1.5">
                  <Sliders className="h-3.5 w-3.5" /> Policy Builder
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs gap-1.5">
                  <LayoutGrid className="h-3.5 w-3.5" /> Live Access Preview
                </TabsTrigger>
                <TabsTrigger value="users" className="text-xs gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Assigned Users ({assignedUsers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="pt-1">
                <AccessPolicyBuilder
                  key={role.roleId ?? role.name}
                  role={role}
                  matrix={matrix}
                  onMatrixChange={setMatrix}
                  onSaved={onSaved}
                />
              </TabsContent>

              <TabsContent value="preview" className="pt-1">
                <AccessPreview roleName={role.name} permissions={matrix} />
              </TabsContent>

              <TabsContent value="users" className="pt-1">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  {assignedUsers.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">No staff assigned</p>
                      <p className="mt-1 text-xs">
                        No team members are currently configured with the {role.name} role.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                      {assignedUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-3 text-xs hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-foreground">{u.name}</div>
                              <div className="font-mono text-muted-foreground text-[11px]">
                                {u.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span className="font-mono text-[11px]">
                              {u.createdAt && dayjs(u.createdAt).isValid()
                                ? `Joined ${dayjs(u.createdAt).format("DD MMM YYYY")}`
                              {u.createdAt
                                ? `Joined ${format(new Date(u.createdAt), "MMM d, yyyy")}`
                                : ""}
                            </span>
                            <StaffStatusBadge status={resolveStatus(u)} className="text-[11px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-border px-6 py-4">
          <Button size="sm" onClick={onClose}>
            Done & Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
