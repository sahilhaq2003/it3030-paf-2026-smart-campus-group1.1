import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facilityApi } from '../../api/facilityApi';
import { Edit2, Trash2, Plus, CheckCircle, XCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * AdminFacilitiesPage Component
 * 
 * Dedicated interface for administrators to manage campus facilities.
 * Allows creation, updating, active status toggling, and safely deleting
 * facility resources through interactive tables and modals.
 */
export default function AdminFacilitiesPage() {
  const queryClient = useQueryClient();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);

  // Form State controlled safely mapped to Backend DTOs
  const [formData, setFormData] = useState({
    name: '', resourceType: 'LECTURE_HALL', capacity: 1, location: '',
    description: '', availabilityStart: '08:00', availabilityEnd: '18:00', status: 'ACTIVE'
  });

  // Query Data 
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-facilities'],
    queryFn: () => facilityApi.getAllFacilities({ page: 0, size: 200 }) // Load extensive batch for table
  });

  // Mutations matching API Requirements
  const createMutation = useMutation({
    mutationFn: facilityApi.createFacility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      toast.success('Facility deployed securely!');
      closeModal();
    },
    onError: (err) => toast.error(err.message) // Native error mapping handled by our API file!
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => facilityApi.updateFacility(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      toast.success('Facility overwriten successfully!');
      closeModal();
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: facilityApi.deleteFacility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      toast.success('Facility erased completely!');
    },
    onError: (err) => toast.error(err.message) // Traps the ActiveBookingsExistException natively
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => facilityApi.updateFacilityStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      toast.success('Immediate patch executed successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  // Handlers
  const openModal = (facility = null) => {
    if (facility) {
      setEditingFacility(facility);
      setFormData({
        name: facility.name, resourceType: facility.resourceType, capacity: facility.capacity,
        location: facility.location || '', description: facility.description || '',
        // Cleanse HH:mm to fit nice input boxes seamlessly
        availabilityStart: facility.availabilityStart?.substring(0, 5) || '08:00',
        availabilityEnd: facility.availabilityEnd?.substring(0, 5) || '18:00',
        status: facility.status
      });
    } else {
      setEditingFacility(null);
      setFormData({
        name: '', resourceType: 'LECTURE_HALL', capacity: 1, location: '',
        description: '', availabilityStart: '08:00', availabilityEnd: '18:00', status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // Parse HTML5 Form
  const handleSubmit = (e) => {
    e.preventDefault();
    // Spring Boot expects HH:mm or HH:mm:ss gracefully. Formatting here maps securely.
    const payload = {
      ...formData,
      capacity: parseInt(formData.capacity),
      availabilityStart: formData.availabilityStart.length === 5 ? `${formData.availabilityStart}:00` : formData.availabilityStart,
      availabilityEnd: formData.availabilityEnd.length === 5 ? `${formData.availabilityEnd}:00` : formData.availabilityEnd,
    };

    if (editingFacility) {
      updateMutation.mutate({ id: editingFacility.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Immediate toggle action 
  const handleToggleStatus = (facility) => {
    const newStatus = facility.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE';
    toggleStatusMutation.mutate({ id: facility.id, status: newStatus });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Attempt deletion of ${name}? (Restricted if booked)`)) {
      deleteMutation.mutate(id);
    }
  };

  const facilities = data?.content || [];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Facilities Management</h1>
            <p className="text-gray-500 font-medium">Add, Edit, and Override Resources Globally</p>
          </div>
          <button
            onClick={() => openModal()}
            className="mt-4 sm:mt-0 flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all"
          >
            <Plus className="w-5 h-5 mr-2" /> Register Facility
          </button>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Facility Hub</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Specs</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Condition</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10">
                      <Loader2 className="animate-spin w-8 h-8 text-indigo-600 mx-auto" />
                      <p className="text-gray-500 font-medium tracking-wide mt-2">Loading Data...</p>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10">
                      <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl mx-auto max-w-lg shadow-sm border border-red-100">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                        <p className="font-bold text-lg mb-1">Failed to load facilities</p>
                        <p className="text-sm">{error.message}</p>
                      </div>
                    </td>
                  </tr>
                ) : facilities.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16 text-gray-400 font-medium">
                      No facilities exist in the registry yet.
                    </td>
                  </tr>
                ) : facilities.map((facility) => (
                  <tr key={facility.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{facility.name}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{facility.resourceType.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 font-medium">Limit: {facility.capacity}</div>
                      <div className="text-xs text-gray-500">[{facility.availabilityStart} - {facility.availabilityEnd}]</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-lg font-medium">{facility.location || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(facility)}
                        disabled={toggleStatusMutation.isPending}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all ${facility.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 hover:ring-green-300'
                          : 'bg-red-100 text-red-700 hover:ring-red-300'
                          }`}
                      >
                        {facility.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {facility.status.replace('_', ' ')}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => openModal(facility)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(facility.id, facility.name)}
                          className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tailwind Integrated Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            {/* Background Overlay */}
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal} />

            {/* Modal Box */}
            <div className="relative inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl w-full">
              <div className="bg-white px-8 pt-8 pb-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-extrabold text-gray-900 border-b-2 border-indigo-500 pb-2">
                    {editingFacility ? 'Override Facility' : 'New Facility Registry'}
                  </h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-2 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Facility Name</label>
                      <input
                        required type="text"
                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border-gray-300 bg-gray-50 border focus:bg-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Architecture Type</label>
                      <select
                        value={formData.resourceType} onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                        className="w-full border-gray-300 bg-gray-50 border focus:bg-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="LECTURE_HALL">Lecture Hall</option>
                        <option value="LAB">Computer/Science Lab</option>
                        <option value="MEETING_ROOM">Meeting/Conference Room</option>
                        <option value="EQUIPMENT">Hardware Equipment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Maximum User Capacity</label>
                      <input
                        required type="number" min="1"
                        value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className="w-full border-gray-300 bg-gray-50 border focus:bg-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Exact Location String</label>
                      <input
                        type="text"
                        value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full border-gray-300 bg-gray-50 border focus:bg-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Open Time</label>
                      <input
                        type="time" required
                        value={formData.availabilityStart} onChange={(e) => setFormData({ ...formData, availabilityStart: e.target.value })}
                        className="w-full border-gray-300 bg-gray-50 border focus:bg-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Close Time</label>
                      <input
                        type="time" required
                        value={formData.availabilityEnd} onChange={(e) => setFormData({ ...formData, availabilityEnd: e.target.value })}
                        className="w-full border-gray-300 bg-gray-50 border focus:bg-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Current Status</label>
                      <select
                        value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full border-gray-300 bg-gray-50 border focus:bg-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="ACTIVE">Active (Available)</option>
                        <option value="OUT_OF_SERVICE">Out of Service</option>
                        <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                      <textarea
                        rows="3"
                        value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full border-gray-300 bg-gray-50 border focus:bg-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3 bg-gray-50 -mx-8 -mb-4 px-8 py-5">
                    <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50">Cancel</button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all flex items-center"
                    >
                      {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                      {editingFacility ? 'Apply Changes' : 'Draft Registry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
