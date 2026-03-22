import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardPageLayout, campusBtnPrimary } from "../../components/dashboard/DashboardPrimitives";
import StatusBadge from "../../components/StatusBadge";
import { Clock, CheckCircle, AlertCircle, TrendingUp, BarChart3, Zap, Target } from 'lucide-react';

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assigned');

  // Mock data
  const myTickets = [
    { id: 'TCK-001', title: 'AC Maintenance', status: 'IN_PROGRESS', priority: 'MEDIUM', createdAt: '2026-03-05', daysOpen: 3 },
    { id: 'TCK-002', title: 'Printer Setup', status: 'RESOLVED', priority: 'HIGH', createdAt: '2026-03-01', resolvedAt: '2026-03-07' },
    { id: 'TCK-003', title: 'Door Lock Repair', status: 'IN_PROGRESS', priority: 'CRITICAL', createdAt: '2026-03-06', daysOpen: 2 },
  ];

  const metrics = {
    assigned: myTickets.filter(t => t.status !== 'RESOLVED').length,
    inProgress: myTickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: myTickets.filter(t => t.status === 'RESOLVED').length,
    avgResolutionTime: 4.5,
  };

  const performanceStats = [
    { label: 'Tickets Resolved (This Month)', value: 12, change: '+2 vs last week', icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    { label: 'Avg Resolution Time', value: '4.5 hrs', change: '-1 hr improvement', icon: <Clock className="w-5 h-5 text-blue-500" /> },
    { label: 'Customer Satisfaction', value: '4.8/5', change: '+0.2 points', icon: <TrendingUp className="w-5 h-5 text-purple-500" /> },
    { label: 'Critical Issues Handled', value: 8, change: '+3 this month', icon: <AlertCircle className="w-5 h-5 text-red-500" /> },
  ];

  const priorityColors = {
    CRITICAL: 'text-red-700 bg-red-50 border-red-200',
    HIGH: 'text-orange-700 bg-orange-50 border-orange-200',
    MEDIUM: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    LOW: 'text-green-700 bg-green-50 border-green-200',
  };

  const scheduleStatus = [
    { time: '09:00 AM', title: 'Check ACUnit Lab 3', status: 'Scheduled' },
    { time: '11:00 AM', title: 'Install Printer', status: 'In Progress' },
    { time: '02:00 PM', title: 'Fix Door Lock', status: 'Pending' },
  ];

  return (
    <DashboardPageLayout
      eyebrow="Technician · Overview"
      title="Technician workspace"
      subtitle="Task overview and performance metrics (sample data)."
    >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Assigned</span>
              <Zap className="h-5 w-5 text-[#1E3A5F]" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{metrics.assigned}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">In progress</span>
              <Clock className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{metrics.inProgress}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Resolved</span>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{metrics.resolved}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Avg time</span>
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{metrics.avgResolutionTime}h</p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Performance metrics</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {performanceStats.map((stat, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-600 mb-1 font-medium">{stat.label}</p>
                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  {stat.icon}
                </div>
                <p className="text-xs text-slate-500 font-medium">{stat.change}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">Today&apos;s schedule</h3>
            <div className="space-y-3">
              {scheduleStatus.map((item, idx) => (
                <div key={idx} className="pb-3 border-b border-slate-200 last:border-0">
                  <p className="text-xs font-bold text-[#1E3A5F]">{item.time}</p>
                  <p className="text-sm text-slate-900 mt-1">{item.title}</p>
                  <span className={`text-xs mt-1 inline-block px-2 py-1 rounded font-medium ${
                    item.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    item.status === 'Scheduled' ? 'bg-slate-100 text-slate-800' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">Priority breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600 font-medium">Critical</span>
                  <span className="text-sm font-bold text-red-700">2</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-red-500" style={{ width: "40%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600 font-medium">High</span>
                  <span className="text-sm font-bold text-orange-700">3</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-orange-500" style={{ width: "60%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600 font-medium">Medium</span>
                  <span className="text-sm font-bold text-amber-700">1</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: "20%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">Quick actions</h3>
            <div className="space-y-2">
              <button type="button" className={`w-full py-2.5 text-sm ${campusBtnPrimary}`}>
                View assignments
              </button>
              <button
                type="button"
                className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Complete task
              </button>
              <button
                type="button"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Request support
              </button>
              <button
                type="button"
                className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                View reports
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">My assigned tickets</h2>
            <div className="flex gap-2">
              {['assigned', 'inProgress', 'resolved'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-[#1E3A5F] text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab === 'assigned' ? 'Assigned' : tab === 'inProgress' ? 'In Progress' : 'Resolved'}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {myTickets
              .filter(t => activeTab === 'assigned' || (activeTab === 'inProgress' && t.status === 'IN_PROGRESS') || (activeTab === 'resolved' && t.status === 'RESOLVED'))
              .map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="group flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{ticket.id}</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="font-semibold text-slate-900">{ticket.title}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {ticket.status === 'RESOLVED'
                        ? `Resolved on ${ticket.resolvedAt}`
                        : `Open for ${ticket.daysOpen} days`}
                    </p>
                  </div>
                  <Target className="h-5 w-5 text-slate-400 transition-colors group-hover:text-[#1E3A5F]" />
                </div>
              ))}
          </div>
        </div>
    </DashboardPageLayout>
  );
}
