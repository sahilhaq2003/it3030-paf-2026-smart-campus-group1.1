import React from 'react';

const statusStyles = {
  OPEN: 'bg-cyan-500 text-white border border-cyan-600 shadow-sm',
  IN_PROGRESS: 'bg-blue-600 text-white border border-blue-700 shadow-sm',
  RESOLVED: 'bg-emerald-600 text-white border border-emerald-700 shadow-sm',
  PENDING: 'bg-amber-600 text-white border border-amber-700 shadow-sm',
  REJECTED: 'bg-red-600 text-white border border-red-700 shadow-sm',
  APPROVED: 'bg-emerald-600 text-white border border-emerald-700 shadow-sm',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyles[status] || 'bg-slate-300 text-slate-700'}`}>{status}</span>
  );
}
