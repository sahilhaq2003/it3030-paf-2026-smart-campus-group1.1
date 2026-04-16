import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Bell,
  CalendarCheck,
  CalendarX,
  CheckCheck,
  ChevronRight,
  CornerDownRight,
  ExternalLink,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Ticket,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { format, isThisYear, isToday, isYesterday, parseISO } from "date-fns";
import { ticketApi } from "../../api/ticketApi";
import { normalizeRoles } from "../../utils/getDashboardRoute";

/* ─── tiny helpers ─── */

function parseCreatedAt(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    try { return parseISO(value); } catch { return null; }
  }
  return null;
}

function sectionLabel(date) {
  if (!date || Number.isNaN(date.getTime())) return "Earlier";
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisYear(date)) return format(date, "MMM d");
  return format(date, "MMM d, yyyy");
}

function notificationIcon(type) {
  switch (type) {
    case "BOOKING_CREATED":   return CalendarCheck;
    case "BOOKING_APPROVED":  return CalendarCheck;
    case "BOOKING_REJECTED":  return CalendarX;
    case "BOOKING_CANCELLED": return CalendarX;
    case "TICKET_STATUS_CHANGED": return Ticket;
    case "NEW_COMMENT": return MessageSquare;
    default: return Bell;
  }
}

function navigateForNotification(n, navigate) {
  if (n.referenceId == null) return;
  if (n.referenceType === "TICKET") { navigate(`/tickets/${n.referenceId}`); return; }
  if (n.referenceType === "BOOKING") { navigate(`/bookings/my?highlight=${n.referenceId}`); }
}

