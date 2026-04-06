import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  canCreateTickets,
  getDashboardRoute,
} from "../utils/getDashboardRoute";

/**
 * My tickets list (/tickets) is for campus users only. Staff use Admin tickets + their dashboards.
 */
export default function UserMyTicketsRoute({ children }) {
  const { user } = useAuth();
  const roles = user?.roles ?? (user?.role != null ? [user.role] : []);

  if (!canCreateTickets(roles)) {
    return <Navigate to={getDashboardRoute(roles)} replace />;
  }

  return children;
}
