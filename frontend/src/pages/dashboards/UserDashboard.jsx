import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, Ticket, Building, MapPin, Users, Loader2 } from "lucide-react";
import { ticketApi } from "../../api/ticketApi";
import { facilityApi } from "../../api/facilityApi";
import {
  DashboardPageLayout,
  campusTextLink,
  dashboardBtnSecondary,
} from "../../components/dashboard/DashboardPrimitives";
import {
  DashboardSummaryCard,
  DashboardSummaryStat,
  DashboardSummaryStatGrid,
  DashboardTicketList,
} from "../../components/dashboard/DashboardCards";

/** Sample figures until a campus bookings API exists */
const BOOKINGS_PLACEHOLDER = {
  upcoming: 2,
  completedThisMonth: 5,
  cancelled: 0,
};

function summarizeMyTickets(content) {
  const list = content || [];
  const open = list.filter((t) => t.status === "OPEN").length;
  const inProgress = list.filter((t) => t.status === "IN_PROGRESS").length;
  const resolved = list.filter(
    (t) => t.status === "RESOLVED" || t.status === "CLOSED",
  ).length;
  return { list, open, inProgress, resolved };
}

export default function UserDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "myTickets"],
    queryFn: () =>
      ticketApi
        .getMyTickets({ page: 0, size: 100, sort: "createdAt,desc" })
        .then((r) => r.data),
  });

  const { data: facilitiesData, isLoading: facilitiesLoading } = useQuery({
    queryKey: ["dashboard", "featuredFacilities"],
    queryFn: () =>
      facilityApi
        .searchFacilities({ status: "ACTIVE", page: 0, size: 4 })
        .then((r) => r.data),
  });

  const content = data?.content;
  const totalFromApi = data?.totalElements;
  const { list, open, inProgress, resolved } = summarizeMyTickets(content);
  const total = typeof totalFromApi === "number" ? totalFromApi : list.length;
  const facilities = facilitiesData?.content || [];

  return (
    <DashboardPageLayout
      eyebrow="User · Dashboard"
      title="My campus overview"
      subtitle="Bookings and maintenance tickets in one place. Ticket counts load from your account; bookings show sample data until the facility API is linked."
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <DashboardSummaryCard
          title="My bookings"
          description="Rooms, labs, and shared spaces you have reserved."
          icon={Calendar}
          headerAction={
            <span className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
              Sample
            </span>
          }
        >
          <DashboardSummaryStatGrid>
            <DashboardSummaryStat
              label="Upcoming"
              value={BOOKINGS_PLACEHOLDER.upcoming}
              hint="Placeholder until bookings service is live"
            />
            <DashboardSummaryStat
              label="Completed (30 days)"
              value={BOOKINGS_PLACEHOLDER.completedThisMonth}
              hint="Historical placeholder"
            />
            <DashboardSummaryStat
              label="Cancelled"
              value={BOOKINGS_PLACEHOLDER.cancelled}
            />
          </DashboardSummaryStatGrid>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            Connect the bookings module to replace these figures with live reservations.
          </p>
        </DashboardSummaryCard>

        <DashboardSummaryCard
          title="My tickets"
          description="Maintenance requests you have reported or that mention you."
          icon={Ticket}
          headerAction={
            <Link to="/tickets/create" className={`text-sm ${campusTextLink}`}>
              + New ticket
            </Link>
          }
        >
          <DashboardSummaryStatGrid columnsClass="grid-cols-2 lg:grid-cols-4">
            <DashboardSummaryStat label="Total" value={isLoading ? "…" : total} />
            <DashboardSummaryStat label="Open" value={isLoading ? "…" : open} />
            <DashboardSummaryStat
              label="In progress"
              value={isLoading ? "…" : inProgress}
            />
            <DashboardSummaryStat
              label="Resolved / closed"
              value={isLoading ? "…" : resolved}
              hint="From loaded page"
            />
          </DashboardSummaryStatGrid>
          <div className="mt-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Recent tickets
            </p>
            <DashboardTicketList
              tickets={list}
              isLoading={isLoading}
              error={error}
              emptyText="You have not submitted any tickets yet."
              viewAllHref="/tickets"
            />
          </div>
        </DashboardSummaryCard>
      </div>

      <div className="mt-10">
        <DashboardSummaryCard
          title="Campus facilities"
          description="Explore and browse available facilities on campus."
          icon={Building}
          headerAction={
            <Link to="/facilities" className={`text-sm ${campusTextLink}`}>
              View all →
            </Link>
          }
        >
          {facilitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-400">Loading facilities...</span>
            </div>
          ) : facilities.length > 0 ? (
            <div className="space-y-3">
              {facilities.map((facility) => (
                <Link
                  key={facility.id}
                  to={`/facilities/${facility.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 text-sm hover:text-blue-600">
                        {facility.name}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 capitalize">
                        {facility.resourceType?.replace(/_/g, " ")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                        {facility.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {facility.location}
                          </div>
                        )}
                        {facility.capacity && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {facility.capacity} capacity
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="ml-3 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                      {facility.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">
              No facilities available at the moment.
            </p>
          )}
          <Link
            to="/facilities"
            className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Browse all facilities →
          </Link>
        </DashboardSummaryCard>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/tickets" className={dashboardBtnSecondary}>
          Open ticket list
        </Link>
        <Link to="/tickets/create" className={dashboardBtnSecondary}>
          Report an issue
        </Link>
        <Link to="/facilities" className={dashboardBtnSecondary}>
          Browse facilities
        </Link>
      </div>
    </DashboardPageLayout>
  );
}
