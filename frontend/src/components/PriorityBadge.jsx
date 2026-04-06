export default function PriorityBadge({ priority }) {
  const priorityConfig = {
    CRITICAL: { color: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    HIGH: { color: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    MEDIUM: { color: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    LOW: { color: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  };

  const config = priorityConfig[priority] || priorityConfig.LOW;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color} ${config.text} ${config.border}`}
    >
      {priority}
    </span>
  );
}
