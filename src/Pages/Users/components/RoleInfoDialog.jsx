import { useMemo } from "react";
import { Users } from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { useDb } from "@/hooks/useDb";
import { categoryLabel, getRoleByName } from "@/lib/roleCatalog";
import { getRoleMeta } from "./staffRoles";

export function RoleInfoDialog({ roleName, open, onOpenChange }) {
  const profiles = useDb((d) => d.profiles);
  const role = getRoleByName(roleName);
  const meta = getRoleMeta(roleName);
  const Icon = meta.icon;
  const assignedCount = useMemo(
    () => (roleName ? profiles.filter((p) => !p.isDemo && p.role === roleName).length : 0),
    [profiles, roleName],
  );
  if (!roleName) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${meta.bg}`}
            >
              <Icon className={`h-5 w-5 ${meta.color}`} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base">{role.name}</DialogTitle>
              <DialogDescription>{categoryLabel(role.category)}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{role.description}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Main access
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {meta.modules.length === 0 ? (
                <span className="text-xs text-muted-foreground">No module access defined.</span>
              ) : (
                meta.modules.map((m) => (
                  <span
                    key={m}
                    className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-foreground"
                  >
                    {m}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              <strong className="font-semibold text-foreground">{assignedCount}</strong> assigned
              staff
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" className="h-9 text-xs" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
