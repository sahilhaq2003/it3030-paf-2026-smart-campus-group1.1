import React from 'react';

export default function DataTable({ columns, data }) {
  return (
    <table className="min-w-full bg-white border border-[#E2E8F0] rounded-xl">
      <thead className="bg-[#F8FAFC]">
        <tr>
          {columns.map(col => (
            <th key={col.accessor} className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-campus-brand-hover">{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="text-center py-6 text-gray-400">No data</td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr key={i} className="hover:bg-[#F8FAFC]">
              {columns.map(col => (
                <td key={col.accessor} className="px-4 py-3 border-b border-[#E2E8F0] text-sm">{row[col.accessor]}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
