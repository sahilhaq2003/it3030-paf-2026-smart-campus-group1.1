import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  canAccessDashboardRoute,
  getDashboardRoute,
} from "../utils/getDashboardRoute";

/**
 * Redirects to the user's primary dashboard if they open another role's URL.
 */
export default function RoleProtectedDashboard({ dashboardPath, children }) {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#1E3A5F]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const roles = user.roles ?? (user.role != null ? [user.role] : []);
  if (!canAccessDashboardRoute(roles, dashboardPath)) {
    return <Navigate to={getDashboardRoute(roles)} replace />;
  }

  return children;
}
