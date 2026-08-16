import { useAuth } from "@/lib/auth";
import { useDb } from "@/hooks/useDb";
import { can } from "@/lib/permissions";
export function usePermission() {
  const { user } = useAuth();
  const perms = useDb((d) => d?.permissions);
  return (module, action = "view") => {
    if (!user) return false;
    return can(perms, user.role, module, action);
  };
}
