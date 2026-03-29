import { Check, Clock } from 'lucide-react';

export default function TicketStatusStepper({ status, resolvedAt, closedAt }) {
  const steps = [
    { label: 'Open', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' },
  ];

  const getStatusIndex = () => {
    return steps.findIndex((step) => step.value === status);
  };

  const currentIndex = getStatusIndex();

  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.value} className="flex flex-col items-center flex-1">
            {/* Circle with icon or number */}
            <div
              className={`
                flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-all
                ${index <= currentIndex
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
                }
              `}
            >
              {index < currentIndex ? (
                <Check size={20} />
              ) : index === currentIndex ? (
                <Clock size={20} />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>

            {/* Label */}
            <span
              className={`text-xs font-medium text-center ${
                index <= currentIndex ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {step.label}
            </span>

            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div
                className={`
                  absolute h-1 w-1/6 top-5 left-1/2 transition-all
                  ${index < currentIndex ? 'bg-blue-500' : 'bg-gray-300'}
                `}
                style={{
                  transform: 'translateX(50%)',
                  marginLeft: index === 0 ? '4rem' : '-4rem',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Status info */}
      <div className="mt-4 text-xs text-gray-600">
        {status === 'CLOSED' && closedAt && (
          <p>Closed on {new Date(closedAt).toLocaleDateString()}</p>
        )}
        {status === 'RESOLVED' && resolvedAt && (
          <p>Resolved on {new Date(resolvedAt).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}
