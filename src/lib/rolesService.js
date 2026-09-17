import { apiRequest } from "./api";
import { ALL_MODULES } from "./permissions";
import { getCanonicalRoleMeta, getRoleTone, categoryLabel } from "./roleCatalog";

/* Backend-backed role service. The Role collection on pharmahub-server is the
   single source of truth for role configuration — every read/write here goes
   through GET/PATCH /api/v1/roles so configuration persists in the database. */

export async function listRoles() {
  const roles = (await apiRequest("/roles")) ?? [];
  return roles.map((r) => normalizeRole(r));
}

export async function updateRolePermissions(roleId, permissions) {
  const updated = await apiRequest(`/roles/${roleId}`, {
    method: "PATCH",
    body: JSON.stringify({ permissions }),
  });
  return normalizeRole(updated);
}

/* Map a backend role record onto the view model consumed by the Roles tab
   (RoleCard / RoleDetailModal / AccessPolicyBuilder). */
export function normalizeRole(role) {
  const meta = getCanonicalRoleMeta(role?.name);
  const tone = getRoleTone(meta.tone);
  const permissions = normalizeMatrix(role?.permissions);
  return {
    roleId: role?.id ?? role?._id ?? null,
    name: role?.name ?? "Unknown role",
    description: role?.description || meta.description || "",
    department: role?.department || "",
    category: meta.category,
    categoryLabel: categoryLabel(meta.category),
    type: role?.isSystem === false ? "custom" : "system",
    icon: meta.icon,
    tone: meta.tone,
    tileBg: tone.tileBg,
    iconColor: tone.iconColor,
    priority: meta.priority,
    active: role?.active !== false,
    // Raw module -> actions matrix from the database.
    permissions,
    modules: resolveModuleAccess(permissions),
    permissionCount: resolvePermissionCount(permissions),
    assignedUsersCount: role?.assignedUsersCount ?? 0,
  };
}

function normalizeMatrix(matrix) {
  const clean = {};
  for (const m of ALL_MODULES) {
    const row = matrix?.[m.key];
    if (!row || typeof row !== "object") continue;
    clean[m.key] = {
      view: Boolean(row.view),
      create: Boolean(row.create),
      update: Boolean(row.update),
      delete: Boolean(row.delete),
      approve: Boolean(row.approve),
      export: Boolean(row.export),
    };
  }
  return clean;
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
