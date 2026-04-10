import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { facilityApi } from '../../api/facilityApi';
import { MapPin, Users, MonitorPlay, CalendarDays, Loader2, ArrowLeft } from 'lucide-react';


export default function FacilityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // React Query Fetch Detail dynamically
  const { data: facility, isLoading, error } = useQuery({
    queryKey: ['facility', id],
    queryFn: () => facilityApi.getFacilityById(id),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-purple-600 w-14 h-14" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 font-bold text-xl bg-white p-8 rounded-2xl shadow-sm border border-red-100">
          Error Loading Facility: {error.message}
        </div>
      </div>
    );
  }

  if (!facility) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Breadcrumb / Back button */}
        <Link 
          to="/facilities" 
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-8 font-bold text-sm tracking-wide bg-white px-4 py-2 rounded-full shadow-sm border border-indigo-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> 
          Back to Directory
        </Link>
        
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          
          {/* Header Banner */}
          <div className="h-64 sm:h-80 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative flex items-end p-8 sm:p-12">
            <div className="absolute inset-0 bg-black/20"></div> {/* Dark Overlay */}
            <div className="relative z-10 text-white w-full">
              <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold tracking-widest uppercase mb-4 inline-block shadow-sm">
                {facility.resourceType.replace('_', ' ')}
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight drop-shadow-lg leading-none">
                {facility.name}
              </h1>
            </div>
          </div>
          
          {/* Main Content Details */}
          <div className="p-8 sm:p-12">
            <h3 className="text-2xl font-black text-gray-900 mb-6">About this resource</h3>
            <p className="text-gray-600 leading-relaxed text-lg mb-12 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              {facility.description || "No specific description available. Contact administration for more details regarding this room's hardware and limitations."}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <div className="flex items-center p-6 bg-white border border-gray-100 shadow-sm rounded-3xl hover:border-blue-200 transition-colors">
                <div className="p-4 bg-blue-50 rounded-2xl mr-5 shadow-inner">
                  <MapPin className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Location Address</p>
                  <p className="text-lg font-bold text-gray-900">{facility.location || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center p-6 bg-white border border-gray-100 shadow-sm rounded-3xl hover:border-emerald-200 transition-colors">
                <div className="p-4 bg-emerald-50 rounded-2xl mr-5 shadow-inner">
                  <Users className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Maximum Capacity</p>
                  <p className="text-lg font-bold text-gray-900">{facility.capacity} Individuals</p>
                </div>
              </div>

              <div className="flex items-center p-6 bg-white border border-gray-100 shadow-sm rounded-3xl hover:border-amber-200 transition-colors">
                <div className="p-4 bg-amber-50 rounded-2xl mr-5 shadow-inner">
                  <MonitorPlay className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Condition</p>
                  <p className={`text-lg font-bold uppercase ${facility.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}>
                    {facility.status.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-6 bg-white border border-gray-100 shadow-sm rounded-3xl hover:border-purple-200 transition-colors">
                <div className="p-4 bg-purple-50 rounded-2xl mr-5 shadow-inner">
                  <CalendarDays className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Daily Availability</p>
                  <p className="text-lg font-bold text-gray-900">{facility.availabilityStart} — {facility.availabilityEnd}</p>
                </div>
              </div>
            </div>
            
            {/* Action Area */}
            <div className="flex justify-center border-t-2 border-dashed border-gray-200 pt-10 mt-8">
              <button 
                onClick={() => navigate(`/bookings/request?facilityId=${facility.id}`)}
                disabled={facility.status !== 'ACTIVE'}
                className={`w-full sm:w-auto px-14 py-5 rounded-2xl text-xl font-bold shadow-xl transition-all duration-300 transform 
                  ${facility.status === 'ACTIVE' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/30' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
              >
                {facility.status === 'ACTIVE' ? 'Proceed to Book Now' : 'Resource Unavailable'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
