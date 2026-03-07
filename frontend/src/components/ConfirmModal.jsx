import React from 'react';

export default function ConfirmModal({ open, onConfirm, onCancel, message }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full border border-[#E2E8F0]">
        <div className="mb-4 text-lg font-semibold">Confirm</div>
        <div className="mb-6 text-gray-700">{message}</div>
        <div className="flex gap-4 justify-end">
          <button className="px-4 py-2 bg-[#1E3A5F] text-white rounded" onClick={onConfirm}>Confirm</button>
          <button className="px-4 py-2 bg-[#E2E8F0] text-[#1E3A5F] rounded" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
