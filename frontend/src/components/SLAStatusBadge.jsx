import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function SLAStatusBadge({ createdAt, priority, status, closedAt }) {
  const [remaining, setRemaining] = useState(null);
  const [isBreached, setIsBreached] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [displayTime, setDisplayTime] = useState('');
  const [state, setState] = useState('on-track'); // on-track, warning, breached, completed

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
    if (!createdAt) return;

    const slaLimit = SLA_LIMITS[priority] || 24;
    const isClosed = status === 'CLOSED' || status === 'RESOLVED';

    const updateTimer = () => {
      const now = new Date();
      const created = new Date(createdAt);
      const elapsedMs = now - created;
      const elapsedHours = elapsedMs / (1000 * 60 * 60);

      const slaDeadline = new Date(created.getTime() + slaLimit * 60 * 60 * 1000);
      const remainingMs = slaDeadline - now;
      const remainingHours = remainingMs / (1000 * 60 * 60);

      setElapsed(elapsedHours);

      // For closed tickets, use closedAt if provided
      if (isClosed && closedAt) {
        const closedDate = new Date(closedAt);
        const totalElapsedMs = closedDate - created;
        const totalElapsedHours = totalElapsedMs / (1000 * 60 * 60);

        // Check if it was closed within SLA
        const closedWithinSla = totalElapsedHours <= slaLimit;
        const breachedBy = Math.max(0, totalElapsedHours - slaLimit);

        setDisplayTime(formatTimeReadable(totalElapsedHours));
        setRemaining(0);
        setState('completed');
        setIsBreached(!closedWithinSla);
      } else if (isClosed) {
        // No closedAt provided, use elapsed time
        setDisplayTime(formatTimeReadable(elapsedHours));
        setRemaining(0);
        setState('completed');
        setIsBreached(elapsedHours > slaLimit);
      } else {
        // Ticket is still open
        setRemaining(Math.max(0, remainingHours));

        if (remainingHours <= 0) {
          // Breached
          setState('breached');
          setIsBreached(true);
          setDisplayTime(formatTimeReadable(Math.abs(remainingHours)));
        } else if (remainingHours <= 24) {
          // Warning (less than 24 hours)
          setState('warning');
          setIsBreached(false);
          setDisplayTime(formatTimeReadable(remainingHours));
        } else {
          // On track
          setState('on-track');
          setIsBreached(false);
          setDisplayTime(formatTimeReadable(remainingHours));
        }
      }
    };

    updateTimer();
    // Update every second for real-time display
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt, priority, status, closedAt]);

  if (!createdAt) return null;

  const getStateConfig = () => {
    switch (state) {
      case 'breached':
        return {
          icon: AlertCircle,
          label: 'SLA Breached',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-700',
          accentBg: '#fecaca',
          accentColor: '#dc2626',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          label: 'SLA Warning',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          textColor: 'text-orange-700',
          accentBg: '#fed7aa',
          accentColor: '#ea580c',
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: isBreached ? 'SLA Breached' : 'SLA Met',
          bgColor: isBreached ? 'bg-red-50' : 'bg-green-50',
          borderColor: isBreached ? 'border-red-300' : 'border-green-300',
          textColor: isBreached ? 'text-red-700' : 'text-green-700',
          accentBg: isBreached ? '#fecaca' : '#bbf7d0',
          accentColor: isBreached ? '#dc2626' : '#059669',
        };
      default: // on-track
        return {
          icon: Clock,
          label: 'SLA On Track',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          textColor: 'text-green-700',
          accentBg: '#bbf7d0',
          accentColor: '#059669',
        };
    }
  };

  const config = getStateConfig();
  const IconComponent = config.icon;

  return (
    <div className={`rounded-lg border p-3 flex items-center gap-3 ${config.bgColor} ${config.borderColor}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: config.accentBg,
          color: config.accentColor,
        }}
      >
        <IconComponent size={16} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wide ${config.textColor}`}>
          {config.label}
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className={`text-sm font-bold tabular-nums ${config.textColor}`}>
            {state === 'breached' ? (
              <>Exceeded by {displayTime}</>
            ) : state === 'completed' ? (
              <>Total: {displayTime}</>
            ) : (
              <>Time remaining: {displayTime}</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
