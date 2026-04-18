import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import MyTicketsPage from "../pages/member3/MyTicketsPage";
import CreateTicketPage from "../pages/member3/CreateTicketPage";
import TicketDetailPage from "../pages/member3/TicketDetailPage";
import AdminTicketsPage from "../pages/member3/AdminTicketsPage";
import AdminTechnicianPage from "../pages/member3/AdminTechnicianPage";
import LoginPage from "../pages/member4/LoginPage";
import LoginHelpPage from "../pages/member4/LoginHelpPage";
import LandingPage from "../pages/member4/LandingPage";
import AboutPage from "../pages/member4/AboutPage";
import ContactPage from "../pages/member4/ContactPage";
import SupportPage from "../pages/member4/SupportPage";
import HomePage from "../pages/member4/HomePage";
import ProfilePage from "../pages/member4/ProfilePage";
import AdminUsersPage from "../pages/member4/AdminUsersPage";
import UnauthorizedPage from "../pages/member4/UnauthorizedPage";
import NotFoundPage from "../pages/member4/NotFoundPage";
import UserDashboard from "../pages/dashboards/UserDashboard";
import AdminDashboard from "../pages/dashboards/AdminDashboard";
import TechnicianDashboard from "../pages/dashboards/TechnicianDashboard";
import LecturerDashboard from "../pages/dashboards/LecturerDashboard";
import ProtectedRoute from "./ProtectedRoute";
import CreateTicketRoute from "./CreateTicketRoute";
import UserMyTicketsRoute from "./UserMyTicketsRoute";
import RoleProtectedDashboard from "./RoleProtectedDashboard";
import StaffTicketsRoute from "./StaffTicketsRoute";
import { DASHBOARD_PATHS } from "../utils/getDashboardRoute";
import FacilitiesListPage from "../pages/member1/FacilitiesListPage";
import FacilityDetailPage from "../pages/member1/FacilityDetailPage";
import AdminFacilityRoute from "./AdminFacilityRoute";
import AdminFacilitiesPage from "../pages/member1/AdminFacilitiesPage";
import BookingRequestPage from "../pages/member2/BookingRequestPage";
import MyBookingsPage from "../pages/member2/MyBookingsPage";
import BookingDetailPage from "../pages/member2/BookingDetailPage";
import AdminBookingsPage from "../pages/member2/AdminBookingsPage";
import EditBookingPage from "../pages/member2/EditBookingPage"; 
import AdminReviewBookingPage from "../pages/member2/AdminReviewBookingPage";
import AdminAnalyticsPage from "../pages/member2/AdminAnalyticsPage";
import ScanBookingPage from "../pages/member2/ScanBookingPage";
import VerifyBookingPage from "../pages/member2/VerifyBookingPage";
/**
 * Router setup:
 * - / → public landing
 * - /login → LoginPage
 * - Role dashboards: /UserDashboard, /LecturerDashboard, /AdminDashboard, /TechnicianDashboard
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/help" element={<LoginHelpPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/facilities" element={<FacilitiesListPage />} />
        <Route path="/facilities/:id" element={<FacilityDetailPage />} />
        {/* Member 2 - Booking Routes */}
        <Route path="/facilities/:id/book" element={<BookingRequestPage />} />
        <Route path="/bookings/my" element={<MyBookingsPage />} />
        <Route path="/bookings/edit/:id" element={<EditBookingPage />} />
        <Route path="/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/bookings/:id" element={<AdminReviewBookingPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/scan" element={<ScanBookingPage />} />
        
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/UserDashboard"
          element={
            <RoleProtectedDashboard dashboardPath={DASHBOARD_PATHS.USER}>
              <UserDashboard />
            </RoleProtectedDashboard>
          }
        />
        <Route
          path="/LecturerDashboard"
          element={
            <RoleProtectedDashboard dashboardPath={DASHBOARD_PATHS.LECTURER}>
              <LecturerDashboard />
            </RoleProtectedDashboard>
          }
        />
        <Route
          path="/AdminDashboard"
          element={
            <RoleProtectedDashboard dashboardPath={DASHBOARD_PATHS.ADMIN}>
              <AdminDashboard />
            </RoleProtectedDashboard>
          }
        />
        <Route
          path="/TechnicianDashboard"
          element={
            <RoleProtectedDashboard dashboardPath={DASHBOARD_PATHS.TECHNICIAN}>
              <TechnicianDashboard />
            </RoleProtectedDashboard>
          }
        />
        <Route path="/dashboard" element={<Navigate to="/UserDashboard" replace />} />
        <Route path="/lecturer-dashboard" element={<Navigate to="/LecturerDashboard" replace />} />
        <Route path="/admin-dashboard" element={<Navigate to="/AdminDashboard" replace />} />
        <Route path="/technician-dashboard" element={<Navigate to="/TechnicianDashboard" replace />} />
        <Route
          path="/dashboard/user"
          element={<Navigate to="/UserDashboard" replace />}
        />
        <Route
          path="/dashboard/lecturer"
          element={<Navigate to="/LecturerDashboard" replace />}
        />
        <Route
          path="/dashboard/admin"
          element={<Navigate to="/AdminDashboard" replace />}
        />
        <Route
          path="/dashboard/technician"
          element={<Navigate to="/TechnicianDashboard" replace />}
        />
        <Route
          path="/technician"
          element={<Navigate to="/TechnicianDashboard" replace />}
        />
        <Route
          path="/tickets"
          element={
            <UserMyTicketsRoute>
              <MyTicketsPage />
            </UserMyTicketsRoute>
          }
        />
        <Route
          path="/tickets/create"
          element={
            <CreateTicketRoute>
              <CreateTicketPage />
            </CreateTicketRoute>
          }
        />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route
          path="/admin/tickets"
          element={
            <StaffTicketsRoute>
              <AdminTicketsPage />
            </StaffTicketsRoute>
          }
        />
        <Route
          path="/admin/technicians"
          element={
            <AdminFacilityRoute>
              <AdminTechnicianPage />
            </AdminFacilityRoute>
          }
        />
        
        <Route
          path="/admin/facilities"
          element={
            <AdminFacilityRoute>
              <AdminFacilitiesPage />
            </AdminFacilityRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminFacilityRoute>
              <AdminUsersPage />
            </AdminFacilityRoute>
          }
        />
      </Route>
        <Route path="/verify/:id" element={<VerifyBookingPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
