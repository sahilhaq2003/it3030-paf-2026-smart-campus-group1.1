/** Human-readable labels for ticket enums and aggregates for analytics. */

export function formatEnumLabel(raw) {
  if (raw == null || raw === "") return "Unknown";
  return String(raw)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function countBy(tickets, field) {
  const map = new Map();
  for (const t of tickets) {
    const raw = t[field];
    const key = raw == null ? "UNKNOWN" : String(raw);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([k, value]) => ({
      key: k,
      name: k === "UNKNOWN" ? "Unknown" : formatEnumLabel(k),
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

export function ticketsCreatedByDay(tickets, days = 14) {
  const labels = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    labels.push(`${y}-${m}-${day}`);
  }
  const counts = Object.fromEntries(labels.map((l) => [l, 0]));
  for (const t of tickets) {
    if (!t.createdAt) continue;
    const d = new Date(t.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    if (Object.prototype.hasOwnProperty.call(counts, key)) counts[key] += 1;
  }
  return labels.map((date) => ({
    date,
    label: date.slice(5),
    count: counts[date],
  }));
}

export function slaSummary(tickets) {
  let violated = 0;
  let met = 0;
  let na = 0;
  for (const t of tickets) {
    if (t.slaViolated === true) violated++;
    else if (t.slaViolated === false) met++;
    else na++;
  }
  return { violated, met, na, total: tickets.length };
}

export function assignmentSummary(tickets) {
  const assigned = tickets.filter((t) => t.assignedToId != null).length;
  return { assigned, unassigned: tickets.length - assigned };
}

export function buildTicketStatsModel(tickets, performanceRows) {
  const total = tickets.length;
  const statusChart = countBy(tickets, "status");
  const priorityChart = countBy(tickets, "priority");
  const categoryChart = countBy(tickets, "category");
  const timeline = ticketsCreatedByDay(tickets, 14);
  const sla = slaSummary(tickets);
  const assignment = assignmentSummary(tickets);
  const techBar = (performanceRows ?? [])
    .map((p) => ({
      name:
        (p.technicianName && p.technicianName.length > 14
          ? `${p.technicianName.slice(0, 12)}…`
          : p.technicianName) || "Technician",
      fullName: p.technicianName,
      resolved: Number(p.ticketsResolved ?? 0),
      avgHrs: p.avgResolutionHours,
    }))
    .sort((a, b) => b.resolved - a.resolved)
    .slice(0, 12);
  return {
    total,
    statusChart,
    priorityChart,
    categoryChart,
    timeline,
    sla,
    assignment,
    techBar,
  };
}
