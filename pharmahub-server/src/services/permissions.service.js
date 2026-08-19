import { Role } from "../models/Role.js";
import { constants } from "../config/constants.js";

// Effective-permission model:
//   effective(module, action) = user override ?? role default ?? false
// Users store ONLY explicit overrides (the deltas the Owner configured during
// invitation / staff access editing). Role defaults come from the Role
// collection and are never rewritten by per-user restrictions, so restricting
// one user can never corrupt the global role defaults.

// Map values in a NON-lean document are Mongoose subdocuments — spreading one
// with `{...actions}` yields its internal `_doc`/`$__` paths instead of the
// schema getters (view/create/...). Convert every value to a plain object so
// merges/sanitization always see clean `{ action: boolean }` maps.
function toPlain(value) {
  if (value instanceof Map) return Object.fromEntries(value);
  if (value && typeof value.toObject === "function") return value.toObject();
  return value;
}

export function normalizePermissions(value) {
  if (!value) return {};
  if (value instanceof Map) {
    const out = {};
    for (const [key, val] of value) out[key] = toPlain(val);
    return out;
  }
  if (value && typeof value.toObject === "function") return value.toObject();
  return value;
}

// Keep only known modules/actions so arbitrary keys can never sneak in.
export function sanitizePermissionOverrides(permissions) {
  const allowedActions = new Set(constants.actions);
  const clean = {};
  for (const [mod, actions] of Object.entries(normalizePermissions(permissions))) {
    if (!constants.modules.includes(mod)) continue;
    if (!actions || typeof actions !== "object") continue;
    const entry = {};
    for (const action of allowedActions) {
      if (typeof actions[action] === "boolean") entry[action] = actions[action];
    }
    if (Object.keys(entry).length > 0) clean[mod] = entry;
  }
  return clean;
}

// Explicit overrides win over role defaults, action by action. Modules not
// mentioned in the overrides keep their role default. Deny-by-default for
// anything undefined.
export function mergePermissionOverrides(rolePerms, overrides) {
  const merged = {};
  const base = normalizePermissions(rolePerms);
  for (const [mod, actions] of Object.entries(base)) {
    merged[mod] = { ...actions };
  }
  for (const [mod, actions] of Object.entries(normalizePermissions(overrides))) {
    if (!actions || typeof actions !== "object") continue;
    merged[mod] = { ...(merged[mod] ?? {}), ...actions };
  }
  return merged;
}

export async function getRolePermissions(roleName) {
  if (!roleName) return {};
  const role = await Role.findOne({ name: roleName }).lean();
  return normalizePermissions(role?.permissions);
}

export async function getEffectivePermissions(user) {
  if (!user) return {};
  const rolePerms = await getRolePermissions(user.role);
  const baseMerged = mergePermissionOverrides(rolePerms, user.permissions);

  // If user has an explicit accessIds module whitelist configured, enforce it:
  // 1. Any module not in accessIds is completely denied.
  // 2. Any module in accessIds will have at least { view: true } enabled unless explicitly overridden.
  if (Array.isArray(user.accessIds) && user.accessIds.length > 0) {
    const whitelist = new Set(user.accessIds);
    const result = {};
    for (const mod of constants.modules) {
      if (!whitelist.has(mod)) {
        result[mod] = {
          view: false,
          create: false,
          update: false,
          delete: false,
          approve: false,
          export: false,
        };
      } else {
        const current = { ...(baseMerged[mod] ?? {}) };
        const userOverrides = normalizePermissions(user.permissions);
        if (!current.view && userOverrides[mod]?.view !== false) {
          current.view = true;
        }
        result[mod] = current;
      }
    }
    return result;
  }

  return baseMerged;
}
