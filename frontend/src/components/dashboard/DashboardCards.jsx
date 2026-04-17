import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronRight } from "lucide-react";
import { ticketApi } from "../../api/ticketApi";
import {
  campusBtnPrimary,
  campusInputFocus,
  campusTextLink,
  dashboardCardShell,
} from "./DashboardPrimitives";
import { ticketStatusLabel } from "../../utils/ticketStatusDisplay";

/**
 * Primary summary panel: icon, title, optional action, body.
 */
export function DashboardSummaryCard({
  title,
  description,
  icon: Icon,
  headerAction,
  children,
}) {
  return (
    <section className={`${dashboardCardShell} p-6 sm:p-7`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {Icon ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-gradient-to-br from-campus-brand-soft/90 to-white/70 text-campus-brand shadow-inner shadow-slate-900/[0.06] ring-1 ring-campus-brand-muted/35 backdrop-blur-sm">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
            ) : null}
          </div>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Compact metric inside a summary card */
export function DashboardSummaryStat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-white/55 bg-white/45 px-4 py-3.5 ring-1 ring-white/35 backdrop-blur-md transition hover:border-white/75 hover:bg-white/60">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function DashboardSummaryStatGrid({ children, columnsClass = "sm:grid-cols-3" }) {
  return <div className={`grid gap-3 ${columnsClass}`}>{children}</div>;
}

/** Inline error / empty helpers */
export function DashboardInlineMessage({ variant = "muted", children }) {
  const cls =
    variant === "error" ? "text-sm font-medium text-red-600" : "text-sm leading-relaxed text-slate-500";
  return <p className={cls}>{children}</p>;
}

const inputClass = `w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-slate-900 shadow-sm shadow-slate-900/[0.04] backdrop-blur-md ${campusInputFocus}`;

/** Scrollable ticket rows with optional “View all” */
export function DashboardTicketList({
  tickets,
  isLoading,
  error,
  emptyText = "Nothing to show yet.",
  viewAllHref = "/tickets",
  viewAllLabel = "View all tickets",
  maxRows = 6,
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[3.25rem] animate-pulse rounded-xl bg-slate-100/90" />
        ))}
      </div>
    );
  }

  if (error) {
    const msg =
      error.response?.data?.message ||
      (typeof error.response?.data === "string" ? error.response.data : null) ||
      error.message ||
      "Could not load tickets.";
    return <DashboardInlineMessage variant="error">{msg}</DashboardInlineMessage>;
  }

  const rows = (tickets || []).slice(0, maxRows);

  if (!rows.length) {
    return <DashboardInlineMessage>{emptyText}</DashboardInlineMessage>;
  }

  return (
    <div>
      <ul className="divide-y divide-slate-200/40 overflow-hidden rounded-xl border border-white/55 bg-white/50 ring-1 ring-white/35 backdrop-blur-md">
        {rows.map((t) => (
          <li key={t.id}>
            <Link
              to={`/tickets/${t.id}`}
              className="group flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-campus-brand/5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900 transition group-hover:text-campus-brand-hover">
                  {t.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  <span className="tabular-nums text-slate-600">#{t.id}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span>{ticketStatusLabel(t)}</span>
                  {t.priority ? (
                    <>
                      <span className="mx-1.5 text-slate-300">·</span>
                      {t.priority}
                    </>
                  ) : null}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-campus-brand" />
            </Link>
          </li>
        ))}
      </ul>
      {viewAllHref ? (
        <Link
          to={viewAllHref}
          className={`mt-4 inline-flex items-center gap-0.5 text-sm ${campusTextLink}`}
        >
          {viewAllLabel}
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      ) : null}
    </div>
  );
}

/** Valid next statuses from current (must match server TicketServiceImpl.validateStatusTransition). */
function allowedNextStatuses(current, isAdminWorkflow) {
  if (!current) return [];
  switch (current) {
    case "OPEN":
      return ["IN_PROGRESS", "REJECTED"];
    case "IN_PROGRESS":
      return ["RESOLVED", "REJECTED"];
    case "RESOLVED":
      return isAdminWorkflow ? ["CLOSED"] : [];
    case "CLOSED":
    case "REJECTED":
    default:
      return [];
  }
}

/**
 * Technician / admin: pick assigned ticket and push a new status.
 * Technicians use Resolved (closes automatically); they cannot pick CLOSED directly.
 */
