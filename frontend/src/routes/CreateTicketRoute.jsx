import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  canCreateTickets,
  getDashboardRoute,
} from "../utils/getDashboardRoute";

/**
 * Wraps the create-ticket page; staff (admin/technician) are redirected to their dashboard.
 */
export default function CreateTicketRoute({ children }) {
  const { user } = useAuth();
  const roles = user?.roles ?? (user?.role != null ? [user.role] : []);

  if (!canCreateTickets(roles)) {
    return <Navigate to={getDashboardRoute(roles)} replace />;
  }

  return children;
}
