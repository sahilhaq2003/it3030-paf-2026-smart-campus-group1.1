import { useState, useEffect, useCallback } from 'react';
import { X, User } from 'lucide-react';
import { fetchTechnicians } from '../api/userAdminApi';

export default function AssignTechnicianModal({ isOpen, onClose, onAssign, currentTechnicianName, isReassignment = false }) {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTechniciansData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const technicianList = await fetchTechnicians();
      if (Array.isArray(technicianList)) {
        setTechnicians(technicianList);
      } else {
        setTechnicians([]);
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setError('Failed to load technicians');
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedTechId(null); // Reset selection when modal opens
      fetchTechniciansData();
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-96 flex flex-col border border-[#E2E8F0]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-gray-900">{isReassignment ? 'Reassign Technician' : 'Assign Technician'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Current Assignment Info */}
          {currentTechnicianName && (
            <div className="p-3 bg-campus-brand-soft border border-campus-brand-muted rounded-lg text-sm">
              <p className="text-campus-brand font-medium">
                Currently assigned to: <span className="font-semibold">{currentTechnicianName}</span>
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 mb-2">{error}</p>
              <button
                type="button"
                onClick={fetchTechniciansData}
                disabled={loading}
                className="text-xs text-red-600 hover:text-red-700 underline font-medium"
              >
                {loading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-4 border-gray-300 border-t-campus-brand rounded-full animate-spin" />
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
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedTechId === tech.id
                        ? 'border-campus-brand bg-campus-brand-soft'
                        : 'border-gray-200 hover:border-campus-brand-muted hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="technician"
                      value={tech.id}
                      checked={selectedTechId === tech.id}
                      onChange={() => setSelectedTechId(tech.id)}
                      className="mt-1 mr-3 cursor-pointer w-4 h-4 accent-campus-brand"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-campus-brand flex-shrink-0" />
                        <p className="font-medium text-gray-900 truncate">{tech.name}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{tech.email}</p>
                      {tech.role && (
                        <p className="text-xs text-gray-500 mt-0.5">
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
        <div className="flex gap-3 p-6 border-t border-[#E2E8F0] bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedTechId || loading}
            className="flex-1 px-4 py-2 bg-campus-brand text-white rounded-lg hover:bg-campus-brand-hover font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (isReassignment ? 'Reassigning...' : 'Assigning...') : (isReassignment ? 'Reassign' : 'Assign')}
          </button>
        </div>
      </div>
    </div>
  );
}
