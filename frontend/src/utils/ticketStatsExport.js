import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatEnumLabel } from "./ticketStatsAggregates";

function escapeCsvField(s) {
  const str = s == null ? "" : String(s);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function csvRow(cells) {
  return cells.map(escapeCsvField).join(",");
}

export function downloadTicketStatsCsv({ tickets, model, performanceRows }) {
  const generatedAt = new Date().toISOString();
  const lines = [];
  lines.push(csvRow(["Smart Campus ticket statistics"]));
  lines.push(csvRow(["Generated at", generatedAt]));
  lines.push("");
  lines.push(csvRow(["Summary metric", "Value"]));
  lines.push(csvRow(["Total tickets", model.total]));
  lines.push(csvRow(["Assigned", model.assignment.assigned]));
  lines.push(csvRow(["Unassigned", model.assignment.unassigned]));
  lines.push(csvRow(["SLA violated", model.sla.violated]));
  lines.push(csvRow(["SLA met", model.sla.met]));
  lines.push(csvRow(["SLA not tracked", model.sla.na]));
  lines.push("");
  lines.push(csvRow(["Status", "Count"]));
  for (const row of model.statusChart) {
    lines.push(csvRow([row.name, row.value]));
  }
  lines.push("");
  lines.push(csvRow(["Priority", "Count"]));
  for (const row of model.priorityChart) {
    lines.push(csvRow([row.name, row.value]));
  }
  lines.push("");
  lines.push(csvRow(["Category", "Count"]));
  for (const row of model.categoryChart) {
    lines.push(csvRow([row.name, row.value]));
  }
  lines.push("");
  lines.push(csvRow(["Date", "Tickets created"]));
  for (const row of model.timeline) {
    lines.push(csvRow([row.date, row.count]));
  }
  lines.push("");
  if (performanceRows?.length) {
    lines.push(csvRow(["Technician", "Tickets resolved", "Avg resolution hours"]));
    for (const p of performanceRows) {
      lines.push(
        csvRow([
          p.technicianName,
          p.ticketsResolved ?? 0,
          p.avgResolutionHours != null ? p.avgResolutionHours : "",
        ]),
      );
    }
    lines.push("");
  }
  lines.push(
    csvRow([
      "Ticket ID",
      "Title",
      "Status",
      "Priority",
      "Category",
      "Location",
      "Created at",
      "Assigned to",
      "SLA violated",
    ]),
  );
  for (const t of tickets) {
    lines.push(
      csvRow([
        t.id,
        t.title,
        formatEnumLabel(t.status),
        formatEnumLabel(t.priority),
        formatEnumLabel(t.category),
        t.location,
        t.createdAt,
        t.assignedToName,
        t.slaViolated == null ? "" : t.slaViolated ? "Yes" : "No",
      ]),
    );
  }
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket-stats-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTicketStatsPdf({ tickets, model, performanceRows }) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const margin = 14;

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 220, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("Ticket statistics", margin, 16);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString()}`, margin, 24);
  doc.setTextColor(33, 37, 41);

  autoTable(doc, {
    startY: 38,
    head: [["Metric", "Value"]],
    body: [
      ["Total tickets", String(model.total)],
      ["Assigned", String(model.assignment.assigned)],
      ["Unassigned", String(model.assignment.unassigned)],
      ["SLA violated", String(model.sla.violated)],
      ["SLA met", String(model.sla.met)],
      ["SLA not tracked", String(model.sla.na)],
    ],
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229], fontStyle: "bold" },
    margin: { left: margin, right: margin },
  });

  let nextY = doc.lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: nextY,
    head: [["Status", "Count"]],
    body: model.statusChart.map((r) => [r.name, String(r.value)]),
    theme: "striped",
    headStyles: { fillColor: [99, 102, 241], fontStyle: "bold" },
    margin: { left: margin, right: margin },
  });
  nextY = doc.lastAutoTable.finalY + 8;

  if (nextY > 250) {
    doc.addPage();
    nextY = 16;
  }

  autoTable(doc, {
    startY: nextY,
    head: [["Priority", "Count"]],
    body: model.priorityChart.map((r) => [r.name, String(r.value)]),
    theme: "striped",
    headStyles: { fillColor: [236, 72, 153], fontStyle: "bold" },
    margin: { left: margin, right: margin },
  });
  nextY = doc.lastAutoTable.finalY + 8;

  if (model.categoryChart.length) {
    if (nextY > 230) {
      doc.addPage();
      nextY = 16;
    }
    autoTable(doc, {
      startY: nextY,
      head: [["Category", "Count"]],
      body: model.categoryChart.map((r) => [r.name, String(r.value)]),
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129], fontStyle: "bold" },
      margin: { left: margin, right: margin },
    });
    nextY = doc.lastAutoTable.finalY + 8;
  }

  if (performanceRows?.length) {
    if (nextY > 210) {
      doc.addPage();
      nextY = 16;
    }
    autoTable(doc, {
      startY: nextY,
      head: [["Technician", "Resolved", "Avg hours"]],
      body: performanceRows.map((p) => [
        p.technicianName,
        String(p.ticketsResolved ?? 0),
        p.avgResolutionHours != null ? p.avgResolutionHours.toFixed(1) : "—",
      ]),
      theme: "striped",
      headStyles: { fillColor: [245, 158, 11], fontStyle: "bold" },
      margin: { left: margin, right: margin },
    });
    nextY = doc.lastAutoTable.finalY + 8;
  }

  if (nextY > 190) {
    doc.addPage();
    nextY = 16;
  }

  const slice = tickets.slice(0, 30);
  autoTable(doc, {
    startY: nextY,
    head: [["ID", "Title", "Status", "Priority", "Created"]],
    body: slice.map((t) => [
      String(t.id),
      (t.title || "").slice(0, 36),
      formatEnumLabel(t.status),
      formatEnumLabel(t.priority),
      t.createdAt ? String(t.createdAt).slice(0, 19) : "",
    ]),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [71, 85, 105], fontStyle: "bold" },
    margin: { left: margin, right: margin },
  });

  if (tickets.length > 30) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Showing 30 of ${tickets.length} tickets — export CSV for the full list.`,
      margin,
      doc.lastAutoTable.finalY + 6,
    );
  }

  doc.save(`ticket-stats-${new Date().toISOString().slice(0, 10)}.pdf`);
}
