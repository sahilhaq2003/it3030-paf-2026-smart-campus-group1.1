import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function SlaTimer({ createdAt, priority, status }) {
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [isBreached, setIsBreached] = useState(false);
  const [displayState, setDisplayState] = useState('on-track'); // on-track, warning, breached

  // SLA limits in hours
  const SLA_LIMITS = {
    CRITICAL: 2,
    HIGH: 8,
    MEDIUM: 24,
    LOW: 72,
  };

  // Format time to HH:MM format
  const formatTimeReadable = (hours) => {
    if (hours < 0) hours = 0;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
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

      setElapsed(elapsedHours);
      setRemaining(remainingHours > 0 ? remainingHours : 0);
      
      // Check if SLA is breached (for resolved/closed tickets, check if resolved_at exceeded deadline)
      const isResolved = status === 'RESOLVED' || status === 'CLOSED';
      if (isResolved) {
        setIsBreached(false); // Resolved tickets don't breach
        setDisplayState('completed');
      } else {
        const breached = elapsedHours > slaLimit;
        setIsBreached(breached);
        if (breached) {
          setDisplayState('breached');
        } else if (remainingHours <= 24 && remainingHours > 0) {
          setDisplayState('warning');
        } else {
          setDisplayState('on-track');
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update every second for smooth display

    return () => clearInterval(interval);
  }, [createdAt, priority, status]);

  if (!createdAt) return null;

  const slaLimit = SLA_LIMITS[priority] || 24;
  const isResolved = status === 'RESOLVED' || status === 'CLOSED';

  // Determine colors based on state
  let borderClass = 'border-slate-200 bg-white';
  let iconBg = '#e2e8f0';
  let iconColor = '#475569';
  let labelText = 'SLA Status';
  let statusColor = 'text-slate-900';
  let warningColor = 'text-emerald-700';
  let IconComponent = Clock;

  if (displayState === 'breached' && !isResolved) {
    borderClass = 'border-red-300 bg-red-50 shadow-sm ring-1 ring-red-100';
    iconBg = '#fecaca';
    iconColor = '#dc2626';
    labelText = 'SLA Breached';
    statusColor = 'text-red-700';
    warningColor = 'text-red-700';
    IconComponent = AlertCircle;
  } else if (displayState === 'warning' && !isResolved) {
    borderClass = 'border-orange-300 bg-orange-50';
    iconBg = '#fed7aa';
    iconColor = '#ea580c';
    labelText = 'SLA Warning';
    statusColor = 'text-orange-700';
    warningColor = 'text-orange-700';
    IconComponent = AlertCircle;
  } else if (isResolved) {
    borderClass = 'border-emerald-300 bg-emerald-50';
    iconBg = '#bbf7d0';
    iconColor = '#059669';
    labelText = 'SLA Status';
    statusColor = 'text-emerald-700';
    warningColor = 'text-emerald-700';
    IconComponent = CheckCircle;
  }

  return (
    <div className={`rounded-lg border p-3 ${borderClass}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" 
          style={{
            backgroundColor: iconBg,
            color: iconColor,
          }}>
          <IconComponent size={16} strokeWidth={2} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${statusColor}`}>
            {labelText}
          </p>
          
          <p className="mt-1 flex items-baseline gap-2 text-sm">
            <span className={`font-bold tabular-nums ${statusColor}`}>
              {formatTimeReadable(elapsed)} elapsed
            </span>
            <span className="text-xs text-slate-500">
              of {slaLimit}h SLA
            </span>
          </p>

          {!isResolved && remaining !== null && (
            <p className={`mt-1 text-xs font-medium ${warningColor}`}>
              {displayState === 'breached' ? (
                `⚠️ Breached by ${formatTimeReadable(elapsed - slaLimit)}`
              ) : (
                `✓ ${formatTimeReadable(remaining)} remaining`
              )}
            </p>
          )}

          {isResolved && (
            <p className="mt-1 text-xs font-medium text-emerald-700">
              ✓ Ticket resolved
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
