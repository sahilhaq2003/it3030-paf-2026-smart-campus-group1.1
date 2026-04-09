import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { facilityApi } from "../../api/facilityApi";
import { ticketApi } from "../../api/ticketApi";
import { fetchUsers } from "../../api/userAdminApi";
import AdminTechnicianPanel from "../../components/dashboard/AdminTechnicianPanel";
import {
  DashboardPageLayout,
  DashboardSection,
  DashboardStatCard,
  campusTextLink,
} from "../../components/dashboard/DashboardPrimitives";
import { DashboardInlineMessage } from "../../components/dashboard/DashboardCards";

/** Placeholder until a bookings admin aggregate exists */
const TOTAL_BOOKINGS_SAMPLE = 14;

export default function AdminDashboard() {
  const totalTicketsQuery = useQuery({
    queryKey: ["admin", "tickets", "countAll"],
    queryFn: () =>
      ticketApi.getAllTickets({ page: 0, size: 1 }).then((r) => r.data),
  });

  const openTicketsQuery = useQuery({
    queryKey: ["admin", "tickets", "countOpen"],
    queryFn: () =>
      ticketApi
        .getAllTickets({ status: "OPEN", page: 0, size: 1 })
        .then((r) => r.data),
  });

  const inProgressTicketsQuery = useQuery({
    queryKey: ["admin", "tickets", "countInProgress"],
    queryFn: () =>
      ticketApi
        .getAllTickets({ status: "IN_PROGRESS", page: 0, size: 1 })
        .then((r) => r.data),
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users", "count"],
    queryFn: fetchUsers,
  });

  const facilitiesQuery = useQuery({
    queryKey: ["admin", "facilities", "count"],
    queryFn: () => facilityApi.getAllFacilities({ page: 0, size: 1 })
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
      <div className="grid gap-4 sm:grid-cols-3 lg:gap-6">
        <DashboardStatCard
          label="Total bookings"
          value={TOTAL_BOOKINGS_SAMPLE}
          hint="Sample aggregate — wire bookings API when ready"
        />
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
      </div>

      <div className="mt-12 border-t border-slate-200/90 pt-10">
        <AdminTechnicianPanel />
      </div>
    </DashboardPageLayout>
  );
}
