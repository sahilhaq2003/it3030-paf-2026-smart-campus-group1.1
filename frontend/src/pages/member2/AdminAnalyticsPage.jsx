import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBookingAnalytics } from "../../api/bookingApi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, LabelList
} from "recharts";
import { Maximize2, Minimize2 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [showAllPeakHours, setShowAllPeakHours] = useState(false);

  //gets all analytics data from backend
  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookingAnalytics"],
    queryFn: () => getBookingAnalytics().then((r) => r.data),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">Loading analytics...</div>
  );

  if (isError) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-rose-500 font-bold">Failed to load analytics.</div>
  );

  // Top Facilities Data
  const allFacilityData = Object.entries(data.facilityCount || {})
    .map(([name, count]) => ({ name, count: Number(count) }))
    .sort((a, b) => b.count - a.count);

  const facilityDataToDisplay = showAllFacilities ? allFacilityData.slice(0, 10) : allFacilityData.slice(0, 3);

  // Peak Hours Data
  let allPeakHoursData = Object.entries(data.peakHours || {})
    .map(([hour, count]) => {
      const hourInt = parseInt(hour.split(':')[0], 10);
      const ampm = hourInt >= 12 ? 'PM' : 'AM';
      const formattedTime = `${hourInt % 12 || 12}:00 ${ampm}`;
      return {
        Time: formattedTime,
        Bookings: Number(count),
        _rawHour: hour
      };
    });

  // Sort Peak Hours: by volume descending if showing Top 3, otherwise chronologically if showing All
  if (showAllPeakHours) {
    allPeakHoursData.sort((a, b) => a._rawHour.localeCompare(b._rawHour));
  } else {
    allPeakHoursData.sort((a, b) => b.Bookings - a.Bookings);
  }

  const peakHoursToDisplay = showAllPeakHours ? allPeakHoursData : allPeakHoursData.slice(0, 3);

  // Bookings Per Day Data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const dailyData = last7Days.map(date => ({
    date,
    count: Number((data.bookingsPerDay && data.bookingsPerDay[date]) || 0)
  }));

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 mt-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Booking Analytics</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Overview of booking activity and usage trends.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total Bookings</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{data.total}</p>
          </div>
          <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Pending</p>
            <p className="text-3xl font-black text-amber-500 mt-2">{data.pending}</p>
          </div>
          <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Rejected</p>
            <p className="text-3xl font-black text-rose-500 mt-2">{data.rejected}</p>
          </div>
          <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Cancelled</p>
            <p className="text-3xl font-black text-slate-600 mt-2">{data.cancelled}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Peak Hours Chart */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">Peak Booking Hours</h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">{showAllPeakHours ? 'All active booking hours chronologically' : 'Top 3 most popular booking hours'}</p>
              </div>
              <button
                onClick={() => setShowAllPeakHours(!showAllPeakHours)}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-indigo-600 rounded-xl transition-colors font-bold text-xs flex items-center gap-1 border border-slate-100 shadow-sm"
              >
                {showAllPeakHours ? <><Minimize2 className="w-3.5 h-3.5" /> Show Top 3</> : <><Maximize2 className="w-3.5 h-3.5" /> View All</>}
              </button>
            </div>
            <div className="flex-1 min-h-[250px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursToDisplay} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="Time"
                    tick={{ fontSize: 11, fill: '#64748b', angle: showAllPeakHours ? -45 : 0, textAnchor: showAllPeakHours ? 'end' : 'middle' }}
                    height={showAllPeakHours ? 60 : 30}
                    interval={0}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Bar
                    dataKey="Bookings"
                    name="Total Bookings"
                    fill="#6366f1"
                    radius={[8, 8, 0, 0]}
                    barSize={showAllPeakHours ? 30 : 60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Facilities Chart */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">Top Booked Facilities</h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">{showAllFacilities ? 'Top 10 facilities by popularity' : 'Top 3 most popular facilities'}</p>
              </div>
              <button
                onClick={() => setShowAllFacilities(!showAllFacilities)}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-indigo-600 rounded-xl transition-colors font-bold text-xs flex items-center gap-1 border border-slate-100 shadow-sm"
              >
                {showAllFacilities ? <><Minimize2 className="w-3.5 h-3.5" /> Show Top 3</> : <><Maximize2 className="w-3.5 h-3.5" /> View Top 10</>}
              </button>
            </div>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facilityDataToDisplay} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={showAllFacilities ? false : { fontSize: 11, fill: '#64748b' }}
                    height={40}
                    interval={0}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={!showAllFacilities}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Bar
                    dataKey="count"
                    name="Bookings"
                    fill="#38bdf8"
                    radius={[8, 8, 0, 0]}
                    barSize={showAllFacilities ? 30 : 60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bookings Per Day Chart */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight text-slate-900 mb-6">Bookings Per Day (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b', angle: -45, textAnchor: 'end' }}
                height={75}
                interval={0}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
                label={{ value: 'Date (Last 7 Days)', position: 'insideBottom', fill: '#94a3b8', fontSize: 11, fontWeight: 'bold', offset: -5 }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Bookings"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 5, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}