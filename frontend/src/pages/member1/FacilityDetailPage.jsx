import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { facilityApi } from '../../api/facilityApi';
import { MapPin, Users, MonitorPlay, CalendarDays, Loader2, ArrowLeft } from 'lucide-react';


/**
 * FacilityDetailPage Component
 * 
 * Displays detailed information about a specific facility selected by the user.
 * Provides details like capacity, location, status, and allows the user
 * to proceed to the booking workflow if the facility is ACTIVE.
 */
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

  const getFacilityImage = (type) => {
    switch(type) {
      case 'LECTURE_HALL': return '/facilities/lecture_hall.png';
      case 'LAB': return '/facilities/lab.png';
      case 'MEETING_ROOM': return '/facilities/meeting.png';
      case 'EQUIPMENT': return '/facilities/equipment.png';
      default: return '/facilities/campus.png';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Immersive Header Banner */}
      <div className="relative h-[28rem] w-full bg-slate-900 overflow-hidden">
        <img 
          src={getFacilityImage(facility.resourceType)} 
          alt={facility.name}
          className="absolute inset-0 w-full h-full object-cover opacity-60 animate-in fade-in zoom-in duration-1000" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-900/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-transparent"></div>
        
        {/* Header Content */}
        <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-10 lg:px-20 max-w-7xl mx-auto drop-shadow-xl pt-10">
          <Link 
            to="/facilities" 
            className="inline-flex items-center text-white/80 hover:text-white mb-8 font-bold text-sm tracking-widest uppercase transition-colors w-max group"
          >
            <ArrowLeft className="w-5 h-5 mr-3 transition-transform group-hover:-translate-x-2" /> 
            Back to Directory
          </Link>
          
          <span className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-black tracking-[0.2em] uppercase mb-6 inline-block border border-white/20 w-max text-white shadow-xl">
            {facility.resourceType.replace('_', ' ')}
          </span>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-white leading-tight">
            {facility.name}
          </h1>
        </div>
      </div>
      
      {/* Overlapping Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-white p-8 sm:p-14">
          
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Left Column: Details */}
            <div className="lg:w-7/12 flex flex-col justify-center">
              <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">About this space</h3>
              <p className="text-slate-600 leading-relaxed text-lg mb-12">
                {facility.description || "Premium architectural space designed for modern university operations. Contact administration for detailed hardware specifications and access requirements."}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start p-6 bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-blue-100 transition-all duration-300 rounded-3xl group">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Location</p>
                    <p className="text-base font-bold text-slate-800">{facility.location || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start p-6 bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-emerald-100 transition-all duration-300 rounded-3xl group">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Capacity</p>
                    <p className="text-base font-bold text-slate-800">{facility.capacity} Persons</p>
                  </div>
                </div>

                <div className="flex items-start p-6 bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-amber-100 transition-all duration-300 rounded-3xl group">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                    <MonitorPlay className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Condition</p>
                    <p className={`text-base font-bold uppercase tracking-wide ${facility.status === 'ACTIVE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {facility.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-6 bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 rounded-3xl group">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Hours</p>
                    <p className="text-base font-bold text-slate-800">{facility.availabilityStart} — {facility.availabilityEnd}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Checkout/Booking Widget */}
            <div className="lg:w-5/12">
              <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 sticky top-24">
                <div className="mb-8">
                  <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-2">Reservation Status</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                    {facility.status === 'ACTIVE' ? 'Available' : 'Unavailable'}
                  </h3>
                  <p className="text-slate-500 font-medium mt-3 text-sm leading-relaxed">
                    Reserve this space today for your academic or organizational needs. Subject to campus approval.
                  </p>
                </div>
                
                <button 
                  onClick={() => navigate(`/facilities/${facility.id}/book`)}
                  disabled={facility.status !== 'ACTIVE'}
                  className={`w-full py-5 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl transition-all duration-500 transform relative overflow-hidden group
                    ${facility.status === 'ACTIVE' 
                      ? 'bg-slate-900 text-white hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/30' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {facility.status === 'ACTIVE' ? 'Request Booking' : 'Offline'}
                </button>
                
                {facility.status === 'ACTIVE' && (
                  <p className="text-center text-xs font-bold text-emerald-600 mt-5 tracking-wide">
                    ✓ Instant System Check
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
