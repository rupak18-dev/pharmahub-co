import { ROLE_CATALOG } from "./roleCatalog";
import { ALL_MODULES } from "./permissions";

const isDemoProfile = (p) => Boolean(p.isDemo);

export function assignUsers(members, roleName) {
  return members.filter((p) => !isDemoProfile(p) && p.role === roleName);
}

export function resolveModuleAccess(matrix) {
  if (!matrix) return [];
  return ALL_MODULES.filter((m) => matrix[m.key]?.view).map((m) => ({
    key: m.key,
    label: m.label,
  }));
}

export function resolvePermissionCount(matrix) {
  if (!matrix) return null;
  let count = 0;
  ALL_MODULES.forEach((m) => {
    const row = matrix[m.key];
    if (!row) return;
    Object.values(row).forEach((v) => {
      if (v) count += 1;
    });
  });
  return count;
}

// Members must come from the persisted backend team list (see useTeamMembers).
// This view builder never reads the local database itself.
export function buildRoleViews(members, permissions) {
  return ROLE_CATALOG.map((role) => {
    const matrix = permissions?.[role.name];
    return {
      ...role,
      modules: resolveModuleAccess(matrix),
      permissionCount: resolvePermissionCount(matrix),
      assignedUsers: assignUsers(members, role.name),
    };
  });
}
