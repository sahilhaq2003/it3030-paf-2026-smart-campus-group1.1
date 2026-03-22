/** Canonical paths for role-based landing after sign-in */
export const DASHBOARD_PATHS = {
  USER: "/dashboard",
  ADMIN: "/admin-dashboard",
  TECHNICIAN: "/technician-dashboard",
};

/**
 * Resolves the post-login route from role names.
 * Priority: ADMIN → TECHNICIAN → USER (default).
 *
 * @param {string[] | Set<string> | string | null | undefined} roles - e.g. from API `user.roles`
 * @returns {string} `/admin-dashboard` | `/technician-dashboard` | `/dashboard`
 */
export function getDashboardRoute(roles) {
  const normalized = normalizeRoles(roles);
  if (normalized.has("ADMIN")) return DASHBOARD_PATHS.ADMIN;
  if (normalized.has("TECHNICIAN")) return DASHBOARD_PATHS.TECHNICIAN;
  return DASHBOARD_PATHS.USER;
}

function normalizeRoles(roles) {
  const set = new Set();
  if (roles == null) return set;

  if (typeof roles === "string") {
    roles
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean)
      .forEach((r) => set.add(stripRolePrefix(r.toUpperCase())));
    return set;
  }

  if (roles instanceof Set) {
    roles.forEach((r) => {
      if (r != null) set.add(stripRolePrefix(String(r).trim().toUpperCase()));
    });
    return set;
  }

  if (Array.isArray(roles)) {
    roles.forEach((r) => {
      if (r != null) set.add(stripRolePrefix(String(r).trim().toUpperCase()));
    });
    return set;
  }

  return set;
}

function stripRolePrefix(role) {
  return role.startsWith("ROLE_") ? role.slice(5) : role;
}
