import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, Ticket } from "lucide-react";
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

const LECTURER_WORKPLACE_SAMPLE = {
  classesThisWeek: 4,
  pendingMaterialUpdates: 2,
  consultationSlots: 3,
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

export default function LecturerDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "lecturerTickets"],
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
      eyebrow="Lecturer · Dashboard"
      title="Lecturer workspace"
      subtitle="Track your maintenance requests and class support items in one place."
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <DashboardSummaryCard
          title="Teaching overview"
          description="Operational snapshot for your weekly lecturer workflow."
          icon={BookOpen}
          headerAction={
            <span className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
              Sample
            </span>
          }
        >
          <DashboardSummaryStatGrid>
            <DashboardSummaryStat
              label="Classes this week"
              value={LECTURER_WORKPLACE_SAMPLE.classesThisWeek}
              hint="Placeholder until class timetable API is linked"
            />
            <DashboardSummaryStat
              label="Pending material updates"
              value={LECTURER_WORKPLACE_SAMPLE.pendingMaterialUpdates}
              hint="Placeholder"
            />
            <DashboardSummaryStat
              label="Consultation slots"
              value={LECTURER_WORKPLACE_SAMPLE.consultationSlots}
              hint="Placeholder"
            />
          </DashboardSummaryStatGrid>
        </DashboardSummaryCard>

        <DashboardSummaryCard
          title="My tickets"
          description="Maintenance and service requests created by your lecturer account."
          icon={Ticket}
          headerAction={
            <Link to="/tickets/create" className={`text-sm ${campusTextLink}`}>
              + New ticket
            </Link>
          }
        >
          <DashboardSummaryStatGrid columnsClass="grid-cols-2 lg:grid-cols-4">
            <DashboardSummaryStat label="Total" value={isLoading ? "..." : total} />
            <DashboardSummaryStat label="Open" value={isLoading ? "..." : open} />
            <DashboardSummaryStat
              label="In progress"
              value={isLoading ? "..." : inProgress}
            />
            <DashboardSummaryStat
              label="Resolved / closed"
              value={isLoading ? "..." : resolved}
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
              emptyText="No lecturer tickets yet."
              viewAllHref="/tickets"
            />
          </div>
        </DashboardSummaryCard>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/tickets" className={dashboardBtnSecondary}>
          View my tickets
        </Link>
        <Link to="/tickets/create" className={dashboardBtnSecondary}>
          Report classroom issue
        </Link>
      </div>
    </DashboardPageLayout>
  );
}
