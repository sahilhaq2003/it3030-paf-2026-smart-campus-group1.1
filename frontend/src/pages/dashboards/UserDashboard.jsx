import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, Ticket } from "lucide-react";
import { ticketApi } from "../../api/ticketApi";
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

  const content = data?.content;
  const totalFromApi = data?.totalElements;
  const { list, open, inProgress, resolved } = summarizeMyTickets(content);
  const total = typeof totalFromApi === "number" ? totalFromApi : list.length;

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

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/tickets" className={dashboardBtnSecondary}>
          Open ticket list
        </Link>
        <Link to="/tickets/create" className={dashboardBtnSecondary}>
          Report an issue
        </Link>
      </div>
    </DashboardPageLayout>
  );
}
