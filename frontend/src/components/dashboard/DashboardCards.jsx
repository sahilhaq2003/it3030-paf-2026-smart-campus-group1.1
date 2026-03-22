import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronRight } from "lucide-react";
import { ticketApi } from "../../api/ticketApi";

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
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A5F]">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
            ) : null}
          </div>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Compact metric inside a summary card */
export function DashboardSummaryStat({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function DashboardSummaryStatGrid({ children, columnsClass = "sm:grid-cols-3" }) {
  return (
    <div className={`grid gap-3 ${columnsClass}`}>{children}</div>
  );
}

/** Inline error / empty helpers */
export function DashboardInlineMessage({ variant = "muted", children }) {
  const cls =
    variant === "error"
      ? "text-sm text-red-600"
      : "text-sm text-slate-500";
  return <p className={cls}>{children}</p>;
}

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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg bg-slate-100"
          />
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
    return (
      <DashboardInlineMessage variant="error">{msg}</DashboardInlineMessage>
    );
  }

  const rows = (tickets || []).slice(0, maxRows);

  if (!rows.length) {
    return <DashboardInlineMessage>{emptyText}</DashboardInlineMessage>;
  }

  return (
    <div>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
        {rows.map((t) => (
          <li key={t.id}>
            <Link
              to={`/tickets/${t.id}`}
              className="flex items-center justify-between gap-3 px-3 py-3 transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{t.title}</p>
                <p className="text-xs text-slate-500">
                  #{t.id} · {t.status}
                  {t.priority ? ` · ${t.priority}` : ""}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          </li>
        ))}
      </ul>
      {viewAllHref ? (
        <Link
          to={viewAllHref}
          className="mt-3 inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          {viewAllLabel}
          <ChevronRight className="ml-0.5 h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

const STATUS_OPTIONS = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];

/**
 * Technician / admin: pick assigned ticket and push a new status.
 */
export function DashboardStatusUpdateCard({ tickets, isLoading }) {
  const qc = useQueryClient();
  const [ticketId, setTicketId] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const options = useMemo(() => tickets || [], [tickets]);

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
        <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
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
      description="Select a ticket you are assigned to and move it through the workflow."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ticket
          </label>
          <select
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
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
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            New status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        {status === "RESOLVED" ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Resolution notes (required)
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What was done to resolve the issue?"
            />
          </div>
        ) : null}
        {status === "REJECTED" ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rejection reason (required)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Why is this ticket rejected?"
            />
          </div>
        ) : null}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#162d4a] disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : "Apply status update"}
        </button>
      </form>
    </DashboardSummaryCard>
  );
}
