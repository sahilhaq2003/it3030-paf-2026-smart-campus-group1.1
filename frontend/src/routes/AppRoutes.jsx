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
 * - / → public landing (login button)
 * - /login → LoginPage
 * - /home + app routes → ProtectedRoute + AppShell
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
        <Route path="/dashboard/user" element={<UserDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/technician" element={<TechnicianDashboard />} />
        <Route path="/technician" element={<Navigate to="/dashboard/technician" replace />} />
        <Route path="/tickets" element={<MyTicketsPage />} />
        <Route path="/tickets/create" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/admin/tickets" element={<AdminTicketsPage />} />
      </Route>
    </Routes>
  );
}
