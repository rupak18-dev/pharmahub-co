import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Sliders, LayoutGrid, Check, X, ShieldCheck, Mail, Calendar } from "lucide-react";
import type { RoleName } from "@/lib/types";
import { useDb } from "@/hooks/useDb";
import { getRoleDescription, getRoleIcon } from "./RoleCard";
import { AccessPolicyBuilder } from "./AccessPolicyBuilder";
import { AccessPreview } from "./AccessPreview";
import { format } from "date-fns";

interface RoleDetailModalProps {
  roleName: RoleName | null;
  isOpen: boolean;
  onClose: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function RoleDetailModal({ roleName, isOpen, onClose }: RoleDetailModalProps) {
  const profiles = useDb((d) => d.profiles);
  const permissions = useDb((d) => d.permissions);
  const [activeTab, setActiveTab] = useState("editor");

  const assignedUsers = useMemo(() => {
    if (!roleName) return [];
    return profiles.filter((p) => p.role === roleName);
  }, [profiles, roleName]);

  if (!roleName) return null;

  const RoleIcon = getRoleIcon(roleName);
  const description = getRoleDescription(roleName);
  const rolePerms = permissions[roleName] || {};

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-primary/10 text-primary">
                <RoleIcon className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  {roleName} Security Policy
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="font-mono text-xs py-1">
                {assignedUsers.length} Assigned Users
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Tabbed Panels */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor" className="text-xs gap-1.5">
              <Sliders className="h-3.5 w-3.5" /> Policy Builder
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" /> Live Access Preview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs gap-1.5">
              <Users className="h-3.5 w-3.5" /> Assigned Users ({assignedUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Policy Builder */}
          <TabsContent value="editor" className="space-y-4 pt-1">
            <AccessPolicyBuilder
              initialRole={roleName}
              hideRoleSelector={true}
            />
          </TabsContent>

          {/* TAB 2: Live Access Preview */}
          <TabsContent value="preview" className="pt-1">
            <AccessPreview roleName={roleName} permissions={rolePerms} />
          </TabsContent>

          {/* TAB 3: Assigned Users List */}
          <TabsContent value="users" className="space-y-3 pt-1">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5 text-xs">
                <h4 className="font-semibold text-foreground">
                  Team Members with {roleName} Role
                </h4>
                <span className="text-muted-foreground font-mono">
                  Total: {assignedUsers.length}
                </span>
              </div>

              {assignedUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">No users assigned yet</p>
                  <p>No team members are currently configured with the {roleName} role.</p>
                </div>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
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
                          Joined {format(new Date(u.createdAt), "MMM d, yyyy")}
                        </span>
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <X className="h-3 w-3" /> Suspended
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t border-border mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done & Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
