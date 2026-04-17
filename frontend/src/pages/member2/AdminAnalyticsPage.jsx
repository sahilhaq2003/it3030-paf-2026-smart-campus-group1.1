import { useQuery } from "@tanstack/react-query";
import { getBookingAnalytics } from "../../api/bookingApi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b"];

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookingAnalytics"],
    queryFn: () => getBookingAnalytics().then((r) => r.data),
  });

  if (isLoading) return (
    <div className="p-6 text-center text-gray-500">Loading analytics...</div>
  );

  if (isError) return (
    <div className="p-6 text-center text-red-500">Failed to load analytics.</div>
  );

  

  const facilityData = Object.entries(data.facilityCount || {})
    .map(([name, count]) => ({ name, count: Number(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

    // Generate exactly the last 7 calendar days (including today)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Map our generated last 7 days to the backend data (or 0 if no bookings that day)
  const dailyData = last7Days.map(date => ({
    date, 
    count: Number((data.bookingsPerDay && data.bookingsPerDay[date]) || 0)
  }));


     const peakHoursData = Object.entries(data.peakHours || {})
    // Sort by 24h time first so the bars are in chronological order
    .sort(([hourA], [hourB]) => hourA.localeCompare(hourB))
    .map(([hour, count]) => {
      // Convert "08:00" to "8:00 AM"
      const hourInt = parseInt(hour.split(':')[0], 10);
      const ampm = hourInt >= 12 ? 'PM' : 'AM';
      const formattedTime = `${hourInt % 12 || 12}:00 ${ampm}`;
      
      return { 
        Time: formattedTime, 
        Bookings: Number(count) 
      };
    });

  

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Booking Analytics</h1>
        <p className="text-gray-500 mt-1">Overview of booking activity and trends</p>
      </div>

            {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Total Bookings</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{data.pending}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{data.rejected}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-3xl font-bold text-gray-600 mt-1">{data.cancelled}</p>
        </div>
      </div>


      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

               {/* Bar Chart — Peak Hours */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Peak Booking Hours</h2>
          <p className="text-sm text-gray-500 mb-4">Number of bookings starting at each specific hour of the day</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="Time" 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                tickMargin={10}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ 
                  value: 'Number of Bookings', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 12 } 
                }}
              />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar 
                dataKey="Bookings" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]} 
                barSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>


        {/* Bar Chart — Top facilities */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Booked Facilities</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={facilityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart — Bookings per day */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Bookings Per Day (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}