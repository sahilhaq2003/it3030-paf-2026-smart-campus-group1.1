/** Canonical paths for role-based landing after sign-in */
export const DASHBOARD_PATHS = {
  USER: "/UserDashboard",
  ADMIN: "/AdminDashboard",
  TECHNICIAN: "/TechnicianDashboard",
};

/**
 * Resolves the post-login route from role names.
 * Priority: ADMIN → TECHNICIAN → USER (default).
 *
 * @param {string[] | Set<string> | string | null | undefined} roles - e.g. from API `user.roles`
 * @returns {string} `/AdminDashboard` | `/TechnicianDashboard` | `/UserDashboard`
 */
export function getDashboardRoute(roles) {
  const normalized = normalizeRoles(roles);
  if (normalized.has("ADMIN")) return DASHBOARD_PATHS.ADMIN;
  if (normalized.has("MANAGER")) return DASHBOARD_PATHS.ADMIN;
  if (normalized.has("TECHNICIAN")) return DASHBOARD_PATHS.TECHNICIAN;
  return DASHBOARD_PATHS.USER;
}

/**
 * After sign-in: email/password uses roles; Google always lands on the user dashboard.
 *
 * @param {string[] | Set<string> | string | null | undefined} roles
 * @param {{ viaGoogle?: boolean }} [options]
 */
export function getPostLoginRoute(roles, options = {}) {
  if (options.viaGoogle) return DASHBOARD_PATHS.USER;
  return getDashboardRoute(roles);
}

/**
 * Whether this user may open a role dashboard URL (blocks cross-role URL entry).
 *
 * @param {string[] | Set<string> | string | null | undefined} roles
 * @param {string} dashboardPath - one of DASHBOARD_PATHS values
 */
export function canAccessDashboardRoute(roles, dashboardPath) {
  const n = normalizeRoles(roles);
  if (dashboardPath === DASHBOARD_PATHS.ADMIN) {
    return n.has("ADMIN") || n.has("MANAGER");
  }
  if (dashboardPath === DASHBOARD_PATHS.TECHNICIAN) {
    return n.has("TECHNICIAN") && !n.has("ADMIN") && !n.has("MANAGER");
  }
  if (dashboardPath === DASHBOARD_PATHS.USER) {
    return !n.has("ADMIN") && !n.has("TECHNICIAN") && !n.has("MANAGER");
  }
  return true;
}

/** Admin ticket queue API is restricted to ADMIN / TECHNICIAN on the backend. */
export function canAccessAdminTickets(roles) {
  const n = normalizeRoles(roles);
  return n.has("ADMIN") || n.has("TECHNICIAN") || n.has("MANAGER");
}

/** Only campus users (not admin/technician staff) may open the create-ticket flow. */
export function canCreateTickets(roles) {
  const n = normalizeRoles(roles);
  return !n.has("ADMIN") && !n.has("TECHNICIAN") && !n.has("MANAGER");
}

/** @param {string[] | Set<string> | string | null | undefined} roles */
export function normalizeRoles(roles) {
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
