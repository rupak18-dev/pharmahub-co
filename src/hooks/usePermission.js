import { useAuth } from "@/lib/auth";
import { DEFAULT_PERMISSIONS, ALL_ROLES } from "@/lib/permissions";

// Resolve a role returned by the backend to a canonical ALL_ROLES key,
// tolerating case differences / whitespace so the sidebar never collapses
// because of a spelling mismatch (e.g. "owner" vs "Owner").
// Returns null for empty/missing roles and the raw string for unrecognized ones.
function normalizeRole(role) {
  if (typeof role !== "string") return null;
  const trimmed = role.trim();
  if (!trimmed) return null;
  return ALL_ROLES.find((r) => r.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
}

export function usePermission() {
  const { user } = useAuth();
  return (module, action = "view") => {
    if (!user) return false;
    const raw = user.role;
    const normalized = normalizeRole(raw);
    if (normalized === "Owner") return true;
    // Role defaults are the base matrix; per-user overrides (user.permissions —
    // the deltas an Owner configured) merge on top. /auth/me returns only the
    // stored overrides ({} for most users), so role defaults are required to
    // resolve the sidebar.
    //
    // Empty/missing role ("", null, undefined) means the backend has not yet
    // assigned one — common for self-registered accounts that just completed
    // onboarding.  Treat them as Admin so the org owner can actually use the
    // app; an Owner can later restrict them via per-user permission overrides.
    //
    // An unrecognized role (e.g. "Pharmacist-in-Charge" or "Warehouse Manager"
    // left over in legacy user rows, or a typo) also falls back to Admin
    // defaults rather than deny-all: an empty sidebar is a dead end — the
    // Owner needs the UI (Users & Roles) to fix permissions in the first
    // place. Failure is non-destructive: it can only ever be more permissive.
    const defaults =
      DEFAULT_PERMISSIONS[normalized] ?? DEFAULT_PERMISSIONS.Admin;
    if (!defaults) return false;
    const row = { ...(defaults[module] ?? {}), ...(user.permissions?.[module] ?? {}) };
    return row[action] ?? false;
  };
}
