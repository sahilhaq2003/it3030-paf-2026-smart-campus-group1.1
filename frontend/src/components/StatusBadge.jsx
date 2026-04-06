import React from "react";
import { isResolvedLikeTicket } from "../utils/ticketStatusDisplay";

const statusStyles = {
  OPEN: "border border-campus-brand-pressed bg-campus-brand text-white shadow-sm",
  IN_PROGRESS: "border border-blue-800 bg-blue-700 text-white shadow-sm",
  RESOLVED: "bg-emerald-600 text-white border border-emerald-700 shadow-sm",
  CLOSED: "border border-slate-600 bg-slate-600 text-white shadow-sm",
  PENDING: "bg-amber-600 text-white border border-amber-700 shadow-sm",
  REJECTED: "bg-red-600 text-white border border-red-700 shadow-sm",
  APPROVED: "bg-emerald-600 text-white border border-emerald-700 shadow-sm",
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
