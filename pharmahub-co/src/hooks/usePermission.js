import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/hooks/useDb";
import { DEFAULT_PERMISSIONS, ALL_MODULES } from "@/lib/permissions";

// Effective permission matrix for the signed-in user:
//   effective(module, action) = backend override (user.permissions) ?? role default ?? false
// The backend returns the merged EFFECTIVE matrix in `user.permissions`, so an
// explicit Owner restriction (e.g. batches disabled for one Pharmacist) always
// wins over the role default — two users with the same role can legitimately
// differ. Role defaults only fill modules the backend does not know about
// (e.g. the frontend-only Shortbook module) so existing navigation is kept.
function effectiveMatrix(role, roleDefaults, overrides, accessIds) {
  const merged = {};
  const hasWhitelist = Array.isArray(accessIds) && accessIds.length > 0;
  const allowedSet = hasWhitelist ? new Set(accessIds) : null;

  for (const mod of ALL_MODULES) {
    const baseActions = roleDefaults?.[mod.key] ?? {};
    const overrideActions = overrides?.[mod.key] ?? {};
    const modMerged = { ...baseActions, ...overrideActions };

    if (allowedSet) {
      if (!allowedSet.has(mod.key)) {
        merged[mod.key] = {
          view: false,
          create: false,
          update: false,
          delete: false,
          approve: false,
          export: false,
        };
      } else {
        if (!modMerged.view && overrideActions.view !== false) {
          modMerged.view = true;
        }
        merged[mod.key] = modMerged;
      }
    } else {
      merged[mod.key] = modMerged;
    }
  }
  return merged;
}

export function usePermission() {
  const { user } = useAuth();
  const rolePerms = useDb((d) => d.permissions);

  const perms = useMemo(() => {
    if (!user) return null;
    const roleDefaults = rolePerms?.[user.role] ?? DEFAULT_PERMISSIONS[user.role] ?? {};
    return effectiveMatrix(user.role, roleDefaults, user.permissions, user.accessIds);
  }, [user, rolePerms]);

  return (module, action = "view") => {
    if (!user || !perms) return false;
    return perms[module]?.[action] ?? false;
  };
}
