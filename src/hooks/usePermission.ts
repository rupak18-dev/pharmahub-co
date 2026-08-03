import { useAuth } from "@/lib/auth";
import { useDb } from "@/hooks/useDb";
import { can } from "@/lib/permissions";
import type { ModuleKey, PermissionAction } from "@/lib/types";

export function usePermission() {
  const { user } = useAuth();
  const perms = useDb((d) => d.permissions);
  return (module: ModuleKey, action: PermissionAction = "view") => {
    if (!user) return false;
    return can(perms, user.role, module, action);
  };
}
