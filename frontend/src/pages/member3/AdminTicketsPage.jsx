import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import PageContainer from '../../components/PageContainer';
import StatusBadge from '../../components/StatusBadge';
import { Search, Trash2, CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selected, setSelected] = useState([]);
  const [sortBy, setSortBy] = useState('created');

  // Mock data
  const tickets = [
    { id: 'TCK-001', title: 'Network Issue', status: 'IN_PROGRESS', priority: 'CRITICAL', assignedTo: 'Tech A', reporter: 'John D', created: '2026-03-07' },
    { id: 'TCK-002', title: 'Broken Chair', status: 'REJECTED', priority: 'LOW', assignedTo: 'Tech B', reporter: 'Jane S', created: '2026-03-05' },
    { id: 'TCK-003', title: 'AC Maintenance', status: 'OPEN', priority: 'HIGH', assignedTo: null, reporter: 'Mike P', created: '2026-03-06' },
    { id: 'TCK-004', title: 'WiFi Setup', status: 'RESOLVED', priority: 'MEDIUM', assignedTo: 'Tech C', reporter: 'Sarah L', created: '2026-03-01' },
    { id: 'TCK-005', title: 'Door Lock', status: 'IN_PROGRESS', priority: 'HIGH', assignedTo: 'Tech A', reporter: 'Bob M', created: '2026-03-04' },
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

    return result;
  }, [searchTerm, statusFilter, priorityFilter, sortBy]);

  // Stats
  const stats = [
    { label: 'Total', value: tickets.length, color: 'bg-blue-50 border-blue-200', icon: '📊' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'IN_PROGRESS').length, color: 'bg-purple-50 border-purple-200', icon: '⏳' },
    { label: 'Unassigned', value: tickets.filter(t => !t.assignedTo).length, color: 'bg-orange-50 border-orange-200', icon: '👤' },
    { label: 'Resolved', value: tickets.filter(t => t.status === 'RESOLVED').length, color: 'bg-green-50 border-green-200', icon: '✅' },
  ];

  const priorityColors = {
    CRITICAL: 'text-red-700 bg-red-50',
    HIGH: 'text-orange-700 bg-orange-50',
    MEDIUM: 'text-yellow-700 bg-yellow-50',
    LOW: 'text-green-700 bg-green-50',
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(t => t.id));
  };

  const bulkDelete = () => {
    if (window.confirm(`Delete ${selected.length} ticket(s)?`)) {
      setSelected([]);
      alert('Tickets deleted!');
    }
  };

  const bulkAssign = () => {
    const tech = prompt('Assign to technician:');
    if (tech) {
      setSelected([]);
      alert(`Assigned to ${tech}!`);
    }
  };

  const bulkStatus = (newStatus) => {
    setSelected([]);
    alert(`${selected.length} ticket(s) status updated!`);
  };

  return (
    <AppLayout>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">All Tickets</h1>
          <p className="text-slate-600">Manage and oversee all facility tickets with powerful tools</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {stats.map((stat, idx) => (
            <div key={idx} className={`border rounded-xl p-4 bg-white hover:shadow-lg hover:scale-105 transition-all duration-300 ${stat.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 mb-1 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-4 gap-3 mb-3">
            {/* Search */}
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
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
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-400 text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-400 text-slate-700 font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Sort Buttons */}
          <div className="flex gap-2">
            <span className="text-sm text-slate-600 self-center font-medium">Sort by:</span>
            {[['created', 'Date'], ['priority', 'Priority']].map(([option, label]) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
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

        {/* Bulk Actions */}
        {selected.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-300 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-semibold text-blue-900">{selected.length} ticket(s) selected</p>
            </div>
            <div className="flex gap-2">
              <button onClick={bulkAssign} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium transition-all hover:shadow-lg">
                Assign
              </button>
              <button onClick={() => bulkStatus('RESOLVED')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-medium transition-all hover:shadow-lg">
                Resolve
              </button>
              <button onClick={bulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-medium transition-all hover:shadow-lg">
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="mb-4 text-sm text-slate-600 font-medium">
          Showing {filtered.length} of {tickets.length} tickets
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 text-lg">No tickets found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {/* Header with select all */}
              <div className="p-4 bg-slate-50 flex items-center gap-3 border-b border-slate-200">
                <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} />
                <div className="flex-1 grid grid-cols-5 gap-4 text-xs font-bold text-slate-700">
                  <div>Ticket ID</div>
                  <div>Title</div>
                  <div>Status</div>
                  <div>Assigned To</div>
                  <div>Priority</div>
                </div>
              </div>

              {/* Rows */}
              {filtered.map(ticket => (
                <div key={ticket.id} className="p-4 hover:bg-cyan-50/30 flex items-center gap-3 group transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.includes(ticket.id)}
                    onChange={() => toggleSelect(ticket.id)}
                  />
                  <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                    <div className="text-xs font-bold text-purple-700 bg-purple-100/50 px-2 py-1 rounded w-fit">{ticket.id}</div>
                    <div>
                      <p className="font-semibold text-slate-900 cursor-pointer hover:text-cyan-600 transition-colors" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                        {ticket.title}
                      </p>
                      <p className="text-xs text-slate-500">{ticket.reporter}</p>
                    </div>
                    <div>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {ticket.assignedTo ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">{ticket.assignedTo}</span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">Unassigned</span>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold w-fit ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
