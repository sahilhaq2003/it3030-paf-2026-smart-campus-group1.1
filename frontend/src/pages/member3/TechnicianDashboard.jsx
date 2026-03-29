import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardPageLayout, campusBtnPrimary } from "../../components/dashboard/DashboardPrimitives";
import StatusBadge from "../../components/StatusBadge";
import { Clock, CheckCircle, AlertCircle, TrendingUp, BarChart3, Zap, Target } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";
import { ticketApi } from "../../api/ticketApi";
import Skeleton from "../../components/Skeleton";

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assigned');

  // Fetch assigned tickets for current technician
  const { data: ticketsData = {}, isLoading: ticketsLoading, error: ticketsError } = useQuery({
    queryKey: ['assignedTickets', user?.id],
    queryFn: () => ticketApi.getAssignedTickets({ page: 0, size: 100 }).then(r => r.data),
    enabled: !!user?.id,
  });

  const myTickets = ticketsData?.content || [];

  // Fetch performance stats for current technician
  const { data: allPerformance = [], isLoading: perfLoading } = useQuery({
    queryKey: ['technicianPerformance'],
    queryFn: () => ticketApi.getTechnicianPerformance().then(r => r.data),
  });

  // Get current technician's performance
  const myPerformance = allPerformance.find(p => p.technicianId === user?.id);

  // Calculate metrics from real data
  const metrics = {
    assigned: myTickets.filter(t => t.status !== 'RESOLVED').length,
    inProgress: myTickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: myTickets.filter(t => t.status === 'RESOLVED').length,
    avgResolutionTime: myPerformance?.avgResolutionHours?.toFixed(1) || '0.0',
  };

  // Build performance stats from real data
  const performanceStats = [
    { 
      label: 'Tickets Resolved (This Month)', 
      value: myPerformance?.ticketsResolved || 0, 
      change: 'From real data', 
      icon: <CheckCircle className="w-5 h-5 text-green-500" /> 
    },
    { 
      label: 'Avg Resolution Time', 
      value: `${metrics.avgResolutionTime} hrs`, 
      change: 'Average across resolved tickets', 
      icon: <Clock className="w-5 h-5 text-blue-500" /> 
    },
    { 
      label: 'Active Tickets', 
      value: metrics.assigned, 
      change: `${metrics.inProgress} in progress`, 
      icon: <TrendingUp className="w-5 h-5 text-purple-500" /> 
    },
    { 
      label: 'Critical Priority', 
      value: myTickets.filter(t => t.priority === 'CRITICAL').length, 
      change: 'Requires immediate attention', 
      icon: <AlertCircle className="w-5 h-5 text-red-500" /> 
    },
  ];

  // Calculate priority distribution from actual tickets
  const priorityDistribution = {
    critical: myTickets.filter(t => t.priority === 'CRITICAL').length,
    high: myTickets.filter(t => t.priority === 'HIGH').length,
    medium: myTickets.filter(t => t.priority === 'MEDIUM').length,
    low: myTickets.filter(t => t.priority === 'LOW').length,
  };

  const totalPriority = Object.values(priorityDistribution).reduce((a, b) => a + b, 0) || 1;

  const priorityColors = {
    CRITICAL: 'text-red-700 bg-red-50 border-red-200',
    HIGH: 'text-orange-700 bg-orange-50 border-orange-200',
    MEDIUM: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    LOW: 'text-green-700 bg-green-50 border-green-200',
  };

  return (
    <DashboardPageLayout
      eyebrow="Technician · Overview"
      title="Technician workspace"
      subtitle="Your assigned tickets and real-time performance metrics."
    >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Assigned</span>
              <Zap className="h-5 w-5 text-campus-brand" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{ticketsLoading ? '…' : metrics.assigned}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">In progress</span>
              <Clock className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{ticketsLoading ? '…' : metrics.inProgress}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Resolved</span>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{ticketsLoading ? '…' : metrics.resolved}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Avg time</span>
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{perfLoading ? '…' : `${metrics.avgResolutionTime}h`}</p>
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
                  <p className="text-xs font-bold text-campus-brand">{item.time}</p>
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
                  <span className="text-sm font-bold text-red-700">{priorityDistribution.critical}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-red-500" style={{ width: `${totalPriority > 0 ? (priorityDistribution.critical / totalPriority) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600 font-medium">High</span>
                  <span className="text-sm font-bold text-orange-700">{priorityDistribution.high}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-orange-500" style={{ width: `${totalPriority > 0 ? (priorityDistribution.high / totalPriority) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600 font-medium">Medium</span>
                  <span className="text-sm font-bold text-amber-700">{priorityDistribution.medium}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: `${totalPriority > 0 ? (priorityDistribution.medium / totalPriority) * 100 : 0}%` }} />
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
                      ? "bg-campus-brand text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab === 'assigned' ? 'Assigned' : tab === 'inProgress' ? 'In Progress' : 'Resolved'}
                </button>
              ))}
            </div>
          </div>

          {ticketsLoading ? (
            <div className="space-y-3">
              <Skeleton height={60} />
              <Skeleton height={60} />
              <Skeleton height={60} />
            </div>
          ) : ticketsError ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <p className="text-sm font-medium">Error loading tickets</p>
              <p className="text-xs mt-1">{ticketsError.message}</p>
            </div>
          ) : myTickets.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <p className="text-sm">No tickets assigned to you right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {myTickets
                .filter(t => activeTab === 'assigned' || (activeTab === 'inProgress' && t.status === 'IN_PROGRESS') || (activeTab === 'resolved' && t.status === 'RESOLVED'))
                .map(ticket => {
                  const daysOpen = ticket.createdAt ? Math.floor((new Date() - new Date(ticket.createdAt)) / (1000 * 60 * 60 * 24)) : 0;
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="group flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">TCK-{ticket.id}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${priorityColors[ticket.priority]}`}>
                            {ticket.priority}
                          </span>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <p className="font-semibold text-slate-900">{ticket.title}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          {ticket.status === 'RESOLVED'
                            ? `Resolved on ${ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : 'N/A'}`
                            : `Open for ${daysOpen} day${daysOpen !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <Target className="h-5 w-5 text-slate-400 transition-colors group-hover:text-campus-brand" />
                    </div>
                  );
                })}
            </div>
          )}
        </div>
    </DashboardPageLayout>
  );
}
