import React from 'react';

export default function ConfirmModal({ open, onConfirm, onCancel, message }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full border border-[#E2E8F0]">
        <div className="mb-4 text-lg font-semibold">Confirm</div>
        <div className="mb-6 text-gray-700">{message}</div>
        <div className="flex gap-4 justify-end">
          <button type="button" className="rounded-lg bg-campus-brand px-4 py-2 text-white transition hover:bg-campus-brand-hover" onClick={onConfirm}>Confirm</button>
          <button type="button" className="rounded-lg bg-slate-200 px-4 py-2 text-campus-brand-hover transition hover:bg-slate-300" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
