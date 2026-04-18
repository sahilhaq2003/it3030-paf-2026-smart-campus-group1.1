import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { facilityApi } from "../../api/facilityApi";
import { ticketApi } from "../../api/ticketApi";
import { fetchUsers, fetchTechnicians } from "../../api/userAdminApi";
import AdminTechnicianPanel from "../../components/dashboard/AdminTechnicianPanel";
import {
  DashboardPageLayout,
  DashboardSection,
  DashboardStatCard,
  campusTextLink,
} from "../../components/dashboard/DashboardPrimitives";
import { DashboardInlineMessage } from "../../components/dashboard/DashboardCards";
import { getBookingAnalytics } from "../../api/bookingApi";
import { useAuth } from "../../context/AuthContext";
import { normalizeRoles } from "../../utils/getDashboardRoute";



export default function AdminDashboard() {
  const { user } = useAuth();
  const displayName = user?.name ?? "there";
  const roles = user?.roles ?? (user?.role != null ? [user.role] : []);
  const normalizedRoles = normalizeRoles(roles);

  const roleLabel = normalizedRoles.has("ADMIN")
    ? "Administrator"
    : normalizedRoles.has("MANAGER")
    ? "Facility Manager"
    : "Staff";

  const roleSubtitle = normalizedRoles.has("ADMIN")
    ? "You have full system access — manage users, tickets, bookings, and facilities."
    : normalizedRoles.has("MANAGER")
    ? "You can manage facility bookings, scan QR codes, and oversee facility operations."
    : "Welcome to the operations dashboard.";

  const bookingsQuery = useQuery({
    queryKey: ["admin", "bookings", "analytics"],
    queryFn: () => getBookingAnalytics().then((r) => r.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });

  const totalTicketsQuery = useQuery({
    queryKey: ["admin", "tickets", "countAll"],
    queryFn: () =>
      ticketApi.getAllTickets({ page: 0, size: 1 }).then((r) => r.data),
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const openTicketsQuery = useQuery({
    queryKey: ["admin", "tickets", "countOpen"],
    queryFn: () =>
      ticketApi
        .getAllTickets({ status: "OPEN", page: 0, size: 1 })
        .then((r) => r.data),
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const inProgressTicketsQuery = useQuery({
    queryKey: ["admin", "tickets", "countInProgress"],
    queryFn: () =>
      ticketApi
        .getAllTickets({ status: "IN_PROGRESS", page: 0, size: 1 })
        .then((r) => r.data),
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users", "count"],
    queryFn: fetchUsers,
    staleTime: 15 * 60 * 1000, // 15 minutes - user list rarely changes
    gcTime: 30 * 60 * 1000,
  });

  const facilitiesQuery = useQuery({
    queryKey: ["admin", "facilities", "count"],
    queryFn: () => facilityApi.getAllFacilities({ page: 0, size: 1 }),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const techniciansQuery = useQuery({
    queryKey: ["admin", "technicians"],
    queryFn: fetchTechnicians,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const openTickets =
    (openTicketsQuery.data?.totalElements ?? 0) +
    (inProgressTicketsQuery.data?.totalElements ?? 0);

  const ticketsError =
    totalTicketsQuery.error ||
    openTicketsQuery.error ||
    inProgressTicketsQuery.error;

  const usersError = usersQuery.error;
  const usersCount = Array.isArray(usersQuery.data) ? usersQuery.data.length : null;

  return (
    <DashboardPageLayout
      eyebrow="Admin · Dashboard"
      title="Operations control"
      subtitle="Cross-campus metrics. Ticket and user figures require an admin account; bookings total is sample data for now."
    >
      <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-sm ring-1 ring-slate-900/[0.03]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{roleLabel}</p>
        <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {displayName}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">{roleSubtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 lg:gap-6">
      <Link to="/admin/analytics" className="block">
  <DashboardStatCard
    label="Total Bookings"
    value={bookingsQuery.isLoading ? "…" : bookingsQuery.data?.totalBookings ?? bookingsQuery.data?.total ?? "—"}
    hint={
      <span className={`inline-flex items-center gap-1 text-sm ${campusTextLink}`}>
        View Booking Analytics
        <span aria-hidden className="text-base leading-none">→</span>
      </span>
    }
  />
</Link>
        <DashboardStatCard
          label="Open tickets"
          value={
            openTicketsQuery.isLoading || inProgressTicketsQuery.isLoading
              ? "…"
              : openTickets
          }
          hint="OPEN + IN_PROGRESS (system-wide)"
        />
        <DashboardStatCard
          label="Users"
          value={
            usersQuery.isLoading ? "…" : usersCount ?? "—"
          }
          hint="Registered accounts in directory"
        />
      </div>

      {(ticketsError || usersError) && (
        <div className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/95 px-5 py-4 text-sm leading-relaxed text-amber-950 shadow-sm ring-1 ring-amber-900/[0.06]">
          {ticketsError ? (
            <p>
              Some ticket metrics could not be loaded (check admin role and API).
            </p>
          ) : null}
          {usersError ? (
            <p className={ticketsError ? "mt-1" : ""}>
              User directory unavailable — admin endpoint may be forbidden for this login.
            </p>
          ) : null}
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <DashboardSection
          title="Ticket pipeline"
          description="Total records in the maintenance system (all statuses)."
        >
          <p className="text-3xl font-bold tabular-nums text-slate-900">
            {totalTicketsQuery.isLoading
              ? "…"
              : totalTicketsQuery.data?.totalElements ?? "—"}
          </p>
          <DashboardInlineMessage>
            Use Admin tickets to filter, assign, and resolve work in detail.
          </DashboardInlineMessage>
          <Link to="/admin/tickets" className={`mt-5 inline-flex items-center gap-1 text-sm ${campusTextLink}`}>
            Open admin ticket view
            <span aria-hidden className="text-base leading-none">
              →
            </span>
          </Link>
        </DashboardSection>

        <DashboardSection
          title="User directory"
          description="Snapshot from GET /users (admins only)."
        >
          {usersQuery.isLoading ? (
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
          ) : usersError ? (
            <DashboardInlineMessage variant="error">
              Unable to load users for this session.
            </DashboardInlineMessage>
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums text-slate-900">
                {usersCount}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Manage roles and access from the user administration tools when exposed in the UI.
              </p>
            </>
          )}
        </DashboardSection>
      </div>

      <div className="mt-6">
        <DashboardSection
          title="Facility Registry"
          description="Total physical resources configured in the backend server."
        >
          {facilitiesQuery.isLoading ? (
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="text-3xl font-bold tabular-nums text-slate-900">
              {facilitiesQuery.data?.totalElements ?? "—"} <span className="text-lg text-gray-500 font-medium tracking-tight">Facilities</span>
            </p>
          )}
          <DashboardInlineMessage>
            Manage capacities, operational limits, types, and physical metadata attributes natively.
          </DashboardInlineMessage>
          <Link to="/admin/facilities" className={`mt-5 inline-flex items-center gap-1 text-sm ${campusTextLink}`}>
            Launch Facility Manager
            <span aria-hidden className="text-base leading-none">
              →
            </span>
          </Link>
        </DashboardSection>

        <DashboardSection
          title="Technician Registry"
          description="Manage all registered technicians and their specializations."
        >
          {techniciansQuery.isLoading ? (
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="text-3xl font-bold tabular-nums text-slate-900">
              {techniciansQuery.data?.length ?? "—"} <span className="text-lg text-gray-500 font-medium tracking-tight">Technicians</span>
            </p>
          )}
          <DashboardInlineMessage>
            Add, edit, and remove technician profiles. Assign technicians to maintenance tickets.
          </DashboardInlineMessage>
          <Link to="/admin/technicians" className={`mt-5 inline-flex items-center gap-1 text-sm ${campusTextLink}`}>
            Manage Technicians
            <span aria-hidden className="text-base leading-none">
              →
            </span>
          </Link>
        </DashboardSection>
      </div>

      <div className="mt-12 border-t border-slate-200/90 pt-10">
        <AdminTechnicianPanel />
      </div>
    </DashboardPageLayout>
  );
}
