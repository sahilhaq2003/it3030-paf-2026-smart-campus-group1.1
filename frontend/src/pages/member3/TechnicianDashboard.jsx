import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import PageContainer from '../../components/PageContainer';
import StatusBadge from '../../components/StatusBadge';
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
    <AppLayout>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">Technician Dashboard</h1>
          <p className="text-slate-600">Your task overview and performance metrics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 font-medium">Assigned</span>
              <Zap className="w-5 h-5 text-cyan-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{metrics.assigned}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 font-medium">In Progress</span>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{metrics.inProgress}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 font-medium">Resolved</span>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{metrics.resolved}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 font-medium">Avg Time</span>
              <BarChart3 className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{metrics.avgResolutionTime}h</p>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceStats.map((stat, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all">
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

        {/* Schedule & Tasks */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Today's Schedule */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Today's Schedule</h3>
            <div className="space-y-3">
              {scheduleStatus.map((item, idx) => (
                <div key={idx} className="pb-3 border-b border-slate-200 last:border-0">
                  <p className="text-xs font-bold text-cyan-600">{item.time}</p>
                  <p className="text-sm text-slate-900 mt-1">{item.title}</p>
                  <span className={`text-xs mt-1 inline-block px-2 py-1 rounded font-medium ${
                    item.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    item.status === 'Scheduled' ? 'bg-cyan-100 text-cyan-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Priority Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600 font-medium">Critical</span>
                  <span className="text-sm font-bold text-red-700">2</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600 font-medium">High</span>
                  <span className="text-sm font-bold text-orange-700">3</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600 font-medium">Medium</span>
                  <span className="text-sm font-bold text-amber-700">1</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-amber-400 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition">
                View Assignments
              </button>
              <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
                Complete Task
              </button>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                Request Support
              </button>
              <button className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition">
                View Reports
              </button>
            </div>
          </div>
        </div>

        {/* Assigned Tickets */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">My Assigned Tickets</h2>
            <div className="flex gap-2">
              {['assigned', 'inProgress', 'resolved'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                  className="p-4 hover:bg-cyan-50/30 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-purple-700 bg-purple-100/50 px-2 py-1 rounded">{ticket.id}</span>
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
                  <Target className="w-5 h-5 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                </div>
              ))}
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
