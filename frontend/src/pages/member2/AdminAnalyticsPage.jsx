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

  // Prepare data for charts
  const statusData = [
    { name: "Approved", value: Number(data.approved), color: "#16a34a" },
    { name: "Pending", value: Number(data.pending), color: "#f59e0b" },
    { name: "Rejected", value: Number(data.rejected), color: "#dc2626" },
    { name: "Cancelled", value: Number(data.cancelled), color: "#6b7280" },
  ];

  const facilityData = Object.entries(data.facilityCount || {})
    .map(([name, count]) => ({ name, count: Number(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const dailyData = Object.entries(data.bookingsPerDay || {})
    .map(([date, count]) => ({ date, count: Number(count) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7);

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
          <p className="text-sm text-gray-500">Approval Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{data.approvalRate}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{data.pending}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{data.rejected}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Pie Chart — Status breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Booking Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
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