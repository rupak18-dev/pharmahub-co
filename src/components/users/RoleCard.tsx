import { useMemo } from "react";
import {
  Shield,
  KeyRound,
  ShieldCheck,
  Pill,
  Receipt,
  Boxes,
  Layers,
  UserCheck,
  Boxes as ModulesIcon,
  ChevronRight,
  Copy,
  Sliders,
} from "lucide-react";
import type { ModuleKey, PermissionAction, RoleName } from "@/lib/types";
import { ALL_ACTIONS, ALL_MODULES } from "@/lib/permissions";
import { useDb } from "@/hooks/useDb";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db } from "@/lib/db";

interface RoleCardProps {
  roleName: RoleName;
  onConfigure: (role: RoleName) => void;
  onClone?: (sourceRole: RoleName) => void;
}

export function getRoleIcon(role: RoleName) {
  switch (role) {
    case "Owner":
      return KeyRound;
    case "Admin":
      return ShieldCheck;
    case "Pharmacist":
      return Pill;
    case "Cashier":
      return Receipt;
    case "Store Keeper":
      return Boxes;
    case "Inventory Manager":
      return Layers;
    default:
      return Shield;
  }
}

export function getRoleDescription(role: RoleName): string {
  switch (role) {
    case "Owner":
      return "Unrestricted system access across operational, financial, and security modules.";
    case "Admin":
      return "Administrative control over inventory master data, user accounts, and settings.";
    case "Pharmacist":
      return "Clinical medicine verification, batch lifecycle tracking, and sales billing.";
    case "Cashier":
      return "Point-of-sale customer billing, invoice printing, and payment collection.";
    case "Store Keeper":
      return "Physical stock receipt, GRN creation, stock adjustments, and inventory audits.";
    case "Inventory Manager":
      return "Full inventory valuation, supplier orders, GRN approvals, and dead stock management.";
    default:
      return "Custom access policy defined by organizational requirements.";
  }
}

export function RoleCard({ roleName, onConfigure, onClone }: RoleCardProps) {
  const profiles = useDb((d) => d.profiles);
  const permissions = useDb((d) => d.permissions);

  const RoleIcon = getRoleIcon(roleName);
  const description = getRoleDescription(roleName);

  // Compute live factual data directly from DB
  const assignedUsersCount = useMemo(() => {
    return profiles.filter((p) => p.role === roleName).length;
  }, [profiles, roleName]);

  // Compute human-readable accessible modules summary
  const moduleSummary = useMemo(() => {
    const rolePerms = permissions[roleName] || {};
    const viewable = ALL_MODULES.filter((m) => rolePerms[m.key]?.view === true);
    if (viewable.length === 0) return "No accessible modules";
    if (viewable.length === ALL_MODULES.length) return "All 13 system modules accessible";

    const topNames = viewable.slice(0, 3).map((m) => m.label);
    const remaining = viewable.length - 3;

    if (remaining > 0) {
      return `${topNames.join(", ")} & ${remaining} more`;
    }
    return topNames.join(", ");
  }, [permissions, roleName]);

  // Total active action permissions
  const totalActionsCount = useMemo(() => {
    const rolePerms = permissions[roleName] || {};
    let count = 0;
    ALL_MODULES.forEach((m) => {
      ALL_ACTIONS.forEach((a) => {
        if (rolePerms[m.key]?.[a]) count++;
      });
    });
    return count;
  }, [permissions, roleName]);

  const handleClonePolicy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClone) {
      onClone(roleName);
    } else {
      toast.info(`Cloned policy template from ${roleName}`);
    }
  };

  return (
    <div
      onClick={() => onConfigure(roleName)}
      className="group relative rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
    >
      {/* Top Header & Role Icon */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/50 group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors">
              <RoleIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors tracking-tight">
                {roleName}
              </h4>
              <span className="text-[11px] font-mono text-muted-foreground">
                {totalActionsCount} active permissions
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            title="Clone Role Policy"
            onClick={handleClonePolicy}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Dynamic Factual Metrics */}
      <div className="space-y-2 border-t border-border/60 pt-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-primary" /> Assigned Users
          </span>
          <span className="font-semibold text-foreground font-mono">
            {assignedUsersCount} active
          </span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
            <ModulesIcon className="h-3.5 w-3.5 text-primary" /> Scope:
          </span>
          <span className="font-medium text-foreground text-right truncate text-[11px]">
            {moduleSummary}
          </span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-xs">
        <span className="inline-flex items-center gap-1 font-medium text-xs text-primary group-hover:underline">
          <Sliders className="h-3.5 w-3.5" /> Configure Access Policy
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
      </div>
    </div>
  );
}