export function DashboardStatusUpdateCard({ tickets, isLoading, isAdminWorkflow = true }) {
  const qc = useQueryClient();
  const [ticketId, setTicketId] = useState("");
  const [status, setStatus] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const options = useMemo(() => tickets || [], [tickets]);
  const selectedTicket = useMemo(
    () => options.find((t) => String(t.id) === String(ticketId)),
    [options, ticketId],
  );
  const allowed = useMemo(
    () => allowedNextStatuses(selectedTicket?.status, isAdminWorkflow),
    [selectedTicket?.status, isAdminWorkflow],
  );

  useEffect(() => {
    if (!ticketId || !selectedTicket) {
      setStatus("");
      return;
    }
    const next = allowedNextStatuses(selectedTicket.status, isAdminWorkflow);
    if (!next.length) {
      setStatus("");
      return;
    }
    setStatus((prev) => (next.includes(prev) ? prev : next[0]));
  }, [ticketId, selectedTicket?.id, selectedTicket?.status, isAdminWorkflow]);

  const mutation = useMutation({
    mutationFn: async () => {
      const id = Number(ticketId);
      const body = { status };
      if (status === "RESOLVED") {
        body.resolutionNotes = resolutionNotes.trim();
      }
      if (status === "REJECTED") {
        body.rejectionReason = rejectionReason.trim();
      }
      const { data } = await ticketApi.updateStatus(id, body);
      return data;
    },
    onSuccess: () => {
      toast.success("Ticket status updated");
      qc.invalidateQueries({ queryKey: ["dashboard", "assignedTickets"] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
      qc.invalidateQueries({ queryKey: ["ticket"] });
      setResolutionNotes("");
      setRejectionReason("");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Update failed";
      toast.error(typeof msg === "string" ? msg : "Update failed");
    },
  });

  if (isLoading) {
    return (
      <DashboardSummaryCard title="Update ticket status" description="Loading…">
        <div className="h-28 animate-pulse rounded-xl bg-slate-100/90" />
      </DashboardSummaryCard>
    );
  }

  if (!options.length) {
    return (
      <DashboardSummaryCard
        title="Update ticket status"
        description="Change workflow state on a ticket assigned to you."
      >
        <DashboardInlineMessage>
          No assigned tickets — status updates will appear when you have work in your queue.
        </DashboardInlineMessage>
      </DashboardSummaryCard>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ticketId) {
      toast.error("Select a ticket");
      return;
    }
    if (!allowed.length) {
      toast.error("No status changes are available for this ticket from here.");
      return;
    }
    if (!allowed.includes(status)) {
      toast.error("Pick a valid next status for the ticket’s current state.");
      return;
    }
    if (status === "RESOLVED" && !resolutionNotes.trim()) {
      toast.error("Resolution notes are required for RESOLVED");
      return;
    }
    if (status === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Rejection reason is required for REJECTED");
      return;
    }
    mutation.mutate();
  };

  return (
    <DashboardSummaryCard
      title="Update ticket status"
      description={
        isAdminWorkflow
          ? "Select a ticket and move it through the workflow (Resolved closes the ticket automatically)."
          : "Use Resolved with notes to finish a ticket — it closes automatically. You cannot set Closed directly."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Ticket
          </label>
          <select value={ticketId} onChange={(e) => setTicketId(e.target.value)} className={`mt-1.5 ${inputClass}`}>
            <option value="">Choose ticket…</option>
            {options.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.id} — {t.title?.slice(0, 50)}
                {t.title?.length > 50 ? "…" : ""} ({t.status})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            New status
          </label>
          {!ticketId ? (
            <p className="mt-1.5 text-sm text-slate-500">Select a ticket first.</p>
          ) : !allowed.length ? (
            <p className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              This ticket is already finished or has no transitions from here (e.g. closed or rejected).
            </p>
          ) : (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            >
              {allowed.map((s) => (
                <option key={s} value={s}>
                  {s === "RESOLVED" ? "Resolved (closes ticket)" : s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          )}
        </div>
        {status === "RESOLVED" ? (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Resolution notes (required)
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              className={`mt-1.5 ${inputClass}`}
              placeholder="What was done to resolve the issue?"
            />
          </div>
        ) : null}
        {status === "REJECTED" ? (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Rejection reason (required)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              className={`mt-1.5 ${inputClass}`}
              placeholder="Why is this ticket rejected?"
            />
          </div>
        ) : null}
        <button
          type="submit"
          disabled={mutation.isPending || !ticketId || !allowed.length}
          className={`w-full py-3 text-sm ${campusBtnPrimary}`}
        >
          {mutation.isPending ? "Saving…" : "Apply status update"}
        </button>
      </form>
    </DashboardSummaryCard>
  );
}
