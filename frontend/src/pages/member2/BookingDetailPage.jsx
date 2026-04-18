import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getBookingById, cancelBooking } from "../../api/bookingApi";
import axiosInstance from "../../api/axiosInstance";
import StatusBadge from "../../components/StatusBadge";
import { Pencil, ArrowLeft, Trash2, CalendarIcon, Clock, Users, FileText, Loader2, AlertCircle } from "lucide-react";

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(id).then((r) => r.data),
  });

  const { data: facility } = useQuery({
    queryKey: ["facility", booking?.facilityId],
    queryFn: () => axiosInstance.get(`/facilities/${booking.facilityId}`).then((r) => r.data),
    enabled: !!booking?.facilityId,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id),
    onSuccess: () => {
      toast.success("Booking cancelled successfully!");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      navigate("/bookings/my");
    },
    onError: () => toast.error("Failed to cancel booking"),
  });

  const getFacilityImage = (type) => {
    if (!type) return '/facilities/campus.png';
    switch(type) {
      case 'LECTURE_HALL': return '/facilities/lecture_hall.png';
      case 'LAB': return '/facilities/lab.png';
      case 'MEETING_ROOM': return '/facilities/meeting.png';
      case 'EQUIPMENT': return '/facilities/equipment.png';
      default: return '/facilities/campus.png';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 w-14 h-14" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <h2 className="text-xl font-bold text-rose-500 mb-2">Booking Not Found</h2>
        <button onClick={() => navigate('/bookings/my')} className="text-indigo-600 hover:underline font-medium">Return to My Bookings</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white pb-24">
      {/* Immersive Header Banner */}
      <div className="relative h-[28rem] w-full bg-slate-900 overflow-hidden">
        <img 
          src={getFacilityImage(facility?.resourceType)} 
          alt={booking?.facilityName || 'Facility'}
          className="absolute inset-0 w-full h-full object-cover opacity-60 animate-in fade-in zoom-in duration-1000" 
         />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-900/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-transparent"></div>
        
        {/* Header Content */}
        <div className="absolute inset-0 flex flex-col justify-start pt-24 px-4 sm:px-10 lg:px-20 max-w-4xl mx-auto drop-shadow-xl">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-white/80 hover:text-white mb-10 font-bold text-sm tracking-widest uppercase transition-colors w-max group"
          >
            <ArrowLeft className="w-5 h-5 mr-3 transition-transform group-hover:-translate-x-2" /> 
            Back
          </button>
          
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-white leading-tight mb-4">
            {booking?.facilityName || "Facility"}
          </h1>
          
          <div className="flex items-center gap-4 mt-2">
            <StatusBadge status={booking.status} />
          </div>
        </div>
      </div>

      {/* Main Single Overlapping Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-white p-6 sm:p-14">
        
          <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Reservation Information</h3>
              <p className="text-slate-500 font-medium text-base">Complete details regarding your facility request.</p>
            </div>
            <div className="flex flex-col sm:text-right bg-slate-50/50 border border-slate-100 p-4 rounded-2xl w-max">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Submitted On</span>
              <span className="font-bold text-slate-800 text-lg">{new Date(booking.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Rejection Reason Box */}
          {booking.status === "REJECTED" && booking.rejectionReason && (
            <div className="mb-10 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-rose-900 tracking-tight text-lg mb-1">Request Denied</h4>
                <p className="text-rose-700 font-medium leading-relaxed">{booking.rejectionReason}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 mb-12">
            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Date */}
              <div className="bg-slate-50/50 hover:bg-white transition-colors border border-slate-100 p-5 pl-6 flex items-center gap-5 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-0.5">Date</p>
                  <p className="font-bold text-slate-800 text-lg">{booking.bookingDate}</p>
                </div>
              </div>

              {/* Time */}
              <div className="bg-slate-50/50 hover:bg-white transition-colors border border-slate-100 p-5 pl-6 flex items-center gap-5 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-0.5">Time</p>
                  <p className="font-bold text-slate-800 text-lg">
                    {booking.startTime?.substring(0, 5)} <span className="text-slate-400 mx-1">—</span> {booking.endTime?.substring(0, 5)}
                  </p>
                </div>
              </div>

              {/* Expected Attendees */}
              {booking.expectedAttendees && (
                <div className="bg-slate-50/50 hover:bg-white transition-colors border border-slate-100 p-5 pl-6 flex items-center gap-5 rounded-3xl sm:col-span-2 md:col-span-1">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-0.5">Expected Attendees</p>
                    <p className="font-bold text-slate-800 text-lg">{booking.expectedAttendees} {booking.expectedAttendees === 1 ? 'Person' : 'People'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Purpose */}
            <div className="bg-slate-50/50 hover:bg-white transition-colors border border-slate-100 p-6 sm:p-8 rounded-3xl mt-4">
              <div className="flex items-center gap-3 mb-4 text-indigo-500">
                <FileText className="w-5 h-5" />
                <h4 className="font-black text-slate-800 tracking-tight text-lg">Purpose of Booking</h4>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">{booking.purpose}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {(booking.status === "PENDING" || booking.status === "APPROVED") && (
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100">
              {booking.status === "PENDING" && (
                <button 
                  onClick={() => navigate(`/bookings/edit/${booking.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Pencil className="w-4 h-4" /> Edit Details
                </button>
              )}
              <button 
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-600/20"
              >
                {cancelMutation.isPending ? "Cancelling..." : <><Trash2 className="w-4 h-4" /> Cancel Request</>}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}