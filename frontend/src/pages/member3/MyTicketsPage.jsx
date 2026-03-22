import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DashboardPageLayout,
  campusBtnPrimary,
  campusInputFocus,
} from "../../components/dashboard/DashboardPrimitives";
import StatusBadge from "../../components/StatusBadge";
import { Search, Clock, CheckCircle, ChevronRight, AlertCircle } from "lucide-react";

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("created");

  const tickets = [
    { id: "TCK-001", title: "Broken Projector in Lab 3", status: "OPEN", priority: "HIGH", category: "EQUIPMENT", created: "2026-03-07", daysOpen: 1 },
    { id: "TCK-002", title: "Leaky Faucet - Bathroom B1", status: "IN_PROGRESS", priority: "MEDIUM", category: "PLUMBING", created: "2026-03-05", daysOpen: 3 },
    { id: "TCK-003", title: "WiFi Down - Conference Room", status: "RESOLVED", priority: "CRITICAL", category: "IT", created: "2026-03-01", daysOpen: 7 },
    { id: "TCK-004", title: "Light Flickering - Corridor 2", status: "OPEN", priority: "LOW", category: "ELECTRICAL", created: "2026-03-06", daysOpen: 2 },
    { id: "TCK-005", title: "AC Not Cooling - Lab 5", status: "IN_PROGRESS", priority: "HIGH", category: "EQUIPMENT", created: "2026-03-04", daysOpen: 4 },
  ];

  const filtered = useMemo(() => {
    let result = tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    if (sortBy === "created") result.sort((a, b) => new Date(b.created) - new Date(a.created));
    else if (sortBy === "priority") {
      result.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    } else if (sortBy === "daysOpen") result.sort((a, b) => b.daysOpen - a.daysOpen);

    return result;
  }, [searchTerm, statusFilter, priorityFilter, sortBy]);

  const stats = [
    { label: "Open", value: tickets.filter((t) => t.status === "OPEN").length, icon: <AlertCircle className="h-5 w-5 text-red-500" />, color: "border-red-200 bg-red-50" },
    { label: "In Progress", value: tickets.filter((t) => t.status === "IN_PROGRESS").length, icon: <Clock className="h-5 w-5 text-slate-600" />, color: "border-slate-200 bg-slate-50" },
    { label: "Resolved", value: tickets.filter((t) => t.status === "RESOLVED").length, icon: <CheckCircle className="h-5 w-5 text-emerald-600" />, color: "border-emerald-200 bg-emerald-50" },
  ];

  const priorityColors = {
    CRITICAL: "bg-red-50 text-red-700",
    HIGH: "bg-orange-50 text-orange-700",
    MEDIUM: "bg-amber-50 text-amber-800",
    LOW: "bg-green-50 text-green-700",
  };

  const inputClass = `rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition ${campusInputFocus}`;

  return (
    <DashboardPageLayout
      eyebrow="Tickets"
      title="My tickets"
      subtitle="Track and manage your facility maintenance requests."
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
                <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{stat.value}</p>
              </div>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

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
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={inputClass}>
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
        Showing {filtered.length} of {tickets.length} tickets
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No tickets match your filters.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filtered.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="group flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {ticket.id}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="font-semibold text-slate-900 transition group-hover:text-campus-brand-hover">{ticket.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {ticket.category} · Open {ticket.daysOpen} {ticket.daysOpen === 1 ? "day" : "days"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <button type="button" onClick={() => navigate("/tickets/create")} className={`px-6 py-3 text-sm ${campusBtnPrimary}`}>
          + Create new ticket
        </button>
      </div>
    </DashboardPageLayout>
  );
}
