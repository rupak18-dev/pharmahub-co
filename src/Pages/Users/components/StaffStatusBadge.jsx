import { Badge } from "@/Components/ui/badge";

/* Semantic staff status model. `status` is an optional field written only
   by the invite flow and row actions; otherwise it is derived from the
   existing `active` boolean to stay compatible with the rest of the app. */
export const STAFF_STATUS = {
  active: {
    label: "Active",
    variant: "secondary",
    className: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-medium",
    dot: "bg-emerald-500",
  },
  inactive: {
    label: "Inactive",
    variant: "secondary",
    className: "bg-muted text-muted-foreground border border-border font-medium",
    dot: "bg-muted-foreground",
  },
  suspended: {
    label: "Suspended",
    variant: "secondary",
    className: "bg-destructive/10 text-destructive border border-destructive/20 font-medium",
    dot: "bg-destructive",
  },
  pending: {
    label: "Pending",
    variant: "secondary",
    className: "bg-amber-50 text-amber-600 border border-amber-200/80 font-medium text-[10px] py-0",
    dot: "bg-amber-400",
  },
};

export function resolveStatus(profile) {
  if (profile?.status) return profile.status;
  return profile?.active ? "active" : "suspended";
}

export function StaffStatusBadge({ status, className }) {
  const meta = STAFF_STATUS[status] ?? STAFF_STATUS.inactive;
  return (
    <Badge
      variant={meta.variant}
      className={`gap-1.5 rounded-full px-2.5 py-0.5 ${meta.className ?? ""} ${className ?? ""}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </Badge>
  );
}
