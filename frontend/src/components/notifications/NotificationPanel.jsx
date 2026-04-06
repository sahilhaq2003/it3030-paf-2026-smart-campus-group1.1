import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarCheck,
  CalendarX,
  CheckCheck,
  Loader2,
  MessageSquare,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import { format, isThisYear, isToday, isYesterday, parseISO } from "date-fns";

function parseCreatedAt(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return parseISO(value);
    } catch {
      return null;
    }
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
    case "BOOKING_APPROVED":
      return CalendarCheck;
    case "BOOKING_REJECTED":
      return CalendarX;
    case "TICKET_STATUS_CHANGED":
      return Ticket;
    case "NEW_COMMENT":
      return MessageSquare;
    default:
      return Bell;
  }
}

function navigateForNotification(n, navigate) {
  if (n.referenceId == null) return;
  if (n.referenceType === "TICKET") {
    navigate(`/tickets/${n.referenceId}`);
    return;
  }
  if (n.referenceType === "BOOKING") {
    navigate("/facilities");
  }
}

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
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
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
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
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
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2
              id="notification-panel-title"
              className="text-base font-semibold text-slate-900"
            >
              Notifications
            </h2>
            {unreadCount > 0 ? (
              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount} unread
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
                <ul className="space-y-1">
                  {items.map((n) => {
                    const Icon = notificationIcon(n.type);
                    const d = parseCreatedAt(n.createdAt);
                    const timeStr = d && !Number.isNaN(d.getTime())
                      ? format(d, "HH:mm")
                      : "";
                    return (
                      <li key={n.id}>
                        <div
                          className={`group flex gap-3 rounded-xl border px-3 py-2.5 transition ${
                            n.read
                              ? "border-slate-100 bg-slate-50/80"
                              : "border-campus-brand/20 bg-indigo-50/40"
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              n.read ? "bg-white text-slate-500" : "bg-white text-campus-brand"
                            }`}
                          >
                            <Icon className="h-4 w-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              className="w-full text-left"
                              onClick={() => {
                                void (async () => {
                                  if (!n.read) {
                                    try {
                                      await onMarkRead(n.id);
                                    } catch {
                                      /* toast elsewhere if needed */
                                    }
                                  }
                                  navigateForNotification(n, navigate);
                                  onClose();
                                })();
                              }}
                            >
                              <p className="text-sm font-medium text-slate-900">
                                {n.title}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                                {n.message}
                              </p>
                              <p className="mt-1 text-[11px] font-medium text-slate-400">
                                {timeStr}
                              </p>
                            </button>
                          </div>
                          <button
                            type="button"
                            className="shrink-0 self-start rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                            aria-label="Delete notification"
                            onClick={() => void onDelete(n.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
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
