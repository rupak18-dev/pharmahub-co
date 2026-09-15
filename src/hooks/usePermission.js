import { useAuth } from "@/lib/auth";
import { DEFAULT_PERMISSIONS, ALL_ROLES } from "@/lib/permissions";

// Resolve a role returned by the backend to a canonical ALL_ROLES key,
// tolerating case differences / whitespace so the sidebar never collapses
// because of a spelling mismatch (e.g. "owner" vs "Owner").
function normalizeRole(role) {
  if (!role || typeof role !== "string") return null;
  const trimmed = role.trim();
  if (!trimmed) return null;
  return ALL_ROLES.find((r) => r.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
}

export function usePermission() {
  const { user } = useAuth();
  return (module, action = "view") => {
    if (!user) return false;
    if (module === "support") return true;
    const role = normalizeRole(user.role);
    if (role === "Owner") return true;
    // Role defaults are the base matrix; per-user overrides (user.permissions —
    // the deltas an Owner configured) merge on top. /auth/me returns only the
    // stored overrides ({} for most users), so role defaults are required to
    // resolve the sidebar.
    //
    // An authenticated account with an unresolvable role defaults to the Admin
    // matrix so the shell never renders an empty sidebar — the backend remains
    // the authority for real authorization, this only drives navigation.
    const base =
      DEFAULT_PERMISSIONS[role] ??
      (role ? {} : DEFAULT_PERMISSIONS.Admin) ??
      DEFAULT_PERMISSIONS.Admin;
    const row = { ...(base[module] ?? {}), ...(user.permissions?.[module] ?? {}) };
    return row[action] ?? false;
  };
}
