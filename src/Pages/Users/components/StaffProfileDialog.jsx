import { Eye } from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { getRoleMeta } from "./staffRoles";
import { StaffStatusBadge, resolveStatus } from "./StaffStatusBadge";

function getInitials(name) {
  return (name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

export function StaffProfileDialog({ profile, open, onOpenChange }) {
  if (!profile) return null;
  const meta = getRoleMeta(profile.role);
  const RoleIcon = meta.icon;
  const status = resolveStatus(profile);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" /> Staff Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {getInitials(profile.name)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{profile.name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Role" value={profile.role} />
            <Detail label="Status" value="" />
            <Detail label="Phone" value={profile.phone} />
            <Detail label="Department" value={profile.department} />
            <Detail label="Designation" value={profile.designation} />
            <Detail label="Joined" value={formatDate(profile.createdAt)} />
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-semibold text-foreground">
              <RoleIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {profile.role}
            </span>
            <StaffStatusBadge status={status} className="text-[11px]" />
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
