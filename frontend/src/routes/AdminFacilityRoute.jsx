import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardRoute, normalizeRoles } from "../utils/getDashboardRoute";

/** Admin facilities match exclusively to backend @PreAuthorize("hasRole('ADMIN')") */
export default function AdminFacilityRoute({ children }) {
  const { user, isBootstrapping } = useAuth();

  // Show standard auth loading spinner
  if (isBootstrapping) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  // Fallback to login if not authenticated whatsoever
  if (!user) return <Navigate to="/login" replace />;

  // Enforce ADMIN exclusivity
  const roles = user.roles ?? (user.role != null ? [user.role] : []);
  const allowed = normalizeRoles(roles);
  if (!allowed.has("ADMIN") && !allowed.has("MANAGER")) {
    // If they aren't admin, redirect them back to their standard assigned dashboard
    return <Navigate to={getDashboardRoute(roles)} replace />;
  }

  return children;
}
