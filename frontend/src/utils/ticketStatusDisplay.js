/** Ticket was finished via technician/admin resolve (stored as CLOSED + resolution metadata). */
export function isResolvedLikeTicket(ticket) {
  if (!ticket) return false;
  if (ticket.status === "RESOLVED") return true;
  if (ticket.status !== "CLOSED") return false;
  return Boolean(
    (ticket.resolutionNotes && String(ticket.resolutionNotes).trim()) || ticket.resolvedAt,
  );
}

/** Label for lists and badges (users see “Resolved”, not internal CLOSED). */
export function ticketStatusLabel(ticket) {
  if (!ticket?.status) return "";
  if (isResolvedLikeTicket(ticket)) return "Resolved";
  return String(ticket.status).replace(/_/g, " ");
}
