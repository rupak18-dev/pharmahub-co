import { useMemo, useState } from "react";
import {
  Search,
  Check,
  ShieldCheck,
  Zap,
  RotateCcw,
  LayoutDashboard,
  Pill as PillIcon,
  Layers,
  Boxes,
  ShoppingCart,
  Receipt,
  CalendarClock,
  ClipboardCheck,
  Users,
  BarChart3,
  Bell,
  Sparkles,
  Settings,
  Lock,
} from "lucide-react";
import { db } from "@/lib/db";
import { useDb } from "@/hooks/useDb";
import { ALL_MODULES, ALL_ROLES } from "@/lib/permissions";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { toast } from "sonner";
const MODULE_ICONS = {
  dashboard: LayoutDashboard,
  medicines: PillIcon,
  batches: Layers,
  inventory: Boxes,
  purchases: ShoppingCart,
  sales: Receipt,
  expiry: CalendarClock,
  audit: ClipboardCheck,
  users: Users,
  reports: BarChart3,
  notifications: Bell,
  ai: Sparkles,
  admin: Settings,
};
const ACTION_GROUPS = [
  {
    groupName: "General Access",
    description: "Read & visibility permissions for this module",
    actions: [
      {
        key: "view",
        label: "View Data",
        description: "Allows accessing module screens and reading records",
      },
    ],
  },
  {
    groupName: "Management",
    description: "Create new records and modify existing data",
    actions: [
      {
        key: "create",
        label: "Create Records",
        description: "Permission to add new items, bills, or entries",
      },
      {
        key: "update",
        label: "Edit / Update",
        description: "Permission to modify existing record fields",
      },
    ],
  },
  {
    groupName: "Advanced Actions",
    description: "Critical actions, data export, and elevated approvals",
    actions: [
      {
        key: "approve",
        label: "Approve Workflow",
        description: "Authorize purchase orders, stock GRNs, or voids",
      },
      {
        key: "export",
        label: "Export Data",
        description: "Download CSV, Excel, or PDF data extracts",
      },
      {
        key: "delete",
        label: "Delete Records",
        description: "Permanent removal or archiving of records",
      },
    ],
  },
];
export function AccessPolicyBuilder({
  initialRole = "Pharmacist",
  onRoleChange,
  hideRoleSelector = false,
}) {
  const permissions = useDb((d) => d.permissions);
  const [activeRole, setActiveRole] = useState(initialRole);
  const [activeModuleKey, setActiveModuleKey] = useState("sales");
  const [moduleSearch, setModuleSearch] = useState("");
  const handleRoleSelect = (role) => {
    setActiveRole(role);
    if (onRoleChange) onRoleChange(role);
  };
  const isOwner = activeRole === "Owner";
  // Filter modules by search string
  const filteredModules = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return ALL_MODULES;
    return ALL_MODULES.filter(
      (m) => m.label.toLowerCase().includes(q) || m.key.toLowerCase().includes(q),
    );
  }, [moduleSearch]);
  const activeModule = ALL_MODULES.find((m) => m.key === activeModuleKey) || ALL_MODULES[0];
  // Helper to count active permissions for a module
  const getModuleActiveCount = (modKey) => {
    const modPerms = permissions[activeRole]?.[modKey];
    if (!modPerms) return 0;
    return Object.values(modPerms).filter(Boolean).length;
  };
  // Toggle a single permission action pill
  const togglePermission = (actionKey) => {
    if (isOwner) {
      toast.info("Owner policy is immutable and maintains full unrestricted access.");
      return;
    }
    db.set((d) => {
      const roleObj = d.permissions[activeRole];
      if (roleObj && roleObj[activeModuleKey]) {
        roleObj[activeModuleKey][actionKey] = !roleObj[activeModuleKey][actionKey];
      }
    });
  };
  // Bulk enable all permissions for active module
  const enableAllForModule = () => {
    if (isOwner) return;
    db.set((d) => {
      const mod = d.permissions[activeRole]?.[activeModuleKey];
      if (mod) {
        mod.view = true;
        mod.create = true;
        mod.update = true;
        mod.delete = true;
        mod.approve = true;
        mod.export = true;
      }
    });
    toast.success(`Enabled all actions for ${activeModule.label}`);
  };
  // Bulk clear permissions for active module
  const clearAllForModule = () => {
    if (isOwner) return;
    db.set((d) => {
      const mod = d.permissions[activeRole]?.[activeModuleKey];
      if (mod) {
        mod.view = false;
        mod.create = false;
        mod.update = false;
        mod.delete = false;
        mod.approve = false;
        mod.export = false;
      }
    });
    toast.success(`Cleared permissions for ${activeModule.label}`);
  };
  return (
    <div className="space-y-4">
      {/* Top Header & Role Selector */}
      {!hideRoleSelector && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Access Policy Builder
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure module access & action pills for system roles. Changes auto-save instantly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Editing Role:
            </span>
            <Select value={activeRole} onValueChange={(v) => handleRoleSelect(v)}>
              <SelectTrigger className="h-9 w-[180px] text-xs font-medium bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isOwner && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            The <strong>Owner</strong> role has system-level unrestricted privileges. Permissions
            are permanently enabled and cannot be revoked.
          </span>
        </div>
      )}

      {/* Main Split-Panel Editor */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* LEFT PANEL: Module Navigation (4 Columns) */}
        <div className="md:col-span-4 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          {/* Module Search Bar */}
          <div className="p-3 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-xs bg-background"
                placeholder="Search modules..."
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List of Modules */}
          <div className="p-2 space-y-1 max-h-[460px] overflow-y-auto">
            {filteredModules.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No modules found</div>
            ) : (
              filteredModules.map((mod) => {
                const Icon = MODULE_ICONS[mod.key] || Settings;
                const isSelected = mod.key === activeModuleKey;
                const activeCount = getModuleActiveCount(mod.key);
                const hasView = permissions[activeRole]?.[mod.key]?.view;
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => setActiveModuleKey(mod.key)}
                    className={`w-full flex items-center justify-between rounded-lg border-l-2 px-3 py-2 text-xs font-medium transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-transparent text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className="truncate">{mod.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {hasView ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold ${
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {activeCount}/6
                        </span>
                      ) : (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                            isSelected
                              ? "bg-primary/10 text-primary/70"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          Off
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Grouped Permissions Pills (8 Columns) */}
        <div className="md:col-span-8 rounded-xl border border-border bg-card p-4 shadow-sm space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              {(() => {
                const ActiveIcon = MODULE_ICONS[activeModule.key] || Settings;
                return (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/40">
                    <ActiveIcon className="h-4 w-4 text-primary" />
                  </div>
                );
              })()}
              <div>
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  {activeModule.label} Policy
                </h4>
                <p className="text-xs text-muted-foreground">
                  Configure granular action permissions for {activeRole} role.
                </p>
              </div>
            </div>

            {/* Bulk Action Buttons */}
            {!isOwner && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] gap-1 px-2"
                  onClick={enableAllForModule}
                >
                  <Zap className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Full Access
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-destructive"
                  onClick={clearAllForModule}
                >
                  <RotateCcw className="h-3 w-3" /> Revoke All
                </Button>
              </div>
            )}
          </div>

          {/* Grouped Permission Action Pills */}
          <div className="space-y-6">
            {ACTION_GROUPS.map((group) => (
              <div key={group.groupName} className="space-y-2.5">
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.groupName}
                  </h5>
                  <p className="text-[11px] text-muted-foreground/80">{group.description}</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {group.actions.map((act) => {
                    const isEnabled =
                      permissions[activeRole]?.[activeModuleKey]?.[act.key] ?? false;
                    return (
                      <button
                        key={act.key}
                        type="button"
                        disabled={isOwner}
                        onClick={() => togglePermission(act.key)}
                        title={act.description}
                        aria-pressed={isEnabled}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all ${
                          isEnabled
                            ? "border-primary/40 bg-primary/5 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        } ${isOwner ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                      >
                        {isEnabled ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full border border-muted-foreground/40" />
                        )}
                        {act.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Active Summary Bar */}
          <div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs flex items-center justify-between">
            <span className="text-muted-foreground">
              Module Status:{" "}
              {permissions[activeRole]?.[activeModuleKey]?.view ? (
                <strong className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Accessible in Navigation
                </strong>
              ) : (
                <strong className="text-muted-foreground font-medium">Hidden from User</strong>
              )}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {getModuleActiveCount(activeModuleKey)} of 6 actions active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
