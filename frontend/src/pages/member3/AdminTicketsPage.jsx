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
import TicketCard from "../../components/TicketCard";
import AssignTechnicianModal from "../../components/AssignTechnicianModal";
import ConfirmModal from "../../components/ConfirmModal";
import { Search, ChevronRight } from "lucide-react";
import { ticketApi } from "../../api/ticketApi";
import { fetchTechnicians } from "../../api/userAdminApi";
import { useAuth } from "../../context/AuthContext";
import { normalizeRoles } from "../../utils/getDashboardRoute";
import { isResolvedLikeTicket } from "../../utils/ticketStatusDisplay";
import { technicianCategoryLabel } from "../../constants/technicianCategories";

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
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState(null);
  const [isReassignMode, setIsReassignMode] = useState(false);
  const [reassignConfirmOpen, setReassignConfirmOpen] = useState(false);
  const [pendingReassignData, setPendingReassignData] = useState(null);
  const [perfSortBy, setPerfSortBy] = useState("ticketsResolved");
  const [perfSortOrder, setPerfSortOrder] = useState("desc");

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

  const performanceQuery = useQuery({
    queryKey: ["admin", "technician", "performance"],
    queryFn: () => ticketApi.getTechnicianPerformance().then((r) => r.data),
    enabled: isAdmin,
  });

  const tickets = ticketsQuery.data?.content ?? [];
  const technicians = techniciansQuery.data ?? [];
  const performanceData = performanceQuery.data ?? [];

  // Sort performance data
  const sortedPerformanceData = useMemo(() => {
    const data = [...performanceData];
    data.sort((a, b) => {
      let aVal, bVal;
      
      if (perfSortBy === "name") {
        aVal = a.technicianName.toLowerCase();
        bVal = b.technicianName.toLowerCase();
      } else if (perfSortBy === "ticketsResolved") {
        aVal = a.ticketsResolved ?? 0;
        bVal = b.ticketsResolved ?? 0;
      } else if (perfSortBy === "avgResolutionHours") {
        aVal = a.avgResolutionHours ?? Infinity;
        bVal = b.avgResolutionHours ?? Infinity;
      }
      
      if (perfSortOrder === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
    return data;
  }, [performanceData, perfSortBy, perfSortOrder]);

  const handlePerfSort = (sortByField) => {
    if (perfSortBy === sortByField) {
      // Toggle sort order if clicking the same column
      setPerfSortOrder(perfSortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field with descending order
      setPerfSortBy(sortByField);
      setPerfSortOrder("desc");
    }
  };

  const assignMutation = useMutation({
    mutationFn: ({ ticketId, technicianId }) =>
      ticketApi.assignTechnician(ticketId, technicianId).then((r) => r.data),
    onMutate: async ({ ticketId, technicianId }) => {
      // Cancel ongoing queries to prevent conflicts
      await queryClient.cancelQueries({ queryKey: ["admin", "tickets", "list"] });
      
      // Get the selected technician for the update
      const selectedTech = technicians.find(t => t.id === technicianId);
      
      // Snapshot previous data
      const previousTickets = queryClient.getQueryData(["admin", "tickets", "list"]);
      
      // Optimistically update the cache
      queryClient.setQueryData(["admin", "tickets", "list"], (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  assignedToId: technicianId,
                  assignedToName: selectedTech?.name || "Unknown",
                  status: "IN_PROGRESS",
                }
              : ticket
          ),
        };
      });
      
      return { previousTickets };
    },
    onSuccess: () => {
      // Refetch to ensure data consistency (without showing default toast)
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "assignedTickets"] });
    },
    onError: (err, variables, context) => {
      // Revert the optimistic update on error
      if (context?.previousTickets) {
        queryClient.setQueryData(["admin", "tickets", "list"], context.previousTickets);
      }
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
      queryClient.invalidateQueries({ queryKey: ["admin", "technician", "performance"] });
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

  const handleAssignModalSubmit = async (technicianId) => {
    if (!selectedTicketForAssign) return;
    
    const techId = Number(technicianId);
    if (!techId) {
      toast.error("Invalid technician selected");
      return;
    }
    
    // If it's a reassignment, show confirmation dialog
    if (isReassignMode) {
      setPendingReassignData({ ticketId: selectedTicketForAssign, technicianId: techId });
      setReassignConfirmOpen(true);
    } else {
      // For new assignments, execute directly
      assignMutation.mutate(
        { ticketId: selectedTicketForAssign, technicianId: techId },
        {
          onSuccess: () => {
            toast.success("Ticket assigned successfully");
            setAssignModalOpen(false);
            setSelectedTicketForAssign(null);
          },
        },
      );
    }
  };

  const handleReassignConfirm = () => {
    if (!pendingReassignData) return;
    
    const techId = Number(pendingReassignData.technicianId);
    
    // Close modals immediately (optimistic update already updated cache)
    setAssignModalOpen(false);
    setSelectedTicketForAssign(null);
    setReassignConfirmOpen(false);
    setPendingReassignData(null);
    
    assignMutation.mutate(
      { ticketId: pendingReassignData.ticketId, technicianId: techId },
      {
        onSuccess: () => {
          toast.success("Technician reassigned successfully");
        },
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

      <div className="mt-4 space-y-3">
        {ticketsQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-lg text-slate-500">No tickets found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => (
              <div key={ticket.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(ticket.id)}
                  onChange={() => toggleSelect(ticket.id)}
                  className="h-5 w-5 rounded border-gray-300"
                />
                <div className="flex-1">
                  <TicketCard ticket={ticket} />
                </div>
                {isAdmin && (
                  ticket.status === 'CLOSED' || ticket.status === 'RESOLVED' ? (
                    <div className="shrink-0 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      <span>✓</span>
                      <span>Completed</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTicketForAssign(ticket.id);
                        setIsReassignMode(!!ticket.assignedToId);
                        setAssignModalOpen(true);
                      }}
                      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-50 ${
                        ticket.assignedToId
                          ? 'bg-campus-brand hover:bg-campus-brand-hover'
                          : 'bg-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      {ticket.assignedToId ? 'Reassign' : 'Assign'}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Technician Performance</h2>
            <p className="mt-1 text-sm text-slate-600">
              Statistics for resolved tickets, ranked by ticket count
            </p>
          </div>

          {performanceQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : performanceQuery.error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Could not load technician performance data
            </div>
          ) : performanceData.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
              No technicians have resolved tickets yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      <button
                        type="button"
                        onClick={() => handlePerfSort("name")}
                        className="flex items-center gap-1 hover:text-campus-brand transition"
                      >
                        Technician
                        {perfSortBy === "name" && (
                          <span className="text-xs">{perfSortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-900">
                      <button
                        type="button"
                        onClick={() => handlePerfSort("ticketsResolved")}
                        className="flex items-center justify-end gap-1 ml-auto hover:text-campus-brand transition"
                      >
                        Tickets Resolved
                        {perfSortBy === "ticketsResolved" && (
                          <span className="text-xs">{perfSortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-900">
                      <button
                        type="button"
                        onClick={() => handlePerfSort("avgResolutionHours")}
                        className="flex items-center justify-end gap-1 ml-auto hover:text-campus-brand transition"
                      >
                        Avg Resolution Time
                        {perfSortBy === "avgResolutionHours" && (
                          <span className="text-xs">{perfSortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPerformanceData.map((perf, idx) => {
                    const tech = technicians.find(t => t.id === perf.technicianId);
                    return (
                      <tr
                        key={perf.technicianId}
                        className={`border-b border-slate-100 last:border-b-0 ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                        } hover:bg-slate-50`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <p className="font-medium text-slate-900">{perf.technicianName}</p>
                            {tech?.technicianCategory && (
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 w-fit">
                                {technicianCategoryLabel(tech.technicianCategory)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                            {perf.ticketsResolved}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {perf.avgResolutionHours != null ? (
                            <span className="font-medium">
                              {perf.avgResolutionHours.toFixed(1)} hours
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AssignTechnicianModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedTicketForAssign(null);
          setIsReassignMode(false);
        }}
        onAssign={handleAssignModalSubmit}
        currentTechnicianName={
          selectedTicketForAssign ? tickets.find(t => t.id === selectedTicketForAssign)?.assignedToName : null
        }
        isReassignment={isReassignMode}
      />

      <ConfirmModal
        open={reassignConfirmOpen}
        message={`Are you sure you want to reassign this ticket to a different technician? The previous assignment will be replaced.`}
        onConfirm={handleReassignConfirm}
        onCancel={() => {
          setReassignConfirmOpen(false);
          setPendingReassignData(null);
        }}
      />
    </DashboardPageLayout>
  );
}
