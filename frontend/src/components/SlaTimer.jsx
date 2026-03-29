import { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

export default function SlaTimer({ createdAt, priority, status }) {
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [isBreached, setIsBreached] = useState(false);

  // SLA limits in hours
  const SLA_LIMITS = {
    CRITICAL: 2,
    HIGH: 8,
    MEDIUM: 24,
    LOW: 72,
  };

  useEffect(() => {
    const slaLimit = SLA_LIMITS[priority] || 24;

    const updateTimer = () => {
      if (!createdAt) return;

      const now = new Date();
      const created = new Date(createdAt);
      const elapsedMs = now - created;
      const elapsedHours = elapsedMs / (1000 * 60 * 60);
      
      const slaDeadline = new Date(created.getTime() + slaLimit * 60 * 60 * 1000);
      const remainingMs = slaDeadline - now;
      const remainingHours = remainingMs / (1000 * 60 * 60);

      setElapsed(Math.floor(elapsedHours * 100) / 100); // Round to 2 decimals
      setRemaining(remainingHours > 0 ? remainingHours : 0);
      
      // Check if SLA is breached (for resolved/closed tickets, check if resolved_at exceeded deadline)
      const isResolved = status === 'RESOLVED' || status === 'CLOSED';
      if (isResolved) {
        setIsBreached(false); // Resolved tickets don't breach
      } else {
        setIsBreached(elapsedHours > slaLimit);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [createdAt, priority, status]);

  if (!createdAt) return null;

  const slaLimit = SLA_LIMITS[priority] || 24;
  const isResolved = status === 'RESOLVED' || status === 'CLOSED';

  return (
    <div className={`rounded-lg border p-3 ${
      isBreached && !isResolved
        ? 'border-red-300 bg-red-50 shadow-sm ring-1 ring-red-100'
        : 'border-slate-200 bg-white'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" 
          style={{
            backgroundColor: isBreached && !isResolved ? '#fecaca' : '#e2e8f0',
            color: isBreached && !isResolved ? '#dc2626' : '#475569'
          }}>
          {isBreached && !isResolved ? (
            <AlertCircle size={16} strokeWidth={2} />
          ) : (
            <Clock size={16} strokeWidth={2} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {isBreached && !isResolved ? 'SLA Breached' : 'SLA Status'}
          </p>
          
          <p className="mt-1 flex items-baseline gap-2 text-sm">
            <span className={`font-bold tabular-nums ${
              isBreached && !isResolved ? 'text-red-700' : 'text-slate-900'
            }`}>
              {elapsed.toFixed(1)}h elapsed
            </span>
            <span className="text-xs text-slate-500">
              of {slaLimit}h SLA
            </span>
          </p>

          {!isResolved && remaining !== null && (
            <p className={`mt-1 text-xs font-medium ${
              isBreached
                ? 'text-red-700'
                : remaining < 1
                  ? 'text-amber-700'
                  : 'text-emerald-700'
            }`}>
              {isBreached ? (
                `⚠️ Breached by ${(elapsed - slaLimit).toFixed(1)}h`
              ) : remaining < 1 ? (
                `⏱️ ${Math.floor(remaining * 60)}m remaining`
              ) : (
                `✓ ${remaining.toFixed(1)}h remaining`
              )}
            </p>
          )}

          {isResolved && (
            <p className="mt-1 text-xs text-emerald-700 font-medium">
              ✓ Ticket resolved within SLA
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
