import { DashboardPageLayout } from "../../components/dashboard/DashboardPrimitives";
import AdminTechnicianPanel from "../../components/dashboard/AdminTechnicianPanel";
import { useAuth } from "../../context/AuthContext";
import { normalizeRoles } from "../../utils/getDashboardRoute";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function AdminTechnicianPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const roleSet = normalizeRoles(user?.roles ?? (user?.role != null ? [user.role] : []));
  const isAdmin = roleSet.has("ADMIN");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <DashboardPageLayout
      eyebrow="Admin · Settings"
      title="Technician Registration"
      subtitle="Add, edit, and manage all registered technicians in the system"
    >
      <AdminTechnicianPanel />
    </DashboardPageLayout>
  );
}