/* ─── CommentReplyCard ───────────────────────────────────────────────────────
   Used exclusively for NEW_COMMENT notifications.
   • Fetches the comment thread for the ticket (cached per ticketId).
   • Shows the latest comment as a preview bubble.
   • Expands an inline reply textarea; submits via ticketApi.addComment.
   Each instance is its own component so useQuery / useMutation hooks are legal.
──────────────────────────────────────────────────────────────────────────────*/
function CommentReplyCard({ n, onMarkRead, onClose, navigate }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef(null);

  const ticketId = n.referenceId;

  /* fetch comments – only when ticketId is known */
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["ticket-comments", ticketId],
    queryFn: () => ticketApi.getComments(ticketId).then((r) => r.data),
    enabled: ticketId != null,
    staleTime: 30_000,
  });

  const comments = Array.isArray(commentsData) ? commentsData : [];
  const lastComment = comments.length > 0 ? comments[comments.length - 1] : null;

  /* submit reply */
  const replyMutation = useMutation({
    mutationFn: (content) => ticketApi.addComment(ticketId, content).then((r) => r.data),
    onSuccess: () => {
      toast.success("Reply sent");
      qc.invalidateQueries({ queryKey: ["ticket-comments", ticketId] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      void onMarkRead(n.id).catch(() => {});
      setDraft("");
      setOpen(false);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to send reply";
      toast.error(typeof msg === "string" ? msg : "Failed to send reply");
    },
  });

  /* auto-focus textarea when expanded */
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 80);
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) { toast.error("Reply cannot be empty"); return; }
    replyMutation.mutate(trimmed);
  };

  const goToTicket = () => {
    void (async () => {
      try { if (!n.read) await onMarkRead(n.id); } catch { /* ignore */ }
      navigate(`/tickets/${ticketId}`);
      onClose();
    })();
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Last comment preview bubble */}
      {commentsLoading ? (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading last reply…
        </div>
      ) : lastComment ? (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-700">
              {lastComment.authorName ?? lastComment.author ?? "Someone"}
            </span>
            <span className="text-[10px] text-slate-400">
              {lastComment.createdAt
                ? format(parseCreatedAt(lastComment.createdAt) ?? new Date(), "HH:mm")
                : ""}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 italic">
            &ldquo;{lastComment.content}&rdquo;
          </p>
        </div>
      ) : null}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
            open
              ? "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
          }`}
        >
          <CornerDownRight className="h-3 w-3 shrink-0" strokeWidth={2.5} />
          {open ? "Cancel reply" : "Reply here"}
        </button>
        <button
          type="button"
          onClick={goToTicket}
          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={2.5} />
          Open ticket
        </button>
      </div>

      {/* Inline reply form */}
      {open && (
        <form onSubmit={handleSubmit} className="space-y-1.5">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Write your reply…"
            className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300"
            onKeyDown={(e) => {
              /* Ctrl/Cmd + Enter submits */
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit(e);
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">Ctrl+Enter to send</span>
            <button
              type="submit"
              disabled={replyMutation.isPending || !draft.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              {replyMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" strokeWidth={2.5} />
              )}
              Send reply
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ─── NotificationActions (for all non-comment types) ───────────────────────*/
function NotificationActions({ n, roles, onMarkRead, onClose, navigate }) {
  const qc = useQueryClient();
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [nextStatus, setNextStatus] = useState("");

  const isAdminOrManager = normalizeRoles(roles).has("ADMIN") || normalizeRoles(roles).has("MANAGER");
  const isTechnician = normalizeRoles(roles).has("TECHNICIAN");
  const isOps = isAdminOrManager || isTechnician;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      ticketApi.updateStatus(id, { status }).then((r) => r.data),
    onSuccess: (_, { status }) => {
      toast.success(`Ticket marked ${status.replace(/_/g, " ").toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
      setShowStatusForm(false);
      void onMarkRead(n.id).catch(() => {});
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || "Action failed";
      toast.error(typeof msg === "string" ? msg : "Action failed");
    },
  });

  const goTo = (path) => {
    void (async () => {
      try { if (!n.read) await onMarkRead(n.id); } catch { /* ignore */ }
      navigate(path);
      onClose();
    })();
  };

  const actions = [];

  if (n.type === "BOOKING_CREATED") {
    actions.push({
      key: "view-booking",
      label: "View booking",
      icon: CalendarCheck,
      className: "text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100",
      onClick: () => goTo(`/bookings/my?highlight=${n.referenceId}`),
    });
  }

  if (n.type === "BOOKING_APPROVED") {
    actions.push({
      key: "view-booking",
      label: "View booking",
      icon: CalendarCheck,
      className: "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
      onClick: () => goTo(`/bookings/my?highlight=${n.referenceId}`),
    });
  }

  if (n.type === "BOOKING_REJECTED") {
    actions.push({
      key: "view-booking",
      label: "View booking",
      icon: CalendarX,
      className: "text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100",
      onClick: () => goTo(`/bookings/my?highlight=${n.referenceId}`),
    });
    actions.push({
      key: "rebook",
      label: "Rebook",
      icon: RotateCcw,
      className: "text-red-700 border-red-200 bg-red-50 hover:bg-red-100",
      onClick: () => goTo("/facilities"),
    });
  }

  if (n.type === "BOOKING_CANCELLED") {
    actions.push({
      key: "view-booking",
      label: "View booking",
      icon: CalendarX,
      className: "text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100",
      onClick: () => goTo(`/bookings/my?highlight=${n.referenceId}`),
    });
  }

  if (n.type === "TICKET_STATUS_CHANGED" && n.referenceId != null) {
    actions.push({
      key: "view-ticket",
      label: "View ticket",
      icon: ExternalLink,
      className: "text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100",
      onClick: () => goTo(`/tickets/${n.referenceId}`),
    });
    if (isOps) {
      actions.push({
        key: "update-status",
        label: showStatusForm ? "Cancel" : "Update status",
        icon: Zap,
        className: showStatusForm
          ? "text-slate-600 border-slate-200 bg-slate-100 hover:bg-slate-200"
          : "text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100",
        onClick: () => setShowStatusForm((v) => !v),
      });
    }
  }

  if (n.type === "GENERAL" && n.referenceId != null) {
    actions.push({
      key: "view",
      label: "View",
      icon: ChevronRight,
      className: "text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100",
      onClick: () => goTo(
        n.referenceType === "TICKET" ? `/tickets/${n.referenceId}` : "/facilities"
      ),
    });
  }

  if (!actions.length) return null;

  const statusOptions = isAdminOrManager
    ? ["IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"]
    : ["IN_PROGRESS", "RESOLVED"];

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {actions.map(({ key, label, icon: Icon, className, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${className}`}
          >
            <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
            {label}
          </button>
        ))}
      </div>

      {showStatusForm && n.referenceId != null && (
        <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/60 p-2">
          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
            className="flex-1 rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="">Pick status…</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={!nextStatus || statusMutation.isPending}
            onClick={() => {
              if (!nextStatus) return;
              statusMutation.mutate({ id: n.referenceId, status: nextStatus });
            }}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {statusMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3" strokeWidth={2.5} />
            )}
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main panel ──────────────────────────────────────────────────────────── */

export default function NotificationPanel({
  open,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  onMarkAllRead,
  onMarkRead,
  onDelete,
  markAllPending,
  user,
}) {
  const navigate = useNavigate();
  const roles = user?.roles ?? (user?.role != null ? [user.role] : []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const grouped = useMemo(() => {
    const buckets = new Map();
    for (const n of notifications) {
      const d = parseCreatedAt(n.createdAt);
      const label = sectionLabel(d);
      if (!buckets.has(label)) buckets.set(label, []);
      buckets.get(label).push(n);
    }
    const order = ["Today", "Yesterday"];
    const labels = [...buckets.keys()].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    return labels.map((label) => ({ label, items: buckets.get(label) }));
  }, [notifications]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[45] bg-slate-900/25 backdrop-blur-[1px]"
        aria-label="Close notifications"
        onClick={onClose}
      />

      <aside
        className="fixed right-0 top-0 z-[50] flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-panel-title"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2 id="notification-panel-title" className="text-base font-semibold text-slate-900">
              Notifications
            </h2>
            {unreadCount > 0 ? (
              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount} unread · reply or act without leaving
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-slate-500">You&apos;re all caught up</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => void onMarkAllRead()}
              disabled={unreadCount === 0 || markAllPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-campus-brand hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
            >
              {markAllPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              Mark all read
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-campus-brand" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-2 py-16 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          ) : (
            grouped.map(({ label, items }) => (
              <div key={label} className="mb-6">
                <p className="sticky top-0 z-[1] bg-white/95 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {label}
                </p>
                <ul className="space-y-1.5">
                  {items.map((n) => {
                    const Icon = notificationIcon(n.type);
                    const d = parseCreatedAt(n.createdAt);
                    const timeStr = d && !Number.isNaN(d.getTime()) ? format(d, "HH:mm") : "";
                    const isComment = n.type === "NEW_COMMENT";

                    return (
                      <li key={n.id}>
                        <div
                          className={`group rounded-xl border px-3 py-3 transition ${
                            n.read
                              ? "border-slate-100 bg-slate-50/80"
                              : isComment
                                ? "border-violet-200/60 bg-violet-50/30"
                                : "border-campus-brand/20 bg-indigo-50/40"
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                n.read
                                  ? "bg-white text-slate-500"
                                  : isComment
                                    ? "bg-violet-100 text-violet-600"
                                    : "bg-white text-campus-brand"
                              }`}
                            >
                              <Icon className="h-4 w-4" strokeWidth={2} />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              {/* Clickable header → navigate */}
                              <button
                                type="button"
                                className="w-full text-left"
                                onClick={() => {
                                  void (async () => {
                                    try { if (!n.read) await onMarkRead(n.id); } catch { /* ignore */ }
                                    navigateForNotification(n, navigate);
                                    onClose();
                                  })();
                                }}
                              >
                                <p className="text-sm font-medium text-slate-900">{n.title}</p>
                                <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                                  {n.message}
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-slate-400">{timeStr}</p>
                              </button>

                              {/* ── Inline comment reply (NEW_COMMENT only) ── */}
                              {isComment && n.referenceId != null ? (
                                <CommentReplyCard
                                  n={n}
                                  onMarkRead={onMarkRead}
                                  onClose={onClose}
                                  navigate={navigate}
                                />
                              ) : (
                                <NotificationActions
                                  n={n}
                                  roles={roles}
                                  onMarkRead={onMarkRead}
                                  onClose={onClose}
                                  navigate={navigate}
                                />
                              )}
                            </div>

                            {/* Delete */}
                            <button
                              type="button"
                              className="shrink-0 self-start rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                              aria-label="Delete notification"
                              onClick={() => void onDelete(n.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
