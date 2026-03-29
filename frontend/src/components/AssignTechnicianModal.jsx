import { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { fetchTechnicians } from '../api/userAdminApi';

export default function AssignTechnicianModal({ isOpen, onClose, onAssign, currentTechnicianName }) {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTechniciansData();
    }
  }, [isOpen]);

  const fetchTechniciansData = async () => {
    setLoading(true);
    setError(null);
    try {
      const technicianList = await fetchTechnicians();
      setTechnicians(technicianList);
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setError('Failed to load technicians');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTechId) {
      alert('Please select a technician');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssign(selectedTechId);
      setSelectedTechId(null);
      onClose();
    } catch (err) {
      console.error('Error assigning technician:', err);
      setError(err.response?.data?.message || 'Failed to assign technician');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Assign Technician</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Current Assignment Info */}
          {currentTechnicianName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="text-blue-700">
                <strong>Currently assigned to:</strong> {currentTechnicianName}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            /* Technician List */
            <div className="space-y-2">
              {technicians.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No technicians available</p>
              ) : (
                technicians.map((tech) => (
                  <label
                    key={tech.id}
                    className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="technician"
                      value={tech.id}
                      checked={selectedTechId === tech.id}
                      onChange={() => setSelectedTechId(tech.id)}
                      className="mt-1 mr-3 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400 flex-shrink-0" />
                        <p className="font-medium text-gray-900 truncate">{tech.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{tech.email}</p>
                      {tech.role && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {tech.role}
                        </p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedTechId || loading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
