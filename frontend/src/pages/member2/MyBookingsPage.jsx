import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getMyBookings, cancelBooking } from "../../api/bookingApi";
import StatusBadge from "../../components/StatusBadge";

const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];



export default function MyBookingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["myBookings"],
    queryFn: () => getMyBookings().then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      toast.success("Booking cancelled successfully!");
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    },
    onError: () => toast.error("Failed to cancel booking"),
  });

  const bookings = data || [];
  const filtered = activeTab === "ALL"
    ? bookings
    : bookings.filter((b) => b.status === activeTab);

  if (isLoading) return (
    <div className="p-6 text-center text-gray-500">Loading bookings...</div>
  );

  if (isError) return (
    <div className="p-6 text-center text-red-500">Failed to load bookings.</div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">View and manage your booking requests</p>
        </div>
        <button
          onClick={() => navigate("/facilities")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          + New Booking
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No bookings found</p>
          <button
            onClick={() => navigate("/bookings/request")}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            Make your first booking
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <div
              key={booking.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {booking.facilityName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {booking.bookingDate} | {booking.startTime} — {booking.endTime}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {booking.purpose}
                  </p>
                  {booking.rejectionReason && (
                    <p className="text-sm text-red-600 mt-1">
                      Reason: {booking.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                 <StatusBadge status={booking.status} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View
                    </button>
                    {booking.status === "APPROVED" && (
                      <button
                        onClick={() => cancelMutation.mutate(booking.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}