import React from 'react';

const statusStyles = {
  OPEN: "border border-[#152a45] bg-[#1E3A5F] text-white shadow-sm",
  IN_PROGRESS: "border border-blue-800 bg-blue-700 text-white shadow-sm",
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
