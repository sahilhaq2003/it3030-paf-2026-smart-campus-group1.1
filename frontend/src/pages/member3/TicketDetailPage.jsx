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
} from "lucide-react";
import { ticketApi } from "../../api/ticketApi";
import { useAuth } from "../../context/AuthContext";
import {
  DashboardPageLayout,
  campusBtnPrimary,
  campusInputFocus,
} from "../../components/dashboard/DashboardPrimitives";
import { normalizeRoles } from "../../utils/getDashboardRoute";
import { isResolvedLikeTicket, ticketStatusLabel } from "../../utils/ticketStatusDisplay";

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
  const [lightboxImg, setLightboxImg] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => ticketApi.getTicketById(id).then((r) => r.data),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => ticketApi.getComments(id).then((r) => r.data),
    enabled: Boolean(id && ticket),
  });

  const addComment = useMutation({
    mutationFn: () => ticketApi.addComment(id, comment),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", id] });
      qc.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "assignedTickets"] });
      qc.invalidateQueries({ queryKey: ["tickets", "my"] });
      toast.success("Work started — ticket is now in progress");
    },
    onError: (err) => {
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", id] });
      qc.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "assignedTickets"] });
      qc.invalidateQueries({ queryKey: ["tickets", "my"] });
      setResolutionNotes("");
      toast.success("Ticket marked resolved");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Could not resolve ticket";
      toast.error(typeof msg === "string" ? msg : "Could not resolve ticket");
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

  return (
    <DashboardPageLayout
      eyebrow={`Ticket #${ticket.id}`}
      title={ticket.title}
      subtitle={[ticket.category, ticket.location].filter(Boolean).join(" · ")}
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-sm font-medium text-campus-brand-hover transition hover:opacity-90"
      >
        <ChevronLeft size={16} className="mr-1" /> Back
      </button>

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
              <span className="flex items-center gap-1.5 text-slate-900">
                <Tag size={14} /> Assigned: {ticket.assignedToName}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-800">
                <Tag size={14} /> Awaiting assignment
              </span>
            )}
          </div>
        </div>

        <div className="border-b border-slate-200 bg-white px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Timeline</p>
          <ul className="mt-4 space-y-4">
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
                    <>
                      Technician <span className="font-medium text-slate-800">{ticket.assignedToName}</span> is
                      handling this ticket.
                    </>
                  ) : (
                    "An admin will assign a technician. You’ll see their name here."
                  )}
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Wrench className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Work & resolution</p>
                <p className="text-xs text-slate-600">
                  Current stage:{" "}
                  <span className="font-medium text-slate-800">
                    {resolvedLike
                      ? "Resolved and closed"
                      : PROCESS_COPY[ticket.status] ?? ticket.status}
                  </span>
                  {resolvedLike ? " — thank you for using the campus desk." : null}
                </p>
              </div>
            </li>
          </ul>
        </div>

        {!isRejected ? (
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex flex-1 items-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      i <= stepIndex ? "bg-campus-brand text-white shadow-sm" : "bg-slate-300 text-slate-600"
                    }`}
                  >
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <div className="mx-1 flex-1">
                    <div
                      className={`h-1 rounded transition-colors ${
                        i < stepIndex ? "bg-campus-brand" : "bg-slate-300"
                      }`}
                    />
                  </div>
                  <span
                    className={`hidden text-xs font-bold sm:block ${i <= stepIndex ? "text-slate-900" : "text-slate-400"}`}
                  >
                    {STEP_HEADINGS[i] ?? step.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
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

          {ticket.resolutionNotes ? (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm">
              <p className="mb-1 text-sm font-bold text-emerald-900">Resolution notes</p>
              <p className="text-sm font-medium text-emerald-900">{ticket.resolutionNotes}</p>
            </div>
          ) : null}

          {ticket.attachments?.length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                Attachments ({ticket.attachments.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {ticket.attachments.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setLightboxImg(a.url)}
                    className="group relative cursor-pointer"
                  >
                    <img
                      src={a.url}
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
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <MessageCircle className="h-4 w-4 text-slate-600" strokeWidth={2} />
            <h3 className="text-sm font-bold text-slate-900">Conversation</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
              {comments.length}
            </span>
          </div>
          <p className="mb-6 text-xs leading-relaxed text-slate-600">{conversationHint}</p>

          <div className="mb-6 space-y-3">
            {comments.map((c) => {
              const mine = Number(c.authorId) === Number(user?.id);
              return (
                <div key={c.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 shadow-sm ring-1 ${
                      mine
                        ? "bg-campus-brand text-white ring-campus-brand/20"
                        : "bg-white text-slate-900 ring-slate-200/80"
                    }`}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold ${mine ? "text-white/95" : "text-slate-800"}`}>
                        {c.authorName}
                        {mine ? " · You" : ""}
                      </span>
                      <span className={`text-[10px] font-medium ${mine ? "text-white/75" : "text-slate-500"}`}>
                        {formatDate(c.createdAt)}
                      </span>
                      {c.edited ? (
                        <span className={`text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                          (edited)
                        </span>
                      ) : null}
                    </div>
                    {editingCommentId === c.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ${campusInputFocus}`}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editComment.mutate({ cid: c.id, content: editContent })}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative">
                        <p className={`text-sm font-medium leading-relaxed ${mine ? "text-white" : "text-slate-800"}`}>
                          {c.content}
                        </p>
                        {(c.authorId === user?.id || isAdmin) && (
                          <div className="mt-2 flex justify-end gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                            {c.authorId === user?.id ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setEditContent(c.content);
                                }}
                                className={`rounded p-1 ${mine ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-campus-brand-hover"}`}
                              >
                                <Edit2 size={13} />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => deleteComment.mutate(c.id)}
                              className={`rounded p-1 ${mine ? "text-white/80 hover:text-red-200" : "text-slate-400 hover:text-red-600"}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {comments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
                No messages yet — say hello to keep everyone aligned on this ticket.
              </p>
            ) : null}
          </div>

          {canPostMessage ? (
            <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 ring-1 ring-slate-900/[0.03]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a message…"
                  rows={2}
                  className={`min-h-[2.75rem] flex-1 resize-y rounded-xl border-slate-200 px-3 py-2 text-sm ${ta}`}
                />
                <button
                  type="button"
                  onClick={() => addComment.mutate()}
                  disabled={!comment.trim() || addComment.isPending}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${campusBtnPrimary}`}
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              You can view this conversation. Messages can only be sent by the person who submitted the ticket, the
              assigned technician, or an admin.
            </p>
          )}
        </div>
      </div>

      {lightboxImg ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} alt="" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" />
        </button>
      ) : null}
    </DashboardPageLayout>
  );
}
