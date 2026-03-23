import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  DashboardPageLayout,
  campusInputFocus,
  campusBtnPrimary,
} from "../../components/dashboard/DashboardPrimitives";
import StatusBadge from "../../components/StatusBadge";
import { Search, ChevronRight } from "lucide-react";
import { ticketApi } from "../../api/ticketApi";
import { fetchTechnicians } from "../../api/userAdminApi";
import { useAuth } from "../../context/AuthContext";
import { normalizeRoles } from "../../utils/getDashboardRoute";
import { isResolvedLikeTicket } from "../../utils/ticketStatusDisplay";

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
}

export default function AdminTicketsPage() {
  const { user } = useAuth();
  const roleSet = normalizeRoles(user?.roles ?? (user?.role != null ? [user.role] : []));
  const isAdmin = roleSet.has("ADMIN");

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selected, setSelected] = useState([]);
  const [sortBy, setSortBy] = useState("created");
  const [bulkTechId, setBulkTechId] = useState("");
  const [rowTechPick, setRowTechPick] = useState({});

  const ticketsQuery = useQuery({
    queryKey: ["admin", "tickets", "list"],
    queryFn: () =>
      ticketApi.getAllTickets({ page: 0, size: 500, sort: "createdAt,desc" }).then((r) => r.data),
  });

  const techniciansQuery = useQuery({
    queryKey: ["admin", "technicians"],
    queryFn: fetchTechnicians,
    enabled: isAdmin,
  });

  const tickets = ticketsQuery.data?.content ?? [];
  const technicians = techniciansQuery.data ?? [];

  const assignMutation = useMutation({
    mutationFn: ({ ticketId, technicianId }) =>
      ticketApi.assignTechnician(ticketId, technicianId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "assignedTickets"] });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Assignment failed";
      toast.error(typeof msg === "string" ? msg : "Assignment failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ticketId) => ticketApi.deleteTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
    onError: () => toast.error("Delete failed"),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ ticketId, resolutionNotes }) =>
      ticketApi.updateStatus(ticketId, { status: "RESOLVED", resolutionNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
    },
    onError: () => toast.error("Could not resolve ticket"),
  });

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
      if (searchTerm && !t.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    if (sortBy === "created") {
      result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "priority") {
      result = [...result].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    }

    return result;
  }, [tickets, searchTerm, statusFilter, priorityFilter, sortBy]);

  const stats = useMemo(() => {
    return [
      { label: "Total", value: tickets.length, tone: "border-slate-200 bg-slate-50", icon: "📊" },
      {
        label: "In progress",
        value: tickets.filter((t) => t.status === "IN_PROGRESS").length,
        tone: "border-blue-200 bg-blue-50",
        icon: "⏳",
      },
      {
        label: "Unassigned",
        value: tickets.filter((t) => !t.assignedToId).length,
        tone: "border-amber-200 bg-amber-50",
        icon: "👤",
      },
      {
        label: "Resolved",
        value: tickets.filter(
          (t) =>
            t.status === "RESOLVED" ||
            (t.status === "CLOSED" && (t.resolutionNotes || t.resolvedAt)),
        ).length,
        tone: "border-emerald-200 bg-emerald-50",
        icon: "✅",
      },
    ];
  }, [tickets]);

  const priorityColors = {
    CRITICAL: "bg-red-50 text-red-700",
    HIGH: "bg-orange-50 text-orange-700",
    MEDIUM: "bg-amber-50 text-amber-800",
    LOW: "bg-green-50 text-green-700",
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.length === filtered.length ? [] : filtered.map((t) => t.id),
    );
  };

  const handleBulkAssign = async () => {
    const techId = Number(bulkTechId);
    if (!techId || selected.length === 0) {
      toast.error("Select tickets and a technician");
      return;
    }
    try {
      await Promise.all(selected.map((id) => assignMutation.mutateAsync({ ticketId: id, technicianId: techId })));
      toast.success(`Assigned ${selected.length} ticket(s)`);
      setSelected([]);
      setBulkTechId("");
    } catch {
      /* toast from mutation */
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} ticket(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selected.map((id) => deleteMutation.mutateAsync(id)));
      toast.success("Deleted");
      setSelected([]);
    } catch {
      /* toast */
    }
  };

  const handleBulkResolve = async () => {
    const eligible = selected.filter((id) => {
      const t = tickets.find((x) => x.id === id);
      return t?.status === "IN_PROGRESS";
    });
    if (eligible.length === 0) {
      toast.error(
        "Only tickets in IN_PROGRESS can be resolved. Assign a technician first (OPEN → IN_PROGRESS).",
      );
      return;
    }
    if (eligible.length < selected.length) {
      toast(`Resolving ${eligible.length} IN_PROGRESS ticket(s); others skipped.`);
    }
    const note = window.prompt("Resolution notes (required for all selected tickets):");
    if (!note?.trim()) {
      toast.error("Resolution notes are required");
      return;
    }
    try {
      await Promise.all(
        eligible.map((id) =>
          resolveMutation.mutateAsync({ ticketId: id, resolutionNotes: note.trim() }),
        ),
      );
      toast.success("Tickets resolved");
      setSelected([]);
    } catch {
      /* toast */
    }
  };

  const assignRow = (ticketId) => {
    const raw = rowTechPick[ticketId];
    const techId = Number(raw);
    if (!techId) {
      toast.error("Choose a technician");
      return;
    }
    assignMutation.mutate(
      { ticketId, technicianId: techId },
      {
        onSuccess: () => toast.success("Ticket assigned"),
      },
    );
  };

  const inputClass = `rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ${campusInputFocus}`;
  const selectSm = `${inputClass} py-2 text-xs`;

  const loadError = ticketsQuery.error;
  const errMsg =
    loadError &&
    (loadError.response?.data?.message ||
      (typeof loadError.response?.data === "string" ? loadError.response.data : null) ||
      "Could not load tickets");

  return (
    <DashboardPageLayout
      eyebrow="Admin · Tickets"
      title="All tickets"
      subtitle={
        isAdmin
          ? "Assign technicians, update status, and triage campus maintenance requests."
          : "Review tickets and move assigned work through the workflow. Only admins can assign technicians or delete tickets."
      }
    >
      {errMsg ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errMsg}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-4 shadow-sm transition hover:shadow-md ${stat.tone}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {ticketsQuery.isLoading ? "…" : stat.value}
                </p>
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
              disabled={ticketsQuery.isLoading}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={inputClass}
            disabled={ticketsQuery.isLoading}
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={inputClass}
            disabled={ticketsQuery.isLoading}
          >
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
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <p className="font-semibold text-slate-900">{selected.length} ticket(s) selected</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {isAdmin ? (
              <>
                <select
                  value={bulkTechId}
                  onChange={(e) => setBulkTechId(e.target.value)}
                  className={`min-w-[12rem] ${inputClass}`}
                >
                  <option value="">Assign to technician…</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleBulkAssign}
                  disabled={assignMutation.isPending || !bulkTechId}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:bg-campus-brand-hover disabled:opacity-50 ${campusBtnPrimary}`}
                >
                  Assign
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={handleBulkResolve}
              disabled={resolveMutation.isPending}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
            >
              Resolve
            </button>
            {isAdmin ? (
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      )}

      <p className="mt-6 text-sm font-medium text-slate-600">
        {ticketsQuery.isLoading
          ? "Loading tickets…"
          : `Showing ${filtered.length} of ${tickets.length} tickets`}
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {ticketsQuery.isLoading ? (
          <div className="space-y-0 divide-y divide-slate-200 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-lg text-slate-500">No tickets found.</div>
        ) : (
          <div className="divide-y divide-slate-200 overflow-x-auto">
            <div
              className={`flex items-center gap-3 border-b border-slate-200 bg-slate-50 p-4 ${isAdmin ? "min-w-[56rem]" : "min-w-[48rem]"}`}
            >
              <input
                type="checkbox"
                checked={selected.length === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
              />
              <div className="grid flex-1 grid-cols-12 gap-2 text-xs font-bold text-slate-700">
                <div className="col-span-1">ID</div>
                <div className={isAdmin ? "col-span-3" : "col-span-4"}>Title</div>
                <div className="col-span-2">Status</div>
                <div className={isAdmin ? "col-span-2" : "col-span-3"}>Assigned</div>
                {isAdmin ? <div className="col-span-2">Assign to</div> : null}
                <div className="col-span-2">Priority</div>
              </div>
            </div>

            {filtered.map((ticket) => (
              <div
                key={ticket.id}
                className={`group flex items-center gap-3 p-4 transition-colors hover:bg-slate-50 ${isAdmin ? "min-w-[56rem]" : "min-w-[48rem]"}`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(ticket.id)}
                  onChange={() => toggleSelect(ticket.id)}
                />
                <div className="grid flex-1 grid-cols-12 items-center gap-2">
                  <div className="col-span-1">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                      #{ticket.id}
                    </span>
                  </div>
                  <div className={`min-w-0 ${isAdmin ? "col-span-3" : "col-span-4"}`}>
                    <button
                      type="button"
                      className="text-left font-semibold text-slate-900 transition hover:text-campus-brand-hover"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      {ticket.title}
                    </button>
                    <p className="truncate text-xs text-slate-500">
                      {ticket.reportedByName ?? "Reporter"} · {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <StatusBadge
                      status={ticket.status}
                      resolutionNotes={ticket.resolutionNotes}
                      resolvedAt={ticket.resolvedAt}
                    />
                  </div>
                  <div
                    className={`text-xs font-medium text-slate-800 ${isAdmin ? "col-span-2" : "col-span-3"}`}
                  >
                    {ticket.assignedToName ? (
                      <span className="rounded-lg bg-slate-100 px-2 py-1">{ticket.assignedToName}</span>
                    ) : (
                      <span className="rounded-lg bg-amber-100 px-2 py-1 text-amber-900">Unassigned</span>
                    )}
                  </div>
                  {isAdmin ? (
                    <div className="col-span-2 flex flex-wrap items-center gap-1">
                      <select
                        value={rowTechPick[ticket.id] ?? ""}
                        onChange={(e) =>
                          setRowTechPick((p) => ({ ...p, [ticket.id]: e.target.value }))
                        }
                        className={selectSm}
                      >
                        <option value="">Select…</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => assignRow(ticket.id)}
                        disabled={assignMutation.isPending}
                        className="rounded-lg bg-slate-800 px-2 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                      >
                        Set
                      </button>
                    </div>
                  ) : null}
                  <div
                    className={`col-span-2 w-fit rounded-md px-2 py-1 text-xs font-bold ${priorityColors[ticket.priority]}`}
                  >
                    {ticket.priority}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardPageLayout>
  );
}
