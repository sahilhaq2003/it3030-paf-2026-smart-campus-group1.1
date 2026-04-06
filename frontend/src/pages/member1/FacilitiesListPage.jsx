import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { facilityApi } from '../../api/facilityApi';
import { MapPin, Users, Activity, Loader2, Navigation, Search, Filter, Scale, X } from 'lucide-react';

export default function FacilitiesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current filters from URL to persist state
  const locationQ = searchParams.get('location') || '';
  const typeQ = searchParams.get('type') || '';
  const capacityQ = searchParams.get('capacity') || '';
  const statusQ = searchParams.get('status') || '';

  // Facility Comparative Analysis State
  const [compareList, setCompareList] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

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

  const toggleCompare = (facility) => {
    setCompareList(prev => {
      const exists = prev.find(f => f.id === facility.id);
      if (exists) return prev.filter(f => f.id !== facility.id);
      if (prev.length >= 4) {
        alert("Comparative constraints allow a maximum of 4 facility matrices at a time.");
        return prev;
      }
      return [...prev, facility];
    });
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
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 relative pb-32">
      <div className="max-w-7xl mx-auto">
        {/* Header Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-gray-200 pb-6">
          <div>
            <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm mb-2 block animate-pulse">Campus Discovery Hub</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Facilities Directory</h1>
          </div>
          <p className="text-gray-500 mt-4 md:mt-0 font-medium tracking-wide">Showing {facilities.length} available architectural resources</p>
        </div>

        {/* Dynamic Filter Bar */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-10">
          <div className="flex items-center gap-2 mb-5 text-gray-800 font-extrabold">
            <Filter className="w-5 h-5 text-indigo-500" />
            <span className="tracking-wide text-lg">REFINE SYSTEM SEARCH</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location Filter */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search precise location..." 
                value={locationQ}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 font-medium text-gray-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>
            {/* Capacity Filter */}
            <div>
              <input 
                type="number" 
                placeholder="Minimum Capacity Constraint..." 
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
                <option value="">All Architectural Types</option>
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Computer/Science Lab</option>
                <option value="MEETING_ROOM">Meeting/Conference Room</option>
                <option value="EQUIPMENT">Hardware Resource</option>
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
                <option value="">All Condition Limits</option>
                <option value="ACTIVE">Active & Online</option>
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
            <p className="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse">Running architectural query...</p>
          </div>
        ) : facilities.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
            <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700">No Facilities Match Your Data Filters</h3>
            <p className="text-gray-500 mt-2">Try loosening your capacity or conditional search constraints.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((f) => (
              <div 
                key={f.id} 
                className={`bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-100 border-2 overflow-hidden transition-all duration-300 transform hover:-translate-y-2 flex flex-col ${compareList.find(c => c.id === f.id) ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-gray-100'}`}
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
                      <div className="bg-blue-50 p-2.5 rounded-xl mr-4 shadow-sm border border-blue-100">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-bold text-gray-700">{f.location || "Unspecified Location"}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <div className="bg-emerald-50 p-2.5 rounded-xl mr-4 shadow-sm border border-emerald-100">
                        <Users className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="font-bold text-gray-700">Capacity Limit: {f.capacity}</span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <div className="bg-amber-50 p-2.5 rounded-xl mr-4 shadow-sm border border-amber-100">
                        <Activity className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="font-bold text-gray-700 flex items-center">
                        Network Status: 
                        <span className={`px-3 py-1 text-xs rounded-full font-bold ml-3 uppercase tracking-wider shadow-sm ${f.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                          {f.status.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-between items-center border-t border-gray-100">
                    <button 
                      onClick={() => toggleCompare(f)}
                      className={`text-[12px] font-black uppercase tracking-widest px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${compareList.find(c => c.id === f.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' : 'bg-white border-gray-100 text-gray-500 hover:bg-indigo-50/50 hover:border-indigo-100 hover:text-indigo-600 shadow-sm'}`}
                    >
                      <Scale className="w-4 h-4" />
                      {compareList.find(c => c.id === f.id) ? 'Selected' : 'Compare'}
                    </button>
                    <Link 
                      to={`/facilities/${f.id}`} 
                      className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-transform hover:scale-[1.03] duration-200"
                    >
                      Details & Booking
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Innovation Sticky Action Bar */}
      {compareList.length > 0 && (
        <div 
          className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[45] animate-bounce hover:animate-none cursor-pointer group" 
          onClick={() => setIsCompareModalOpen(true)}
        >
          <div className="bg-gray-900 shadow-2xl rounded-full px-8 py-5 flex items-center gap-4 hover:bg-indigo-700 transition-colors border-4 border-indigo-400/30 group-hover:border-indigo-400">
            <Scale className="w-7 h-7 text-white" />
            <span className="text-white font-black tracking-widest uppercase text-sm">
              Cross-Analyze {compareList.length} Facilities
            </span>
            <div className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm ml-2">
              {compareList.length}
            </div>
          </div>
        </div>
      )}

      {/* Full Takeover Comparative Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsCompareModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 transform transition-all">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gray-50">
              <h2 className="text-3xl font-black text-gray-900 flex items-center gap-4 tracking-tight">
                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg border border-indigo-400">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                Facility Synthesis Matrix
              </h2>
              <button onClick={() => setIsCompareModalOpen(false)} className="bg-white border-2 border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 p-2.5 rounded-xl transition-all shadow-sm">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Table Body */}
            <div className="p-0 overflow-x-auto flex-grow bg-white">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="p-6 border-b border-gray-200 text-gray-400 font-black uppercase tracking-widest text-xs sticky left-0 z-20 w-48 shadow-[1px_0_0_0_#e5e7eb] bg-gray-50">Analytical Metric</th>
                    {compareList.map(f => (
                      <th key={f.id} className="p-6 border-b border-gray-200 font-extrabold text-gray-900 text-xl w-72 bg-white relative">
                        <div className="flex justify-between items-start gap-4">
                          <span className="leading-tight">{f.name}</span>
                          <button onClick={() => toggleCompare(f)} className="text-gray-300 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full p-1.5 transition-colors absolute top-4 right-4">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 font-bold text-gray-500 text-sm tracking-wide sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb] bg-white">Architecture Type</td>
                    {compareList.map(f => (
                      <td key={f.id} className="p-6 text-gray-900 font-bold uppercase tracking-wider text-xs">{f.resourceType.replace('_', ' ')}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 font-bold text-gray-500 text-sm tracking-wide sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb] bg-white">Maximum Users</td>
                    {compareList.map(f => (
                      <td key={f.id} className="p-6 text-indigo-600 font-black text-lg">{f.capacity} <span className="text-gray-400 text-sm font-semibold">Persons</span></td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 font-bold text-gray-500 text-sm tracking-wide sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb] bg-white">Physical Location</td>
                    {compareList.map(f => (
                      <td key={f.id} className="p-6 text-gray-800 font-semibold">{f.location || "N/A"}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 font-bold text-gray-500 text-sm tracking-wide sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb] bg-white">Daily Operations</td>
                    {compareList.map(f => (
                      <td key={f.id} className="p-6 text-gray-800 font-semibold">{f.availabilityStart} — {f.availabilityEnd}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 font-bold text-gray-500 text-sm tracking-wide sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb] bg-white">Network Condition</td>
                    {compareList.map(f => (
                      <td key={f.id} className="p-6">
                        <span className={`px-4 py-1.5 text-xs rounded-lg font-black uppercase tracking-widest ${f.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {f.status.replace('_', ' ')}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50/30">
                    <td className="p-6 font-bold text-gray-500 text-sm tracking-wide sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb]">Action Gate</td>
                    {compareList.map(f => (
                      <td key={f.id} className="p-6">
                         <Link onClick={() => setIsCompareModalOpen(false)} to={`/facilities/${f.id}`} className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-gray-300 inline-block transition-transform hover:-translate-y-0.5">
                           Route to Details →
                         </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              {compareList.length === 0 && (
                <div className="text-center py-20">
                  <Scale className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold text-lg">No matrices active.</p>
                  <p className="text-gray-400 text-sm">Return to the map and select components to analyze.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
