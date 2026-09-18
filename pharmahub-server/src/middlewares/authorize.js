import { ApiError } from "../core/ApiError.js";
import { getEffectivePermissions } from "../services/permissions.service.js";

// Route-level authorization. Effective permissions are the role defaults
// merged with any explicit per-user overrides the Owner configured at
// invitation time (or later via staff access edits). An explicit user
// restriction always wins over the role default.
export function authorize(module, action = "view") {
  return async (req, _res, next) => {
    try {
      const user = req.user;
      const roleName = user?.role;
      if (!roleName) throw ApiError.forbidden("Missing role");

      const permissions = await getEffectivePermissions(user);
      const allowed = permissions?.[module]?.[action];
      if (!allowed) {
        throw ApiError.forbidden("You do not have permission to access this resource.");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
