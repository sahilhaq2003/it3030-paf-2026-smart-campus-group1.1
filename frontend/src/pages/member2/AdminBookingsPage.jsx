import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAllBookings, approveBooking, rejectBooking, deleteBooking } from "../../api/bookingApi";
import StatusBadge from "../../components/StatusBadge";

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["allBookings"],
    queryFn: () => getAllBookings().then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: approveBooking,
    onSuccess: () => {
      toast.success("Booking approved!");
      queryClient.invalidateQueries({ queryKey: ["allBookings"] });
    },
    onError: () => toast.error("Failed to approve booking"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectBooking(id, reason),
    onSuccess: () => {
      toast.success("Booking rejected!");
      queryClient.invalidateQueries({ queryKey: ["allBookings"] });
      setRejectModal(null);
      setRejectionReason("");
    },
    onError: () => toast.error("Failed to reject booking"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      toast.success("Booking deleted!");
      queryClient.invalidateQueries({ queryKey: ["allBookings"] });
    },
    onError: () => toast.error("Failed to delete booking"),
  });

  const bookings = data || [];
  const filtered = filterStatus === "ALL"
    ? bookings
    : bookings.filter((b) => b.status === filterStatus);

  if (isLoading) return (
    <div className="p-6 text-center text-gray-500">Loading bookings...</div>
  );

  if (isError) return (
    <div className="p-6 text-center text-red-500">Failed to load bookings.</div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
        <p className="text-gray-500 mt-1">Review and manage all booking requests</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${filterStatus === status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No bookings found
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Facility</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date & Time</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Purpose</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{booking.userName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{booking.facilityName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {booking.bookingDate}<br />
                    {booking.startTime} — {booking.endTime}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {booking.purpose}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {booking.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate(booking.id)}
                            disabled={approveMutation.isPending}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModal(booking.id)}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(booking.id)}
                        disabled={deleteMutation.isPending}
                        className="text-xs border border-gray-300 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reject Booking</h2>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectionReason("");
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectModal, reason: rejectionReason })}
                disabled={!rejectionReason || rejectMutation.isPending}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}