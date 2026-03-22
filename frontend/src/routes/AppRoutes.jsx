import { Routes, Route } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import MyTicketsPage from "../pages/member3/MyTicketsPage";
import CreateTicketPage from "../pages/member3/CreateTicketPage";
import TicketDetailPage from "../pages/member3/TicketDetailPage";
import AdminTicketsPage from "../pages/member3/AdminTicketsPage";
import TechnicianDashboard from "../pages/member3/TechnicianDashboard";
import LoginPage from "../pages/member4/LoginPage";
import LandingPage from "../pages/member4/LandingPage";
import HomePage from "../pages/member4/HomePage";
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
        <Route path="/tickets" element={<MyTicketsPage />} />
        <Route path="/tickets/create" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/admin/tickets" element={<AdminTicketsPage />} />
        <Route path="/technician" element={<TechnicianDashboard />} />
      </Route>
    </Routes>
  );
}
