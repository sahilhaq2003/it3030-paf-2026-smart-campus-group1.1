import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DashboardPageLayout,
  campusInputFocus,
} from "../../components/dashboard/DashboardPrimitives";
import StatusBadge from "../../components/StatusBadge";
import { Search, ChevronRight } from "lucide-react";

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selected, setSelected] = useState([]);
  const [sortBy, setSortBy] = useState("created");

  const tickets = [
    { id: "TCK-001", title: "Network Issue", status: "IN_PROGRESS", priority: "CRITICAL", assignedTo: "Tech A", reporter: "John D", created: "2026-03-07" },
    { id: "TCK-002", title: "Broken Chair", status: "REJECTED", priority: "LOW", assignedTo: "Tech B", reporter: "Jane S", created: "2026-03-05" },
    { id: "TCK-003", title: "AC Maintenance", status: "OPEN", priority: "HIGH", assignedTo: null, reporter: "Mike P", created: "2026-03-06" },
    { id: "TCK-004", title: "WiFi Setup", status: "RESOLVED", priority: "MEDIUM", assignedTo: "Tech C", reporter: "Sarah L", created: "2026-03-01" },
    { id: "TCK-005", title: "Door Lock", status: "IN_PROGRESS", priority: "HIGH", assignedTo: "Tech A", reporter: "Bob M", created: "2026-03-04" },
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
    }

    return result;
  }, [searchTerm, statusFilter, priorityFilter, sortBy]);

  const stats = [
    { label: "Total", value: tickets.length, tone: "border-slate-200 bg-slate-50", icon: "📊" },
    { label: "In progress", value: tickets.filter((t) => t.status === "IN_PROGRESS").length, tone: "border-blue-200 bg-blue-50", icon: "⏳" },
    { label: "Unassigned", value: tickets.filter((t) => !t.assignedTo).length, tone: "border-amber-200 bg-amber-50", icon: "👤" },
    { label: "Resolved", value: tickets.filter((t) => t.status === "RESOLVED").length, tone: "border-emerald-200 bg-emerald-50", icon: "✅" },
  ];

  const priorityColors = {
    CRITICAL: "bg-red-50 text-red-700",
    HIGH: "bg-orange-50 text-orange-700",
    MEDIUM: "bg-amber-50 text-amber-800",
    LOW: "bg-green-50 text-green-700",
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((t) => t.id)));
  };

  const bulkDelete = () => {
    if (window.confirm(`Delete ${selected.length} ticket(s)?`)) {
      setSelected([]);
      alert("Tickets deleted!");
    }
  };

  const bulkAssign = () => {
    const tech = prompt("Assign to technician:");
    if (tech) {
      setSelected([]);
      alert(`Assigned to ${tech}!`);
    }
  };

  const bulkStatus = () => {
    setSelected([]);
    alert(`${selected.length} ticket(s) status updated!`);
  };

  const inputClass = `rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ${campusInputFocus}`;

  return (
    <DashboardPageLayout
      eyebrow="Admin · Tickets"
      title="All tickets"
      subtitle="Review and manage facility requests across campus."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-4 shadow-sm transition hover:shadow-md ${stat.tone}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
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
            <option value="REJECTED">Rejected</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={inputClass}>
            <option value="ALL">All priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-sm font-medium text-slate-600">Sort by:</span>
          {[
            ["created", "Date"],
            ["priority", "Priority"],
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

      {selected.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-slate-900">{selected.length} ticket(s) selected</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={bulkAssign}
              className="rounded-lg bg-campus-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-campus-brand-hover"
            >
              Assign
            </button>
            <button
              type="button"
              onClick={() => bulkStatus()}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              Resolve
            </button>
            <button
              type="button"
              onClick={bulkDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-sm font-medium text-slate-600">
        Showing {filtered.length} of {tickets.length} tickets
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-lg text-slate-500">No tickets found.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={selected.length === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
              />
              <div className="grid flex-1 grid-cols-5 gap-4 text-xs font-bold text-slate-700">
                <div>Ticket ID</div>
                <div>Title</div>
                <div>Status</div>
                <div>Assigned to</div>
                <div>Priority</div>
              </div>
            </div>

            {filtered.map((ticket) => (
              <div
                key={ticket.id}
                className="group flex items-center gap-3 p-4 transition-colors hover:bg-slate-50"
              >
                <input type="checkbox" checked={selected.includes(ticket.id)} onChange={() => toggleSelect(ticket.id)} />
                <div className="grid flex-1 grid-cols-5 items-center gap-4">
                  <div className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{ticket.id}</div>
                  <div>
                    <button
                      type="button"
                      className="text-left font-semibold text-slate-900 transition hover:text-campus-brand-hover"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      {ticket.title}
                    </button>
                    <p className="text-xs text-slate-500">{ticket.reporter}</p>
                  </div>
                  <div>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {ticket.assignedTo ? (
                      <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
                        {ticket.assignedTo}
                      </span>
                    ) : (
                      <span className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">Unassigned</span>
                    )}
                  </div>
                  <div className={`w-fit rounded-md px-2 py-1 text-xs font-bold ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-campus-brand" />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardPageLayout>
  );
}
