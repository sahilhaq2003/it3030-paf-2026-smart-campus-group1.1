import { useEffect } from "react";

const DEFAULT_AUTO_HIDE_MS = 3500;

export default function FlashToast({ message, onClose, autoHideMs = DEFAULT_AUTO_HIDE_MS }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onClose?.(), autoHideMs);
    return () => clearTimeout(timer);
  }, [autoHideMs, message, onClose]);

  if (!message) return null;

  return (
    <div
      className="pointer-events-auto fixed right-4 top-4 z-[70] w-[min(92vw,24rem)] overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-lg shadow-slate-900/10 sm:right-6 sm:top-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
          aria-hidden
        >
          ✓
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Login successful</p>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Dismiss message"
        >
          ×
        </button>
      </div>
      <div className="h-1 w-full bg-emerald-500/80" />
    </div>
  );
}
