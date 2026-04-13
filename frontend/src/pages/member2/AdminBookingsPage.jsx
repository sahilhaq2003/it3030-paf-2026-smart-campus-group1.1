import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { getAllBookings } from "../../api/bookingApi";
import StatusBadge from "../../components/StatusBadge";

export default function AdminBookingsPage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ["allBookings"],
    queryFn: () => getAllBookings().then((r) => r.data),
  });

  // Filter based on Tabs and Search Bar (facility or purpose)
  const filtered = bookings.filter((b) => {
    const matchStatus = filterStatus === "ALL" || b.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchSearch = term === "" || 
      (b.facilityName && b.facilityName.toLowerCase().includes(term)) ||
      (b.purpose && b.purpose.toLowerCase().includes(term));
    return matchStatus && matchSearch;
  });

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading bookings...</div>;
  if (isError) return <div className="p-6 text-center text-red-500">Failed to load bookings.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Bookings</h1>
        <p className="text-gray-500 mt-1">View and manage all booking requests</p>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 mb-6">
        {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors
              ${filterStatus === status
                ? "bg-blue-600 text-white shadow-md cursor-default"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by facility, purpose, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead className="bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600 w-1/6">User</th>
              <th className="px-6 py-4 font-semibold text-gray-600 w-1/6">Facility</th>
              <th className="px-6 py-4 font-semibold text-gray-600 w-1/5">Date & Time</th>
              <th className="px-6 py-4 font-semibold text-gray-600 w-1/4">Purpose</th>
              <th className="px-6 py-4 font-semibold text-gray-600 w-1/12">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                  No bookings found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-gray-900 mb-1">{booking.userName || "Student"}</div>
                    <div className="text-gray-400 text-xs">ID: {booking.userId}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {booking.facilityName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="mb-1">{booking.bookingDate}</div>
                    <div className="text-gray-400">{booking.startTime ? booking.startTime.substring(0,5) : ''} - {booking.endTime ? booking.endTime.substring(0,5) : ''}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 max-w-xs truncate">
                    {booking.purpose}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium tracking-wide text-[13px]"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
