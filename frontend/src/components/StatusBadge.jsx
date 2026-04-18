import React from "react";
import { isResolvedLikeTicket } from "../utils/ticketStatusDisplay";

const statusStyles = {
  OPEN: "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm tracking-wider",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm tracking-wider",
  RESOLVED: "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm tracking-wider",
  CLOSED: "bg-slate-100 text-slate-600 border border-slate-200 shadow-sm tracking-wider",
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm tracking-widest uppercase",
  REJECTED: "bg-rose-50 text-rose-700 border border-rose-200 shadow-sm tracking-widest uppercase",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm tracking-widest uppercase",
  CANCELLED: "bg-slate-50 text-slate-600 border border-slate-200 shadow-sm tracking-widest uppercase",
};

/**
 * @param {object} props
 * @param {string} props.status
 * @param {string} [props.resolutionNotes] — when status is CLOSED, used to show “Resolved”
 * @param {string} [props.resolvedAt]
 */
export default function StatusBadge({ status, resolutionNotes, resolvedAt }) {
  const ticketLike = { status, resolutionNotes, resolvedAt };
  const looksResolved = isResolvedLikeTicket(ticketLike);
  const styleKey = looksResolved ? "RESOLVED" : status;
  const label = looksResolved ? "Resolved" : String(status || "").replace(/_/g, " ");

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[styleKey] || "bg-slate-300 text-slate-700"}`}
    >
      {label}
    </span>
  );
}
