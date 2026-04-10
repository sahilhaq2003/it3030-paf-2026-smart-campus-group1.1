import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getBookingById, cancelBooking } from "../../api/bookingApi";
import StatusBadge from "../../components/StatusBadge";

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(id).then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id),
    onSuccess: () => {
      toast.success("Booking cancelled!");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      navigate("/bookings/my");
    },
    onError: () => toast.error("Failed to cancel booking"),
  });

  if (isLoading) return (
    <div className="p-6 text-center text-gray-500">Loading booking details...</div>
  );

  if (isError || !booking) return (
    <div className="p-6 text-center text-red-500">Booking not found.</div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-blue-600 hover:underline mb-6 flex items-center gap-1"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-gray-500 mt-1">Booking #{booking.id}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Status Timeline */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-4">Status Timeline</h2>
        <div className="flex items-center gap-2">
          {["Submitted", "Under Review", "Decision Made"].map((label, index) => {
            const isActive = index === 0 ||
              (index === 1 && ["APPROVED", "REJECTED", "CANCELLED"].includes(booking.status)) ||
              (index === 2 && ["APPROVED", "REJECTED"].includes(booking.status));
            return (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {index + 1}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{label}</span>
                </div>
                {index < 2 && (
                  <div className={`h-1 w-12 mx-1 mb-4 ${isActive ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-4">Booking Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Facility</span>
            <span className="text-sm font-medium text-gray-900">{booking.facilityName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Date</span>
            <span className="text-sm font-medium text-gray-900">{booking.bookingDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Time</span>
            <span className="text-sm font-medium text-gray-900">
              {booking.startTime} — {booking.endTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Purpose</span>
            <span className="text-sm font-medium text-gray-900">{booking.purpose}</span>
          </div>
          {booking.expectedAttendees && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Expected Attendees</span>
              <span className="text-sm font-medium text-gray-900">{booking.expectedAttendees}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Submitted</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(booking.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Rejection Reason */}
      {booking.status === "REJECTED" && booking.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4">
          <h2 className="font-semibold text-red-700 mb-2">Rejection Reason</h2>
          <p className="text-sm text-red-600">{booking.rejectionReason}</p>
        </div>
      )}

      {/* Cancel Button */}
      {booking.status === "APPROVED" && (
        <button
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
          className="w-full border border-red-300 text-red-600 py-2 rounded-lg font-medium
            hover:bg-red-50 disabled:opacity-50"
        >
          {cancelMutation.isPending ? "Cancelling..." : "Cancel Booking"}
        </button>
      )}
    </div>
  );
}