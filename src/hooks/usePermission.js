import { useAuth } from "@/lib/auth";
import { DEFAULT_PERMISSIONS } from "@/lib/permissions";

export function usePermission() {
  const { user } = useAuth();
  return (module, action = "view") => {
    if (!user) return false;
    const permissions =
      user.permissions && Object.keys(user.permissions).length
        ? user.permissions
        : DEFAULT_PERMISSIONS[user.role] || {};
    return permissions[module]?.[action] ?? false;
  };
}
