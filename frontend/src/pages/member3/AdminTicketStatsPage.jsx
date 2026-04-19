import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { ArrowLeft, FileDown, FileSpreadsheet } from "lucide-react";
import {
  DashboardPageLayout,
  dashboardBtnSecondary,
  campusInputFocus,
} from "../../components/dashboard/DashboardPrimitives";
import { ticketApi } from "../../api/ticketApi";
import { buildTicketStatsModel } from "../../utils/ticketStatsAggregates";
import { downloadTicketStatsCsv, downloadTicketStatsPdf } from "../../utils/ticketStatsExport";
import { isResolvedLikeTicket } from "../../utils/ticketStatusDisplay";

const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#f97316",
  "#a855f7",
  "#14b8a6",
  "#e11d48",
];

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid rgb(226 232 240)",
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.08)",
};

async function fetchAllTicketsForStats() {
  const all = [];
  let page = 0;
  const size = 100;
  for (;;) {
    const { data } = await ticketApi.getAllTickets({
      page,
      size,
      sort: "createdAt,desc",
    });
    const chunk = data.content ?? [];
    all.push(...chunk);
    if (data.last || chunk.length === 0) break;
    page += 1;
    if (page > 40) break;
  }
  return all;
}

export default function AdminTicketStatsPage() {
  const ticketsQuery = useQuery({
    queryKey: ["admin", "tickets", "stats", "full-list"],
    queryFn: fetchAllTicketsForStats,
    staleTime: 60 * 1000,
  });

  const performanceQuery = useQuery({
    queryKey: ["admin", "technician", "performance"],
    queryFn: () => ticketApi.getTechnicianPerformance().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const tickets = ticketsQuery.data ?? [];
  const performanceData = performanceQuery.data ?? [];

  const model = useMemo(
    () => buildTicketStatsModel(tickets, performanceData),
    [tickets, performanceData],
  );

  const assignmentDonut = useMemo(
    () => [
      { name: "Assigned", value: model.assignment.assigned },
      { name: "Unassigned", value: model.assignment.unassigned },
    ],
    [model.assignment],
  );

  const slaSlices = useMemo(() => {
    const rows = [
      { name: "Within SLA", value: model.sla.met, color: "#10b981" },
      { name: "Breached", value: model.sla.violated, color: "#f43f5e" },
    ];
    if (model.sla.na > 0) {
      rows.push({ name: "Not tracked", value: model.sla.na, color: "#94a3b8" });
    }
    return rows.filter((r) => r.value > 0);
  }, [model.sla]);

  const exportPdf = () => {
    try {
      downloadTicketStatsPdf({
        tickets,
        model,
        performanceRows: performanceData,
      });
      toast.success("PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not create PDF");
    }
  };

  const exportCsv = () => {
    try {
      downloadTicketStatsCsv({
        tickets,
        model,
        performanceRows: performanceData,
      });
      toast.success("CSV downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not create CSV");
    }
  };

  const loadError = ticketsQuery.error;
  const errMsg =
    loadError &&
    (loadError.response?.data?.message ||
      (typeof loadError.response?.data === "string" ? loadError.response.data : null) ||
      "Could not load tickets");

  const exportBtnBase = `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${campusInputFocus}`;

  return (
    <DashboardPageLayout
      eyebrow="Admin · Tickets"
      title="Ticket statistics"
      subtitle="Visual breakdown of volume, priorities, categories, SLA, and technician throughput. Export a snapshot anytime."
      headerActions={
        <>
          <Link
            to="/admin/tickets"
            className={`${dashboardBtnSecondary} gap-1.5 !py-2 text-xs sm:text-sm`}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
            Back
          </Link>
          <button
            type="button"
            onClick={exportPdf}
            disabled={ticketsQuery.isLoading || tickets.length === 0}
            className={`${exportBtnBase} bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 text-white outline-none ring-violet-300 disabled:pointer-events-none disabled:opacity-50`}
          >
            <FileDown className="h-4 w-4" strokeWidth={2} />
            PDF
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={ticketsQuery.isLoading || tickets.length === 0}
            className={`${exportBtnBase} bg-gradient-to-br from-emerald-500 to-teal-600 text-white outline-none ring-emerald-300 disabled:pointer-events-none disabled:opacity-50`}
          >
            <FileSpreadsheet className="h-4 w-4" strokeWidth={2} />
            CSV
          </button>
        </>
      }
    >
      {errMsg ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errMsg}
        </div>
      ) : null}

      {ticketsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/60 shadow-inner" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total tickets",
                value: model.total,
                gradient: "from-indigo-500/90 to-violet-600/95",
              },
              {
                label: "In progress",
                value: tickets.filter((t) => t.status === "IN_PROGRESS").length,
                gradient: "from-sky-500/90 to-blue-600/95",
              },
              {
                label: "Open",
                value: tickets.filter((t) => t.status === "OPEN").length,
                gradient: "from-amber-500/90 to-orange-600/95",
              },
              {
                label: "Resolved / closed",
                value: tickets.filter((t) => isResolvedLikeTicket(t)).length,
                gradient: "from-emerald-500/90 to-teal-600/95",
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-lg shadow-slate-900/15 ring-1 ring-white/25`}
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl"
                  aria-hidden
                />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/60 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.06] ring-1 ring-white/40 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-slate-900">Status mix</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">Share of tickets by workflow state</p>
              <div className="mt-4 h-[280px] w-full min-h-[240px]">
                {model.statusChart.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-slate-500">
                    No data yet
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={model.statusChart}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={96}
                        innerRadius={44}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {model.statusChart.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/60 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.06] ring-1 ring-white/40 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-slate-900">Priority distribution</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">How urgent reported issues are</p>
              <div className="mt-4 h-[280px] w-full">
                {model.priorityChart.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-slate-500">
                    No data yet
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={model.priorityChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" name="Tickets" radius={[8, 8, 0, 0]}>
                        {model.priorityChart.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/60 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.06] ring-1 ring-white/40 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-slate-900">Categories</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">Ticket types across campus</p>
              <div className="mt-4 h-[280px] w-full">
                {model.categoryChart.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-slate-500">
                    No categories yet
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={model.categoryChart}
                      margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" name="Tickets" radius={[0, 8, 8, 0]}>
                        {model.categoryChart.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/60 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.06] ring-1 ring-white/40 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-slate-900">New tickets over time</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">Created in the last 14 days</p>
              <div className="mt-4 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={model.timeline} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ticketArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Created"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fill="url(#ticketArea)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/60 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.06] ring-1 ring-white/40 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-slate-900">Assignment coverage</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">Assigned vs waiting for a technician</p>
              <div className="mt-4 h-[260px] w-full">
                {model.total === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-slate-500">No tickets</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assignmentDonut}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={2}
                      >
                        {assignmentDonut.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "#6366f1" : "#fbbf24"} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/60 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.06] ring-1 ring-white/40 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-slate-900">SLA overview</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">Breached vs on-time (where tracked)</p>
              <div className="mt-4 h-[260px] w-full">
                {slaSlices.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-slate-500">
                    No SLA data for current tickets
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={slaSlices}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={86}
                        paddingAngle={2}
                      >
                        {slaSlices.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {model.techBar.length > 0 ? (
            <div className="mt-8 rounded-[1.75rem] border border-white/60 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.06] ring-1 ring-white/40 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-slate-900">Technician throughput</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Resolved ticket counts (hover bars for full name)
              </p>
              <div className="mt-4 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={model.techBar} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v) => [v, "Resolved"]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
                    />
                    <Bar dataKey="resolved" name="Resolved" radius={[8, 8, 0, 0]} fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {performanceQuery.isError ? (
            <p className="mt-4 text-center text-sm text-amber-700">
              Technician performance could not be loaded; charts above still reflect ticket data.
            </p>
          ) : null}
        </>
      )}
    </DashboardPageLayout>
  );
}
