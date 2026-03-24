import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { facilityApi } from '../../api/facilityApi';
import { MapPin, Users, Activity, Loader2, Navigation } from 'lucide-react';

export default function FacilitiesListPage() {
  // Fetch data using React Query seamlessly linked to our facilityApi.js
  const { data, isLoading, error } = useQuery({
    queryKey: ['facilities'],
    queryFn: () => facilityApi.getAllFacilities({ page: 0, size: 50 }),
  });

  // Handle Loading State cleanly
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh] space-y-4">
        <Loader2 className="animate-spin text-indigo-600 w-14 h-14" />
        <p className="text-gray-500 font-medium animate-pulse">Loading facilities...</p>
      </div>
    );
  }

  // Handle Error State 
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-gray-200 pb-6">
          <div>
            <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm mb-2 block">Campus Discovery</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Facilities Directory</h1>
          </div>
          <p className="text-gray-500 mt-4 md:mt-0 font-medium">Showing {facilities.length} available resources</p>
        </div>

        {facilities.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700">No Facilities Found</h3>
            <p className="text-gray-500">There are currently no active facilities stored in the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((f) => (
              <div 
                key={f.id} 
                className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 transform hover:-translate-y-2 flex flex-col"
              >
                {/* Image Placeholder generated via dynamic gradient corresponding to ID to keep it rich aesthetically */}
                <div className={`h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden flex items-center justify-center p-6 text-white text-center`}>
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
                  <h2 className="text-3xl font-extrabold tracking-tight relative z-10 leading-tight drop-shadow-md">
                    {f.name}
                  </h2>
                </div>
                
                <div className="p-8 flex flex-col flex-grow">
                  <div className="space-y-4 flex-grow mb-8">
                    <div className="flex items-center text-gray-600">
                      <div className="bg-blue-50 p-2 rounded-lg mr-4">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-700">{f.location || "Unspecified Location"}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <div className="bg-emerald-50 p-2 rounded-lg mr-4">
                        <Users className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="font-semibold text-gray-700">Capacity: {f.capacity}</span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <div className="bg-amber-50 p-2 rounded-lg mr-4">
                        <Activity className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="font-semibold text-gray-700 flex items-center">
                        Status: 
                        <span className={`px-3 py-1 text-xs rounded-full font-bold ml-3 uppercase tracking-wider ${f.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {f.status.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-between items-center border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      {f.resourceType.replace('_', ' ')}
                    </span>
                    <Link 
                      to={`/facilities/${f.id}`} 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-colors duration-200"
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
