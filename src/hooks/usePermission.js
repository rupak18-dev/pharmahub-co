import { useAuth } from "@/lib/auth";
import { DEFAULT_PERMISSIONS } from "@/lib/permissions";

export function usePermission() {
  const { user } = useAuth();
  return (module, action = "view") => {
    if (!user) return false;
    if (user.role === "Owner") return true;
    const roleDefault = DEFAULT_PERMISSIONS[user.role]?.[module] ?? {};
    // Effective permissions mirror the backend model: per-user overrides
    // (user.permissions — the deltas an Owner configured) merge on top of the
    // role defaults. /auth/me returns only the stored overrides ({} for most
    // users), so role defaults are required to resolve the sidebar.
    const row = { ...roleDefault, ...(user.permissions?.[module] ?? {}) };
    return row[action] ?? false;
  };
}
