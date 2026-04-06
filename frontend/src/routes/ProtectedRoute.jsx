import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeRoles } from "../utils/getDashboardRoute";

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.requiredRoles] — user must have at least one (e.g. ['ADMIN','MANAGER'])
 */
export default function ProtectedRoute({ children, requiredRoles }) {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-campus-brand" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRoles?.length) {
    const n = normalizeRoles(user.roles ?? (user.role != null ? [user.role] : []));
    const ok = requiredRoles.some((r) => n.has(String(r).trim().toUpperCase()));
    if (!ok) return <Navigate to="/unauthorized" replace />;
  }

  return children;
}