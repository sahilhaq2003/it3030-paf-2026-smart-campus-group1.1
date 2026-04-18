import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ticketApi } from "../../api/ticketApi";
import {
  DashboardPageLayout,
  DashboardStatCard,
  campusTextLink,
} from "../../components/dashboard/DashboardPrimitives";
import {
  DashboardSummaryCard,
  DashboardTicketList,
  DashboardStatusUpdateCard,
} from "../../components/dashboard/DashboardCards";
import { Wrench } from "lucide-react";

function summarizeAssigned(content) {
  const list = content || [];
  const open = list.filter((t) => t.status === "OPEN").length;
  const inProgress = list.filter((t) => t.status === "IN_PROGRESS").length;
  const resolved = list.filter(
    (t) =>
      t.status === "RESOLVED" ||
      (t.status === "CLOSED" && (t.resolutionNotes || t.resolvedAt)),
  ).length;
  return { list, open, inProgress, resolved, active: open + inProgress };
}

export default function TechnicianDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "assignedTickets"],
    queryFn: () =>
      ticketApi
        .getAssignedTickets({ page: 0, size: 100, sort: "createdAt,desc" })
        .then((r) => r.data),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
  });

  const content = data?.content;
  const totalElements = data?.totalElements;
  const { list, open, inProgress, resolved, active } = summarizeAssigned(content);
  const total = typeof totalElements === "number" ? totalElements : list.length;

  return (
    <DashboardPageLayout
      eyebrow="Technician · Dashboard"
      title="Field work queue"
      subtitle="Tickets assigned to you. Update status as work progresses — invalid transitions are rejected by the server."
    >
      <div className="grid gap-4 sm:grid-cols-3 lg:gap-6">
        <DashboardStatCard
          label="Assigned total"
          value={isLoading ? "…" : total}
          hint="All items in your queue"
        />
        <DashboardStatCard
          label="Active work"
          value={isLoading ? "…" : active}
          hint="OPEN + IN_PROGRESS"
        />
        <DashboardStatCard
          label="Resolved (loaded page)"
          value={isLoading ? "…" : resolved}
          hint="In this result set"
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <DashboardSummaryCard
          title="Assigned tickets"
          description="Newest first. Open a row to see full detail and attachments."
          icon={Wrench}
          headerAction={
            <Link to="/admin/tickets" className={`text-sm ${campusTextLink}`}>
              Admin ticket desk
            </Link>
          }
        >
          <DashboardTicketList
            tickets={list}
            isLoading={isLoading}
            error={error}
            emptyText="No tickets are assigned to you right now."
            viewAllHref="/admin/tickets"
            viewAllLabel="Open admin ticket desk"
            maxRows={8}
          />
          <p className="mt-3 text-xs text-slate-400">
            Open: {open} · In progress: {inProgress}
            {isLoading ? "" : null}
          </p>
        </DashboardSummaryCard>

        <DashboardStatusUpdateCard tickets={list} isLoading={isLoading} isAdminWorkflow={false} />
      </div>
    </DashboardPageLayout>
  );
}
