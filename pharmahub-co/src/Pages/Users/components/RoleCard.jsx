import { ChevronRight, Settings, ShieldCheck } from "lucide-react";

export function RoleCard({ role, onConfigure }) {
  const Icon = role.icon;
  const visibleModules = role.modules.slice(0, 4);
  const moreModules = role.modules.length - visibleModules.length;
  const staffCount = role.assignedUsers.length;
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${role.tileBg} transition-transform group-hover:scale-105`}
        >
          <Icon className={`h-5 w-5 ${role.iconColor}`} />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          {role.type === "system" ? "System" : "Custom"}
        </span>
      </div>

      <div className="mt-3 flex-1">
        <h4 className="font-semibold text-foreground">{role.name}</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {role.description}
        </p>
      </div>

      <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs">
        <div className="flex items-start justify-between gap-2">
          <span className="shrink-0 text-muted-foreground">Module access</span>
          {role.modules.length === 0 ? (
            <span className="text-right text-muted-foreground">No module access</span>
          ) : (
            <span className="text-right font-medium text-foreground">
              {visibleModules.map((m) => m.label).join(" · ")}
              {moreModules > 0 ? ` +${moreModules} more` : ""}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Assigned staff</span>
          <span className="font-medium text-foreground">
            {staffCount > 0 ? `${staffCount} staff` : "No staff assigned"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Permissions</span>
          <span className="font-medium text-foreground">
            {role.permissionCount != null
              ? `${role.permissionCount} configured`
              : "Permissions not configured"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onConfigure}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Settings className="h-3.5 w-3.5" />
        Configure Access Policy
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
