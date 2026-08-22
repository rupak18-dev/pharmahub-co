import { ROLE_CATALOG, getRoleByName, getRoleTone, getCanonicalRoleMeta } from "@/lib/roleCatalog";
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
  // Canonical backend roles (Owner, Admin, Cashier, Store Keeper, ...) resolve
  // through the canonical metadata map; anything else falls back to the
  // generic custom-role presentation.
  const canonical = getCanonicalRoleMeta(role);
  const isKnown = Boolean(canonical.description);
  const fallback = getRoleByName(role);
  const tone = getRoleTone(isKnown ? canonical.tone : fallback.tone);
  return {
    icon: isKnown ? canonical.icon : fallback.icon,
    color: tone.iconColor,
    bg: tone.tileBg,
    description: isKnown ? canonical.description : fallback.description,
    modules: [],
  };
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
        // Set on pending invitation rows so callers can block account-level
        // actions (e.g. role changes) until the invitation is accepted.
        invitationId: p.invitationId ?? null,
      };
    });
}
