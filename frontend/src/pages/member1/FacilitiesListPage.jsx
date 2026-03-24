import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { facilityApi } from '../../api/facilityApi';
import { MapPin, Users, Activity, Loader2, Navigation, Search, Filter } from 'lucide-react';

export default function FacilitiesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current filters from URL to persist state
  const locationQ = searchParams.get('location') || '';
  const typeQ = searchParams.get('type') || '';
  const capacityQ = searchParams.get('capacity') || '';
  const statusQ = searchParams.get('status') || '';

  // Handle Filter Update mapping back to URL
  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Fetch data dynamically bridging to our new search API
  const { data, isLoading, error } = useQuery({
    queryKey: ['facilities', locationQ, typeQ, capacityQ, statusQ],
    queryFn: () => facilityApi.searchFacilities({ 
      location: locationQ || undefined,
      type: typeQ || undefined,
      capacity: capacityQ ? parseInt(capacityQ) : undefined,
      status: statusQ || undefined,
      page: 0, 
      size: 50 
    }),
  });

  // Handle Error State globally for the page
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl shadow-sm max-w-lg text-center font-medium">
          <p className="text-xl font-bold mb-2">Oops!</p>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  // Extract paginated slice
  const facilities = data?.content || [];

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-gray-200 pb-6">
          <div>
            <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm mb-2 block">Campus Discovery</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Facilities Directory</h1>
          </div>
          <p className="text-gray-500 mt-4 md:mt-0 font-medium">Showing {facilities.length} available resources</p>
        </div>

        {/* Dynamic Filter Bar */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-10">
          <div className="flex items-center gap-2 mb-5 text-gray-800 font-extrabold">
            <Filter className="w-5 h-5 text-indigo-500" />
            <span className="tracking-wide">REFINE SEARCH</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Location Filter */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search location..." 
                value={locationQ}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 font-medium text-gray-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>
            
            {/* Capacity Filter */}
            <div>
              <input 
                type="number" 
                placeholder="Minimum Capacity..." 
                value={capacityQ}
                onChange={(e) => handleFilterChange('capacity', e.target.value)}
                className="w-full bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl py-3.5 px-5 font-medium text-gray-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>

            {/* Resource Type Dropdown */}
            <div className="relative">
              <select 
                value={typeQ}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl py-3.5 px-5 font-medium text-gray-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">All Resource Types</option>
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Laboratory</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EQUIPMENT">Equipment</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <select 
                value={statusQ}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl py-3.5 px-5 font-medium text-gray-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Display Rendering */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-24 space-y-4 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100">
            <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
            <p className="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse">Running query...</p>
          </div>
        ) : facilities.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
            <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700">No Facilities Match Your Filters</h3>
            <p className="text-gray-500 mt-2">Try adjusting your capacity or status constraints.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((f) => (
              <div 
                key={f.id} 
                className="bg-white rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-indigo-100 border border-gray-100 overflow-hidden transition-all duration-300 transform hover:-translate-y-2 flex flex-col"
              >
                <div className={`h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden flex items-center justify-center p-6 text-white text-center`}>
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
                  <h2 className="text-3xl font-extrabold tracking-tight relative z-10 leading-tight drop-shadow-md">
                    {f.name}
                  </h2>
                </div>
                
                <div className="p-8 flex flex-col flex-grow bg-white">
                  <div className="space-y-4 flex-grow mb-8">
                    <div className="flex items-center text-gray-600">
                      <div className="bg-blue-50 p-2.5 rounded-xl mr-4">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-bold text-gray-700">{f.location || "Unspecified Location"}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <div className="bg-emerald-50 p-2.5 rounded-xl mr-4">
                        <Users className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="font-bold text-gray-700">Capacity: {f.capacity}</span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <div className="bg-amber-50 p-2.5 rounded-xl mr-4">
                        <Activity className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="font-bold text-gray-700 flex items-center">
                        Status: 
                        <span className={`px-3 py-1 text-xs rounded-full font-bold ml-3 uppercase tracking-wider ${f.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {f.status.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-between items-center border-t border-gray-100">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      {f.resourceType.replace('_', ' ')}
                    </span>
                    <Link 
                      to={`/facilities/${f.id}`} 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-colors duration-200"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
