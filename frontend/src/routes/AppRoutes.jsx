import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import MyTicketsPage from "../pages/member3/MyTicketsPage";
import CreateTicketPage from "../pages/member3/CreateTicketPage";
import TicketDetailPage from "../pages/member3/TicketDetailPage";
import AdminTicketsPage from "../pages/member3/AdminTicketsPage";
import LoginPage from "../pages/member4/LoginPage";
import LandingPage from "../pages/member4/LandingPage";
import HomePage from "../pages/member4/HomePage";
import UserDashboard from "../pages/dashboards/UserDashboard";
import AdminDashboard from "../pages/dashboards/AdminDashboard";
import TechnicianDashboard from "../pages/dashboards/TechnicianDashboard";
import ProtectedRoute from "./ProtectedRoute";

/**
 * Router setup:
 * - / → public landing
 * - /login → LoginPage
 * - Role dashboards: /dashboard, /admin-dashboard, /technician-dashboard
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/technician-dashboard" element={<TechnicianDashboard />} />
        <Route
          path="/dashboard/user"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/dashboard/admin"
          element={<Navigate to="/admin-dashboard" replace />}
        />
        <Route
          path="/dashboard/technician"
          element={<Navigate to="/technician-dashboard" replace />}
        />
        <Route
          path="/technician"
          element={<Navigate to="/technician-dashboard" replace />}
        />
        <Route path="/tickets" element={<MyTicketsPage />} />
        <Route path="/tickets/create" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/admin/tickets" element={<AdminTicketsPage />} />
      </Route>
    </Routes>
  );
}
