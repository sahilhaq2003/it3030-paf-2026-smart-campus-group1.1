import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";
import { getBookingById, approveBooking, rejectBooking } from "../../api/bookingApi";
import StatusBadge from "../../components/StatusBadge";

export default function AdminReviewBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(id).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveBooking(id),
    onSuccess: () => {
      toast.success("Booking approved!");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["allBookings"] });
      navigate("/admin/bookings");
    },
    onError: () => toast.error("Failed to approve booking"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectBooking(id, rejectionReason),
    onSuccess: () => {
      toast.success("Booking rejected!");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["allBookings"] });
      setShowRejectModal(false);
      navigate("/admin/bookings");
    },
    onError: () => toast.error("Failed to reject booking"),
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading booking...</div>;
  if (!booking) return <div className="p-8 text-center text-red-500">Booking not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Booking Request</h1>
          <p className="text-gray-500 mt-1">Booking #{booking.id}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Detail Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Booking Information</h2>
        
        <div className="space-y-6 text-sm">
          <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-4">
            <span className="text-gray-500">Facility</span>
            <span className="text-gray-900 font-medium mt-1 sm:mt-0">{booking.facilityName}</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-4">
            <span className="text-gray-500">Location</span>
            <span className="text-gray-900 font-medium mt-1 sm:mt-0">Main Campus Area</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-4">
            <span className="text-gray-500">Date</span>
            <span className="text-gray-900 font-medium mt-1 sm:mt-0">{booking.bookingDate}</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-4">
            <span className="text-gray-500">Time</span>
            <span className="text-gray-900 font-medium mt-1 sm:mt-0">
              {booking.startTime ? booking.startTime.substring(0,5) : ''} — {booking.endTime ? booking.endTime.substring(0,5) : ''}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-4">
            <span className="text-gray-500">Expected Attendees</span>
            <span className="text-gray-900 font-medium mt-1 sm:mt-0">{booking.expectedAttendees || "N/A"}</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-4">
            <span className="text-gray-500">Purpose</span>
            <span className="text-gray-900 font-medium mt-1 sm:mt-0 text-right max-w-sm">{booking.purpose}</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-4">
            <span className="text-gray-500">Submitted</span>
            <span className="text-gray-900 font-medium mt-1 sm:mt-0">
              {booking.createdAt ? new Date(booking.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {booking.status === "PENDING" && (
        <div className="flex gap-4">
          <button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            className="flex items-center gap-2 bg-[#00a85a] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition"
          >
            <Check size={18} /> Approve
          </button>
          
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex items-center gap-2 bg-[#e60000] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition"
          >
            <X size={18} /> Reject
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reject Booking</h2>
            <p className="text-gray-500 text-sm mb-4">Please provide a reason for rejection</p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="e.g., The facility is already booked for this time slot."
              className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-sans"
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(""); }}
                className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={!rejectionReason || rejectMutation.isPending}
                className="flex-1 bg-[#e60000] text-white py-3 rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
