import { ROLE_CATALOG, getRoleByName, getRoleTone } from "@/lib/roleCatalog";
import { ALL_MODULES } from "@/lib/permissions";

/* Role metadata shared by the Users tab, Invite Staff modal, and the
   Change Role dialog. Descriptions and presentation are derived from the
   single source of truth in @/lib/roleCatalog. */
function moduleLabel(key) {
  return ALL_MODULES.find((m) => m.key === key)?.label ?? key;
}

export const ROLE_META = Object.fromEntries(
  ROLE_CATALOG.map((role) => {
    const tone = getRoleTone(role.tone);
    return [
      role.name,
      {
        icon: role.icon,
        color: tone.iconColor,
        bg: tone.tileBg,
        description: role.description,
        modules: role.modules.map(moduleLabel),
      },
    ];
  }),
);

export function getRoleMeta(role) {
  const found = ROLE_META[role];
  if (found) return found;
  const fallback = getRoleByName(role);
  const tone = getRoleTone(fallback.tone);
  return {
    icon: fallback.icon,
    color: tone.iconColor,
    bg: tone.tileBg,
    description: fallback.description,
    modules: [],
  };
}

/* The module whitelist a role presets by default. Used to preload the Change
   Role dialog's access chips so saving without touching them is a no-op, and
   to rebase the chips when the Owner switches the selected role. Unknown/custom
   roles default to unrestricted so they can never be wiped accidentally. */
export function defaultModulesForRole(roleName) {
  const role = getRoleByName(roleName);
  if (role.roleId === "custom-role") return ALL_MODULES.map((m) => m.key);
  return role.modules ?? [];
}

function staffStatus(profile) {
  if (profile?.status) return profile.status;
  return profile?.active ? "active" : "suspended";
}

/* View model for the Staff Access workflow. Keeps the data boundary clean so
   a backend (GET /users, PUT /users/:id/role) can be wired in later without
   touching the UI. Demo accounts are excluded from the staff list. */
export function buildStaffAccess(profiles) {
  return (profiles ?? [])
    .filter((p) => !p.isDemo)
    .map((p) => {
      const role = getRoleByName(p.role);
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        department: p.department,
        designation: p.designation,
        roleId: role.roleId,
        roleName: p.role || null,
        accessIds: p.accessIds ?? [],
        status: staffStatus(p),
        createdAt: p.createdAt,
      };
    });
}
