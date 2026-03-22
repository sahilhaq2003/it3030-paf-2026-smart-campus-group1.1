import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  canAccessAdminTickets,
  getDashboardRoute,
} from "../utils/getDashboardRoute";

/** Admin ticket list matches backend @PreAuthorize ADMIN | TECHNICIAN. */
export default function StaffTicketsRoute({ children }) {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-campus-brand" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const roles = user.roles ?? (user.role != null ? [user.role] : []);
  if (!canAccessAdminTickets(roles)) {
    return <Navigate to={getDashboardRoute(roles)} replace />;
  }

  return children;
}
