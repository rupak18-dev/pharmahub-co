import { ROLE_CATALOG, getRoleById } from "./roleCatalog";
import { ALL_MODULES } from "./permissions";
import { db } from "./db";

const isDemoProfile = (p) => Boolean(p.isDemo);

export function assignUsers(profiles, roleName) {
  return profiles.filter((p) => !isDemoProfile(p) && p.role === roleName);
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

export function buildRoleViews(profiles, permissions) {
  return ROLE_CATALOG.map((role) => {
    const matrix = permissions?.[role.name];
    return {
      ...role,
      modules: resolveModuleAccess(matrix),
      permissionCount: resolvePermissionCount(matrix),
      assignedUsers: assignUsers(profiles, role.name),
    };
  });
}

export function getRoles() {
  const state = db.get();
  return buildRoleViews(state.profiles, state.permissions);
}

export function getRole(roleId) {
  const state = db.get();
  const role = getRoleById(roleId);
  const matrix = state.permissions?.[role.name];
  return {
    ...role,
    modules: resolveModuleAccess(matrix),
    permissionCount: resolvePermissionCount(matrix),
    assignedUsers: assignUsers(state.profiles, role.name),
  };
}
