import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  DashboardPageLayout,
  campusBtnPrimary,
  campusInputFocus,
} from "../../components/dashboard/DashboardPrimitives";
import StatusBadge from "../../components/StatusBadge";
import TicketCard from "../../components/TicketCard";
import { Search, Clock, CheckCircle, ChevronRight, AlertCircle } from "lucide-react";
import { ticketApi } from "../../api/ticketApi";
import { isResolvedLikeTicket } from "../../utils/ticketStatusDisplay";
import { useAuth } from "../../context/AuthContext";
import { canCreateTickets } from "../../utils/getDashboardRoute";

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function daysOpenSince(createdAtIso) {
  if (!createdAtIso) return 0;
  const start = new Date(createdAtIso);
  if (Number.isNaN(start.getTime())) return 0;
  const diff = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("created");

  const { user } = useAuth();
  const roles = user?.roles ?? (user?.role != null ? [user.role] : []);
  const showCreateTicket = canCreateTickets(roles);

  const { data, isLoading, error } = useQuery({
    queryKey: ["tickets", "my"],
    queryFn: () =>
      ticketApi
        .getMyTickets({ page: 0, size: 200, sort: "createdAt,desc" })
        .then((r) => r.data),
  });

  const tickets = useMemo(() => {
    const raw = data?.content ?? [];
    return raw.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      category: t.category,
      createdAt: t.createdAt,
      daysOpen: daysOpenSince(t.createdAt),
      resolutionNotes: t.resolutionNotes,
      resolvedAt: t.resolvedAt,
    }));
  }, [data]);

  const filtered = useMemo(() => {
    let result = tickets.filter((t) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "RESOLVED") {
          if (!isResolvedLikeTicket(t)) return false;
        } else if (t.status !== statusFilter) {
          return false;
        }
      }
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    if (sortBy === "created") {
      result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "priority") {
      result = [...result].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    } else if (sortBy === "daysOpen") {
      result = [...result].sort((a, b) => b.daysOpen - a.daysOpen);
    }

    return result;
  }, [tickets, searchTerm, statusFilter, priorityFilter, sortBy]);

  const stats = useMemo(() => {
    const base = tickets;
    return [
      {
        label: "Open",
        value: base.filter((t) => t.status === "OPEN").length,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        color: "border-red-200 bg-red-50",
      },
      {
        label: "In Progress",
        value: base.filter((t) => t.status === "IN_PROGRESS").length,
        icon: <Clock className="h-5 w-5 text-slate-600" />,
        color: "border-slate-200 bg-slate-50",
      },
      {
        label: "Resolved",
        value: base.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length,
        icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
        color: "border-emerald-200 bg-emerald-50",
      },
    ];
  }, [tickets]);

  const priorityColors = {
    CRITICAL: "bg-red-50 text-red-700",
    HIGH: "bg-orange-50 text-orange-700",
    MEDIUM: "bg-amber-50 text-amber-800",
    LOW: "bg-green-50 text-green-700",
  };

  const inputClass = `rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition ${campusInputFocus}`;

  const errMsg =
    error &&
    (error.response?.data?.message ||
      (typeof error.response?.data === "string" ? error.response.data : null) ||
      error.message ||
      "Could not load your tickets.");

  return (
    <DashboardPageLayout
      eyebrow="Tickets"
      title="My tickets"
      subtitle={
        showCreateTicket
          ? "Requests tied to your signed-in account (including Google). Create tickets while logged in to see them here on your next visit."
          : "Tickets tied to your account. New requests are submitted by campus users through the user portal."
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-5 shadow-sm transition hover:shadow-md ${stat.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                  {isLoading ? "…" : stat.value}
                </p>
              </div>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {errMsg ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errMsg}
        </p>
      ) : null}

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 ${inputClass}`}
              disabled={isLoading}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={inputClass}
            disabled={isLoading}
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={inputClass}
            disabled={isLoading}
          >
            <option value="ALL">All priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="self-center text-sm text-slate-600">Sort by:</span>
          {[
            ["created", "Date"],
            ["priority", "Priority"],
            ["daysOpen", "Days open"],
          ].map(([option, label]) => (
            <button
              key={option}
              type="button"
              onClick={() => setSortBy(option)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                sortBy === option
                  ? "bg-campus-brand text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-600">
        {isLoading
          ? "Loading your tickets…"
          : `Showing ${filtered.length} of ${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="space-y-0 divide-y divide-slate-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 animate-pulse bg-slate-50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {tickets.length === 0
              ? showCreateTicket
                ? "You have no tickets yet. Create one to see it here whenever you sign in."
                : "No tickets in your list yet."
              : "No tickets match your filters."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>

      {showCreateTicket ? (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => navigate("/tickets/create")}
            className={`px-6 py-3 text-sm ${campusBtnPrimary}`}
          >
            + Create new ticket
          </button>
        </div>
      ) : null}
    </DashboardPageLayout>
  );
}
