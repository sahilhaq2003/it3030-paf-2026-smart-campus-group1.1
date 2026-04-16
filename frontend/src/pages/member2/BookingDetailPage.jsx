import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getBookingById, cancelBooking } from "../../api/bookingApi";
import StatusBadge from "../../components/StatusBadge";
import { Pencil } from "lucide-react";


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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{booking.facilityName}</h1>
        <p className="text-gray-500 text-sm mt-1 uppercase tracking-wide">Booking Details</p>
      </div>


      

      {/* Booking Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-4">Booking Information</h2>
                <div className="flex flex-col">
          <div className="flex justify-between py-4 border-b border-gray-100">
            <span className="text-sm text-gray-500">Facility</span>
            <span className="text-sm font-medium text-gray-900">{booking.facilityName}</span>
          </div>
          <div className="flex justify-between py-4 border-b border-gray-100">
            <span className="text-sm text-gray-500">Date</span>
            <span className="text-sm font-medium text-gray-900">{booking.bookingDate}</span>
          </div>
          <div className="flex justify-between py-4 border-b border-gray-100">
            <span className="text-sm text-gray-500">Time</span>
            <span className="text-sm font-medium text-gray-900">
              {booking.startTime} — {booking.endTime}
            </span>
          </div>
          <div className="flex justify-between py-4 border-b border-gray-100">
            <span className="text-sm text-gray-500">Purpose</span>
            <span className="text-sm font-medium text-gray-900">{booking.purpose}</span>
          </div>
          {booking.expectedAttendees && (
            <div className="flex justify-between py-4 border-b border-gray-100">
              <span className="text-sm text-gray-500">Expected Attendees</span>
              <span className="text-sm font-medium text-gray-900">{booking.expectedAttendees}</span>
            </div>
          )}
          <div className="flex justify-between py-4">
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
            {/* Action Buttons */}
      <div className="flex gap-4 mb-8">

        {booking.status === "PENDING" && (
  <button
    onClick={() => navigate(`/bookings/edit/${booking.id}`)}
    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
  >
    <Pencil className="w-5 h-5" />
    Edit Booking
  </button>
)}
        
        <button
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
        >
          {cancelMutation.isPending ? "Cancelling..." : "Cancel Booking"}
        </button>
      </div>

    </div>
  );
}