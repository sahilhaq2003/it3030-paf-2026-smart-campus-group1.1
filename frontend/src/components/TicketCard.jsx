import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Clock } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import SLAStatusBadge from './SLAStatusBadge';
import { technicianCategoryLabel } from '../constants/technicianCategories';

const categoryConfig = {
  PLUMBING: '🔧',
  ELECTRICAL: '⚡',
  HVAC: '🌡️',
  PEST_CONTROL: '🐜',
  CLEANING: '🧹',
  CARPENTRY: '🪵',
  PAINTING: '🎨',
  LANDSCAPING: '🌿',
  SECURITY: '🔒',
  OTHER: '📋',
};

export default function TicketCard({ ticket, onSelect }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onSelect) onSelect(ticket.id);
    navigate(`/tickets/${ticket.id}`);
  };

  const priorityColor = {
    CRITICAL: 'border-l-red-500',
    HIGH: 'border-l-orange-500',
    MEDIUM: 'border-l-yellow-500',
    LOW: 'border-l-gray-500',
  };

  const createdLabel =
    ticket.createdAt != null && !Number.isNaN(new Date(ticket.createdAt).getTime())
      ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
      : '—';

  return (
    <div
      onClick={handleClick}
      className={`
        border-l-4 ${priorityColor[ticket.priority]} 
        bg-white rounded-lg shadow hover:shadow-md transition-shadow
        p-4 cursor-pointer
      `}
    >
      {/* Header row with title and badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 truncate flex items-center gap-2">
            <span className="text-lg">{categoryConfig[ticket.category] || '📋'}</span>
            {ticket.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{ticket.description}</p>
        </div>
      </div>

      {/* Meta information */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        {ticket.location && (
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            <span className="truncate">{ticket.location}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{createdLabel}</span>
        </div>
      </div>

      {/* Status and priority */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        {ticket.assignedToName && (
          <div className="flex flex-col max-w-[min(100%,11rem)] gap-1">
            <div className="flex items-center gap-2">
              {ticket.assignedToAvatarUrl ? (
                <img
                  src={ticket.assignedToAvatarUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full border border-blue-100 object-cover"
                  title={ticket.assignedToName}
                />
              ) : (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-800"
                  title={ticket.assignedToName}
                >
                  {ticket.assignedToName
                    .split(/\s+/)
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <span className="truncate text-xs font-medium text-blue-800">{ticket.assignedToName}</span>
            </div>
            {ticket.assignedToCategory && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 truncate">
                {technicianCategoryLabel(ticket.assignedToCategory)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* SLA Status Badge with Real-time Tracking */}
      <div className="mt-3">
        <SLAStatusBadge
          createdAt={ticket.createdAt}
          priority={ticket.priority}
          status={ticket.status}
          closedAt={ticket.closedAt || ticket.resolvedAt}
        />
      </div>
    </div>
  );
}
