import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  User,
  MapPin,
  Clock,
  Tag,
  Edit2,
  Trash2,
  Send,
  MessageCircle,
  CheckCircle2,
  CircleDot,
  Wrench,
  RefreshCw,
} from "lucide-react";
import { ticketApi } from "../../api/ticketApi";
import { useAuth } from "../../context/AuthContext";
import {
  DashboardPageLayout,
  campusBtnPrimary,
  campusInputFocus,
} from "../../components/dashboard/DashboardPrimitives";
import CommentThread from "../../components/CommentThread";
import TicketAttachmentImage from "../../components/TicketAttachmentImage";
import TicketStatusStepper from "../../components/TicketStatusStepper";
import SlaTimer from "../../components/SlaTimer";
import ImageLightbox from "../../components/ImageLightbox";
import { normalizeRoles } from "../../utils/getDashboardRoute";
import { isResolvedLikeTicket, ticketStatusLabel } from "../../utils/ticketStatusDisplay";
import { technicianCategoryLabel } from "../../constants/technicianCategories";

const STATUS_STEPS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const STEP_HEADINGS = ["Submitted", "In progress", "Resolved", "Closed"];

const PROCESS_COPY = {
  OPEN: "Submitted",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

const priorityColors = {
  LOW: "border border-green-300 bg-green-100 text-green-700",
  MEDIUM: "border border-amber-300 bg-amber-100 text-amber-800",
  HIGH: "border border-orange-300 bg-orange-100 text-orange-700",
  CRITICAL: "border border-red-300 bg-red-100 text-red-700",
};

const statusColors = {
  OPEN: "border border-blue-200 bg-blue-50 text-blue-800",
  IN_PROGRESS: "border border-indigo-200 bg-indigo-50 text-indigo-800",
  RESOLVED: "border border-emerald-300 bg-emerald-100 text-emerald-800",
  CLOSED: "border border-slate-300 bg-slate-100 text-slate-700",
  REJECTED: "border border-red-300 bg-red-100 text-red-700",
};

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [comment, setComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: ticket, isLoading, refetch: refetchTicket } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => ticketApi.getTicketById(id).then((r) => r.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => ticketApi.getComments(id).then((r) => r.data),
    enabled: Boolean(id && ticket),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000,
  });

  const addComment = useMutation({
    mutationFn: (data) => ticketApi.addComment(id, data.content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", id] });
      setComment("");
      toast.success("Message sent");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Could not send message";
      toast.error(typeof msg === "string" ? msg : "Could not send message");
    },
  });

  const editComment = useMutation({
    mutationFn: ({ cid, content }) => ticketApi.editComment(id, cid, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", id] });
      setEditingCommentId(null);
      toast.success("Comment updated");
    },
  });

  const deleteComment = useMutation({
    mutationFn: (cid) => ticketApi.deleteComment(id, cid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", id] });
      toast.success("Comment deleted");
    },
  });

  const startWorkMutation = useMutation({
    mutationFn: () => ticketApi.updateStatus(id, { status: "IN_PROGRESS" }),
    onMutate: async () => {
      // Cancel ongoing queries
      await qc.cancelQueries({ queryKey: ["ticket", id] });
      await qc.cancelQueries({ queryKey: ["admin", "tickets", "list"] });
      
      // Snapshot the previous values
      const previousTicket = qc.getQueryData(["ticket", id]);
      const previousAdminTickets = qc.getQueryData(["admin", "tickets", "list"]);
      
      // Optimistically update the ticket detail cache
      qc.setQueryData(["ticket", id], (old) => {
        if (!old) return old;
        return {
          ...old,
          status: "IN_PROGRESS",
          updatedAt: new Date().toISOString(),
        };
      });
      
      // Optimistically update the admin tickets list cache
      qc.setQueryData(["admin", "tickets", "list"], (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((ticket) =>
            ticket.id == id
              ? {
                  ...ticket,
                  status: "IN_PROGRESS",
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          ),
        };
      });
      
      return { previousTicket, previousAdminTickets };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", id] });
      qc.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "assignedTickets"] });
      qc.invalidateQueries({ queryKey: ["tickets", "my"] });
      toast.success("Work started — ticket is now in progress");
    },
    onError: (err, variables, context) => {
      // Revert to previous values on error
      if (context?.previousTicket) {
        qc.setQueryData(["ticket", id], context.previousTicket);
      }
      if (context?.previousAdminTickets) {
        qc.setQueryData(["admin", "tickets", "list"], context.previousAdminTickets);
      }
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Could not update status";
      toast.error(typeof msg === "string" ? msg : "Could not update status");
    },
  });

  const resolveTicketMutation = useMutation({
    mutationFn: (notes) =>
      ticketApi.updateStatus(id, { status: "RESOLVED", resolutionNotes: notes.trim() }),
    onMutate: async (notes) => {
      // Cancel ongoing queries
      await qc.cancelQueries({ queryKey: ["ticket", id] });
      await qc.cancelQueries({ queryKey: ["admin", "tickets", "list"] });
      
      // Snapshot the previous values
      const previousTicket = qc.getQueryData(["ticket", id]);
      const previousAdminTickets = qc.getQueryData(["admin", "tickets", "list"]);
      
      // Optimistically update the ticket detail cache
      qc.setQueryData(["ticket", id], (old) => {
        if (!old) return old;
        return {
          ...old,
          status: "RESOLVED",
          resolutionNotes: notes.trim(),
          updatedAt: new Date().toISOString(),
        };
      });
      
      // Optimistically update the admin tickets list cache
      qc.setQueryData(["admin", "tickets", "list"], (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((ticket) =>
            ticket.id == id
              ? {
                  ...ticket,
                  status: "RESOLVED",
                  resolutionNotes: notes.trim(),
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          ),
        };
      });
      
      return { previousTicket, previousAdminTickets };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", id] });
      qc.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "assignedTickets"] });
      qc.invalidateQueries({ queryKey: ["tickets", "my"] });
      qc.invalidateQueries({ queryKey: ["admin", "technician", "performance"] });
      setResolutionNotes("");
      toast.success("Ticket marked resolved");
    },
    onError: (err, variables, context) => {
      // Revert to previous values on error
      if (context?.previousTicket) {
        qc.setQueryData(["ticket", id], context.previousTicket);
      }
      if (context?.previousAdminTickets) {
        qc.setQueryData(["admin", "tickets", "list"], context.previousAdminTickets);
      }
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Could not resolve ticket";
      toast.error(typeof msg === "string" ? msg : "Could not resolve ticket");
    },
  });

  const closeTicketMutation = useMutation({
    mutationFn: () => ticketApi.closeTicket(id),
    onMutate: async () => {
      // Cancel ongoing queries
      await qc.cancelQueries({ queryKey: ["ticket", id] });
      await qc.cancelQueries({ queryKey: ["admin", "tickets", "list"] });
      
      // Snapshot the previous values
      const previousTicket = qc.getQueryData(["ticket", id]);
      const previousAdminTickets = qc.getQueryData(["admin", "tickets", "list"]);
      
      // Optimistically update the ticket detail cache
      qc.setQueryData(["ticket", id], (old) => {
        if (!old) return old;
        return {
          ...old,
          status: "CLOSED",
          updatedAt: new Date().toISOString(),
        };
      });
      
      // Optimistically update the admin tickets list cache
      qc.setQueryData(["admin", "tickets", "list"], (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((ticket) =>
            ticket.id == id
              ? {
                  ...ticket,
                  status: "CLOSED",
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          ),
        };
      });
      
      return { previousTicket, previousAdminTickets };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", id] });
      qc.invalidateQueries({ queryKey: ["tickets", "my"] });
      qc.invalidateQueries({ queryKey: ["admin", "technician", "performance"] });
      qc.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
      toast.success("Ticket successfully closed");
    },
    onError: (err, variables, context) => {
      // Revert to previous values on error
      if (context?.previousTicket) {
        qc.setQueryData(["ticket", id], context.previousTicket);
      }
      if (context?.previousAdminTickets) {
        qc.setQueryData(["admin", "tickets", "list"], context.previousAdminTickets);
      }
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Could not close ticket";
      toast.error(typeof msg === "string" ? msg : "Could not close ticket");
    },
  });

  const roleSet = normalizeRoles(user?.roles ?? (user?.role != null ? [user.role] : []));
  const isAdmin = roleSet.has("ADMIN");
  const isTechnician = roleSet.has("TECHNICIAN");

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-campus-brand" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <DashboardPageLayout eyebrow="Tickets" title="Not found" subtitle="This ticket could not be loaded.">
        <p className="text-slate-600">Check the link or return to your ticket list.</p>
      </DashboardPageLayout>
    );
  }

  const stepIndex = STATUS_STEPS.indexOf(ticket.status);
  const isRejected = ticket.status === "REJECTED";

  const isReporter = Number(user?.id) === Number(ticket.reportedById);
  const isAssignee =
    ticket.assignedToId != null && Number(user?.id) === Number(ticket.assignedToId);
  const canHandleTicket = isAdmin || (isTechnician && isAssignee);

  const resolvedLike = isResolvedLikeTicket(ticket);

  const hoursElapsed = (Date.now() - new Date(ticket.createdAt)) / (1000 * 60 * 60);
  const slaBreached =
    !resolvedLike &&
    ((ticket.priority === "CRITICAL" && hoursElapsed > 2) ||
      (ticket.priority === "HIGH" && hoursElapsed > 8));

  const ta = `rounded-xl border border-slate-300 px-3 py-2 text-sm ${campusInputFocus}`;

  const canPostMessage = isAdmin || isReporter || (isTechnician && isAssignee);

  const conversationHint = isReporter
    ? "Message the technician working on this request. You’ll be notified when the ticket is updated."
    : isAssignee && isTechnician
      ? "Coordinate with the person who submitted this request. They see your messages here."
      : isAdmin
        ? "Internal and requester-visible thread. The reporter and assigned technician can also post here."
        : "Ticket conversation.";

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error("Add resolution notes before marking resolved");
      return;
    }
    resolveTicketMutation.mutate(resolutionNotes);
  };

  const handleRefresh = () => {
    refetchTicket();
    refetchComments();
    toast.success("Refreshed");
  };

  return (
    <DashboardPageLayout
      eyebrow={`Ticket #${ticket.id}`}
      title={ticket.title}
      subtitle={[ticket.category, ticket.location].filter(Boolean).join(" · ")}
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-campus-brand-hover transition hover:opacity-90"
        >
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
          title="Refresh ticket details and comments"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white px-5 py-4 shadow-sm ring-1 ring-slate-900/[0.04]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Service workflow
        </p>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-800">
          <span className="text-slate-900">Campus user</span> submits →{" "}
          <span className="text-slate-900">Admin</span> assigns a technician →{" "}
          <span className="text-slate-900">Technician</span> works the issue, chats with the requester, and marks{" "}
          <span className="text-slate-900">resolved</span>
          <span className="text-slate-600">
            {" "}
            — the ticket then closes automatically (admins still see full history and technician notes in the desk).
          </span>
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    resolvedLike ? statusColors.RESOLVED : statusColors[ticket.status] ?? statusColors.CLOSED
                  }`}
                >
                  {ticketStatusLabel(ticket)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${priorityColors[ticket.priority]}`}
                >
                  {ticket.priority}
                </span>
                <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {ticket.category}
                </span>
                {slaBreached ? (
                  <span className="animate-pulse rounded-full bg-red-700 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                    SLA breached
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-900">
              <User size={14} /> {ticket.reportedByName}
            </span>
            {ticket.location ? (
              <span className="flex items-center gap-1.5 text-slate-900">
                <MapPin size={14} /> {ticket.location}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5 text-slate-900">
              <Clock size={14} /> {formatDate(ticket.createdAt)}
            </span>
            {ticket.assignedToName ? (
              <span className="flex items-center gap-2 text-slate-900">
                <Tag size={14} /> 
                <div className="flex flex-col gap-0.5">
                  <span>Assigned: {ticket.assignedToName}</span>
                  {ticket.assignedToCategory && (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 w-fit">
                      {technicianCategoryLabel(ticket.assignedToCategory)}
                    </span>
                  )}
                </div>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-800">
                <Tag size={14} /> Awaiting assignment
              </span>
            )}
          </div>
        </div>

        <div className="border-b border-slate-200 bg-white px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status Timeline</p>
          <TicketStatusStepper status={ticket.status} resolvedAt={ticket.resolvedAt} closedAt={ticket.closedAt} />
          <ul className="mt-4 list-none space-y-4 pl-0">
            <li className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-campus-brand/15 text-campus-brand">
                <CircleDot className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Request submitted</p>
                <p className="text-xs text-slate-500">{formatDate(ticket.createdAt)}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                <User className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Assignment</p>
                <p className="text-xs text-slate-600">
                  {ticket.assignedToName ? (
                    <div className="flex flex-col gap-1">
                      <span>
                        Technician <span className="font-medium text-slate-800">{ticket.assignedToName}</span> is
                        handling this ticket.
                      </span>
                      {ticket.assignedToCategory && (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 w-fit">
                          {technicianCategoryLabel(ticket.assignedToCategory)}
                        </span>
                      )}
                    </div>
                  ) : (
                    "An admin will assign a technician. You’ll see their name here."
                  )}
                </p>
              </div>
            </li>
          </ul>
        </div>

        {!isRejected ? (
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            {/* Status stepper is now in Status Timeline section above */}
          </div>
        ) : null}

        {isRejected && ticket.rejectionReason ? (
          <div className="mx-6 mt-4 rounded-xl border border-red-300 bg-red-50 p-4 shadow-sm">
            <p className="mb-1 text-sm font-bold text-red-800">Rejected</p>
            <p className="text-sm font-medium text-red-800">{ticket.rejectionReason}</p>
          </div>
        ) : null}

        <div className="p-6">
          <p className="font-medium leading-relaxed text-slate-900">{ticket.description}</p>

          {/* SLA Timer */}
          <div className="mt-6">
            <SlaTimer 
              createdAt={ticket.createdAt} 
              priority={ticket.priority}
              status={ticket.status}
            />
          </div>

          {ticket.resolutionNotes ? (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm">
              <p className="mb-1 text-sm font-bold text-emerald-900">Resolution notes</p>
              <p className="text-sm font-medium text-emerald-900">{ticket.resolutionNotes}</p>
            </div>
          ) : null}

          {/* Close Ticket — shown to the reporter when the ticket is Resolved */}
          {isReporter && ticket.status === "RESOLVED" ? (
            <div className="mt-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">Satisfied with the resolution?</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    Close the ticket to confirm the issue has been resolved to your satisfaction.
                  </p>
                </div>
                <button
                  type="button"
                  id="close-ticket-btn"
                  disabled={closeTicketMutation.isPending}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to close this ticket?")) {
                      closeTicketMutation.mutate();
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
                >
                  {closeTicketMutation.isPending ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : null}
                  {closeTicketMutation.isPending ? "Closing…" : "Close Ticket"}
                </button>
              </div>
            </div>
          ) : null}

          {/* Closed state — non-interactive badge shown after the user closes */}
          {isReporter && ticket.status === "CLOSED" ? (
            <div className="mt-5 rounded-2xl border border-blue-300 bg-blue-50 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-blue-900">Ticket closed</p>
                  {ticket.closedAt ? (
                    <p className="mt-0.5 text-xs text-blue-700">
                      Closed on {formatDate(ticket.closedAt)}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled
                  className="flex cursor-not-allowed items-center gap-2 rounded-xl bg-blue-400 px-5 py-2.5 text-sm font-semibold text-white opacity-70 shadow-sm"
                >
                  Closed
                </button>
              </div>
            </div>
          ) : null}

          {ticket.attachments?.length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                Attachments ({ticket.attachments.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {ticket.attachments.map((a, idx) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative cursor-pointer"
                  >
                    <TicketAttachmentImage
                      url={a.url}
                      alt={a.originalName}
                      className="h-28 w-28 rounded-xl border-2 border-slate-200 object-cover shadow-sm transition-opacity group-hover:opacity-80"
                    />
                    <div className="absolute inset-0 rounded-xl bg-black/0 transition-colors group-hover:bg-black/20" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {canHandleTicket && !isRejected && (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") ? (
          <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-campus-brand" strokeWidth={2} />
              <h3 className="text-sm font-bold text-slate-900">Technician / handler actions</h3>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {isAdmin && !isAssignee
                ? "As an admin you can advance this ticket. Assignees use the same tools when they own the ticket."
                : "Update status when you are ready. Marking resolved closes the ticket immediately — no separate admin step."}
            </p>
            {ticket.status === "OPEN" ? (
              <button
                type="button"
                onClick={() => startWorkMutation.mutate()}
                disabled={startWorkMutation.isPending}
                className={`mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${campusBtnPrimary}`}
              >
                {startWorkMutation.isPending ? "Updating…" : "Start work (in progress)"}
              </button>
            ) : null}
            {ticket.status === "IN_PROGRESS" ? (
              <form onSubmit={handleResolveSubmit} className="mt-4 space-y-3">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Resolution notes <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                  className={`w-full ${ta}`}
                  placeholder="Describe what was fixed or inspected so the requester and records are clear."
                />
                <button
                  type="submit"
                  disabled={resolveTicketMutation.isPending}
                  className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                >
                  {resolveTicketMutation.isPending ? "Saving…" : "Mark as resolved"}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}

        <div className="border-t border-slate-200 bg-slate-50/50 p-6">
          <div className="mb-4">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <MessageCircle className="h-4 w-4 text-slate-600" strokeWidth={2} />
              <h3 className="text-sm font-bold text-slate-900">Conversation</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                {comments.length}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">{conversationHint}</p>
          </div>

          {canPostMessage ? (
            <CommentThread
              comments={comments}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              onAddComment={async (content) => {
                return new Promise((resolve, reject) => {
                  addComment.mutate(
                    { content },
                    {
                      onSuccess: () => resolve(),
                      onError: (err) => reject(err),
                    }
                  );
                });
              }}
              onEditComment={async (cid, content) => {
                return new Promise((resolve, reject) => {
                  editComment.mutate(
                    { cid, content },
                    {
                      onSuccess: () => resolve(),
                      onError: (err) => reject(err),
                    }
                  );
                });
              }}
              onDeleteComment={async (cid) => {
                return new Promise((resolve, reject) => {
                  deleteComment.mutate(cid, {
                    onSuccess: () => resolve(),
                    onError: (err) => reject(err),
                  });
                });
              }}
              loading={comments.isLoading}
            />
          ) : (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              You can view this conversation. Messages can only be sent by the person who submitted the ticket, the
              assigned technician, or an admin.
            </p>
          )}
        </div>
      </div>

      {lightboxIndex !== null && ticket.attachments && ticket.attachments.length > 0 ? (
        <ImageLightbox
          images={ticket.attachments}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </DashboardPageLayout>
  );
}
