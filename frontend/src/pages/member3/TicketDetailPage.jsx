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
} from "lucide-react";
import { ticketApi } from "../../api/ticketApi";
import { useAuth } from "../../context/AuthContext";
import {
  DashboardPageLayout,
  campusBtnPrimary,
  campusInputFocus,
} from "../../components/dashboard/DashboardPrimitives";
import { normalizeRoles } from "../../utils/getDashboardRoute";

const STATUS_STEPS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

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

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => ticketApi.getTicketById(id).then((r) => r.data),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => ticketApi.getComments(id).then((r) => r.data),
    enabled: !!id,
  });

  const addComment = useMutation({
    mutationFn: () => ticketApi.addComment(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", id] });
      setComment("");
      toast.success("Comment added");
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

  const roleSet = normalizeRoles(user?.roles ?? (user?.role != null ? [user.role] : []));
  const isAdmin = roleSet.has("ADMIN");

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#1E3A5F]" />
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

  const hoursElapsed = (Date.now() - new Date(ticket.createdAt)) / (1000 * 60 * 60);
  const slaBreached =
    (ticket.priority === "CRITICAL" &&
      hoursElapsed > 2 &&
      ticket.status !== "RESOLVED" &&
      ticket.status !== "CLOSED") ||
    (ticket.priority === "HIGH" &&
      hoursElapsed > 8 &&
      ticket.status !== "RESOLVED" &&
      ticket.status !== "CLOSED");

  const ta = `rounded-xl border border-slate-300 px-3 py-2 text-sm ${campusInputFocus}`;

  return (
    <DashboardPageLayout
      eyebrow={`Ticket #${ticket.id}`}
      title={ticket.title}
      subtitle={[ticket.category, ticket.location].filter(Boolean).join(" · ")}
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-sm font-medium text-[#1E3A5F] transition hover:opacity-90"
      >
        <ChevronLeft size={16} className="mr-1" /> Back
      </button>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors[ticket.status] ?? statusColors.CLOSED}`}
                >
                  {ticket.status.replace("_", " ")}
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
            ) : null}
          </div>
        </div>

        {!isRejected ? (
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex flex-1 items-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      i <= stepIndex ? "bg-[#1E3A5F] text-white shadow-sm" : "bg-slate-300 text-slate-600"
                    }`}
                  >
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <div className="mx-1 flex-1">
                    <div
                      className={`h-1 rounded transition-colors ${
                        i < stepIndex ? "bg-[#1E3A5F]" : "bg-slate-300"
                      }`}
                    />
                  </div>
                  <span
                    className={`hidden text-xs font-bold sm:block ${i <= stepIndex ? "text-slate-900" : "text-slate-400"}`}
                  >
                    {step.replace("_", " ")}
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

        <div className="border-t border-slate-200 p-6">
          <h3 className="mb-4 text-sm font-bold text-slate-900">Comments ({comments.length})</h3>

          <div className="mb-6 space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F] text-xs font-bold text-white shadow-sm">
                  {c.authorName?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{c.authorName}</span>
                    <span className="text-xs font-medium text-slate-500">{formatDate(c.createdAt)}</span>
                    {c.edited ? (
                      <span className="text-xs font-medium italic text-slate-500">(edited)</span>
                    ) : null}
                  </div>

                  {editingCommentId === c.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className={ta}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editComment.mutate({ cid: c.id, content: editContent })}
                          className={`rounded-lg px-4 py-1.5 text-sm text-white ${campusBtnPrimary}`}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCommentId(null)}
                          className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex items-start justify-between">
                      <p className="flex-1 text-sm font-medium text-slate-900">{c.content}</p>
                      {(c.authorId === user?.id || isAdmin) && (
                        <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {c.authorId === user?.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(c.id);
                                setEditContent(c.content);
                              }}
                              className="p-1 text-slate-400 transition-colors hover:text-[#1E3A5F]"
                            >
                              <Edit2 size={13} />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => deleteComment.mutate(c.id)}
                            className="p-1 text-slate-400 transition-colors hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {comments.length === 0 ? (
              <p className="py-4 text-center text-sm font-medium text-slate-500">No comments yet</p>
            ) : null}
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F] text-xs font-bold text-white shadow-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex flex-1 gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment…"
                rows={1}
                className={`flex-1 resize-none rounded-xl px-3 py-2 text-sm font-medium ${ta}`}
              />
              <button
                type="button"
                onClick={() => addComment.mutate()}
                disabled={!comment.trim() || addComment.isPending}
                className={`flex items-center justify-center rounded-xl px-4 py-2 disabled:opacity-50 ${campusBtnPrimary}`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
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
