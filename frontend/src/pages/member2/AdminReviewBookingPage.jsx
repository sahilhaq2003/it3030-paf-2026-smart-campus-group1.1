import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, X, ArrowLeft, AlertCircle, CalendarClock } from "lucide-react";
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

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-6 text-center">
      <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Booking Not Found</h1>
      <p className="text-slate-500 font-medium text-sm mt-2 mb-6">The requested booking could not be retrieved.</p>
      <button 
        onClick={() => navigate("/admin/bookings")}
        className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[11px] tracking-widest uppercase hover:bg-slate-800 transition"
      >
        Return to Bookings
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin/bookings")}
            className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <CalendarClock className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Review Request</h1>
              </div>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 ml-11">
                Booking ID: {booking.id}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Detail Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] p-8 sm:p-10 mb-8 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-8">Booking Details</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Facility</span>
              <span className="block text-lg font-bold text-slate-900">{booking.facilityName}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">User Name</span>
                <span className="block text-sm font-bold text-slate-900">{booking.userName || "Student User"}</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Submission Time</span>
                <span className="block text-sm font-bold text-slate-900">
                  {booking.createdAt ? new Date(booking.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Date</span>
                <span className="block text-sm font-bold text-slate-900">{booking.bookingDate}</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Time</span>
                <span className="block text-sm font-bold text-slate-900">
                  {booking.startTime ? booking.startTime.substring(0,5) : ''} — {booking.endTime ? booking.endTime.substring(0,5) : ''}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Purpose</span>
              <span className="block text-sm font-bold text-slate-900">{booking.purpose}</span>
            </div>

            {booking.expectedAttendees && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Expected Attendees</span>
                <span className="inline-block text-sm font-bold text-slate-900 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                  {booking.expectedAttendees}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {booking.status === "PENDING" && (
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-rose-600 border border-rose-200 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm"
            >
              <X className="w-5 h-5" /> Reject Request
            </button>

            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
            >
              <Check className="w-5 h-5" /> {approveMutation.isPending ? "Approving..." : "Approve Request"}
            </button>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-rose-950 mb-2 tracking-tight">Reject Booking</h2>
              <p className="text-slate-500 text-sm font-medium pr-4 mb-6">
                Please provide a reason for declining this request. This will be communicated to the user.
              </p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="e.g., The facility is already booked for a campus-wide event."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none transition-all placeholder:text-slate-400"
              />
              
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectionReason(""); }}
                  className="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rejectMutation.mutate()}
                  disabled={!rejectionReason || rejectMutation.isPending}
                  className="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {rejectMutation.isPending ? "Processing..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
