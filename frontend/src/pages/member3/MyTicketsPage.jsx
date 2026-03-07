import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import PageContainer from '../../components/PageContainer';
import StatusBadge from '../../components/StatusBadge';
import { Search, Clock, BarChart3, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created');

  // Mock data
  const tickets = [
    { id: 'TCK-001', title: 'Broken Projector in Lab 3', status: 'OPEN', priority: 'HIGH', category: 'EQUIPMENT', created: '2026-03-07', daysOpen: 1 },
    { id: 'TCK-002', title: 'Leaky Faucet - Bathroom B1', status: 'IN_PROGRESS', priority: 'MEDIUM', category: 'PLUMBING', created: '2026-03-05', daysOpen: 3 },
    { id: 'TCK-003', title: 'WiFi Down - Conference Room', status: 'RESOLVED', priority: 'CRITICAL', category: 'IT', created: '2026-03-01', daysOpen: 7 },
    { id: 'TCK-004', title: 'Light Flickering - Corridor 2', status: 'OPEN', priority: 'LOW', category: 'ELECTRICAL', created: '2026-03-06', daysOpen: 2 },
    { id: 'TCK-005', title: 'AC Not Cooling - Lab 5', status: 'IN_PROGRESS', priority: 'HIGH', category: 'EQUIPMENT', created: '2026-03-04', daysOpen: 4 },
  ];

  // Filter and search
  const filtered = useMemo(() => {
    let result = tickets.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    // Sort
    if (sortBy === 'created') result.sort((a, b) => new Date(b.created) - new Date(a.created));
    else if (sortBy === 'priority') result.sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[a.priority] - { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[b.priority]));
    else if (sortBy === 'daysOpen') result.sort((a, b) => b.daysOpen - a.daysOpen);

    return result;
  }, [searchTerm, statusFilter, priorityFilter, sortBy]);

  // Stats
  const stats = [
    { label: 'Open', value: tickets.filter(t => t.status === 'OPEN').length, icon: <AlertCircle className="w-5 h-5 text-red-500" />, color: 'bg-red-50 border-red-200' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'IN_PROGRESS').length, icon: <Clock className="w-5 h-5 text-purple-500" />, color: 'bg-purple-50 border-purple-200' },
    { label: 'Resolved', value: tickets.filter(t => t.status === 'RESOLVED').length, icon: <CheckCircle className="w-5 h-5 text-green-500" />, color: 'bg-green-50 border-green-200' },
  ];

  const priorityColors = {
    CRITICAL: 'text-red-700 bg-red-50',
    HIGH: 'text-orange-700 bg-orange-50',
    MEDIUM: 'text-yellow-700 bg-yellow-50',
    LOW: 'text-green-700 bg-green-50',
  };

  return (
    <AppLayout>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">My Tickets</h1>
          <p className="text-slate-600">Track and manage your facility maintenance requests with ease</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-cyan-200 transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-400 transition-all text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-400 transition-all text-slate-700 font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Sort */}
          <div className="mt-3 flex gap-2">
            <span className="text-sm text-gray-600 self-center">Sort by:</span>
            {[['created', 'Date'], ['priority', 'Priority'], ['daysOpen', 'Days Open']].map(([option, label]) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  sortBy === option
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {tickets.length} tickets
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No tickets found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filtered.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="p-4 hover:bg-cyan-50/50 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">{ticket.id}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors">{ticket.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{ticket.category} • Open for {ticket.daysOpen} {ticket.daysOpen === 1 ? 'day' : 'days'}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate('/tickets/create')}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all"
          >
            + Create New Ticket
          </button>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
