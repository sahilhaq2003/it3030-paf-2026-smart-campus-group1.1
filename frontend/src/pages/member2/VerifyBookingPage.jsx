import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

export default function VerifyBookingPage() {
  const { id } = useParams();
  
  const storageKey = `booking-checked-in-${id}`;
  const alreadyCheckedIn = localStorage.getItem(storageKey);
  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ["verify-booking", id],
    queryFn: () =>
      axiosInstance.get(`/bookings/public/${id}`)
        .then((r) => r.data),
    refetchOnMount: true,
    staleTime: 0,
  });

  // Mark as checked in on first successful APPROVED scan
  useEffect(() => {
    if (booking?.status === "APPROVED" && !alreadyCheckedIn) {
      localStorage.setItem(storageKey, "true");
    }
  }, [booking, alreadyCheckedIn, storageKey]);

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (isError || !booking) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Booking Not Found</h1>
        <p className="text-slate-500 font-medium text-sm mb-8">This QR code corresponds to a booking ID that does not exist in the system.</p>
        <button
          onClick={() => window.history.back()}
          className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    </div>
  );

  const statusConfig = {
    APPROVED: {
      icon: alreadyCheckedIn 
        ? <AlertCircle className="w-10 h-10 text-amber-500" />
        : <CheckCircle className="w-10 h-10 text-emerald-500" />,
      title: alreadyCheckedIn ? "Already Checked In" : "Booking Verified",
      subtitle: alreadyCheckedIn 
        ? "This booking was already scanned and used today."
        : "Valid and approved booking for today.",
      bg: alreadyCheckedIn ? "bg-amber-50" : "bg-emerald-50",
      border: alreadyCheckedIn ? "border-amber-200" : "border-emerald-200",
      titleColor: alreadyCheckedIn ? "text-amber-800" : "text-emerald-800",
      accentLine: alreadyCheckedIn ? "bg-amber-500" : "bg-emerald-500"
    },
    PENDING: {
      icon: <Clock className="w-10 h-10 text-amber-500" />,
      title: "Booking Pending",
      subtitle: "This booking requires administrator approval.",
      bg: "bg-amber-50",
      border: "border-amber-200",
      titleColor: "text-amber-800",
      accentLine: "bg-amber-400"
    },
    REJECTED: {
      icon: <XCircle className="w-10 h-10 text-rose-500" />,
      title: "Booking Rejected",
      subtitle: "This booking was officially rejected.",
      bg: "bg-rose-50",
      border: "border-rose-200",
      titleColor: "text-rose-800",
      accentLine: "bg-rose-500"
    },
    CANCELLED: {
      icon: <AlertCircle className="w-10 h-10 text-slate-400" />,
      title: "Booking Cancelled",
      subtitle: "This booking was cancelled by the user.",
      bg: "bg-slate-100",
      border: "border-slate-200",
      titleColor: "text-slate-800",
      accentLine: "bg-slate-400"
    },
  };

  const config = statusConfig[booking.status] || statusConfig.CANCELLED;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans py-12">
      <div className="max-w-md w-full">
        
        {/* Verification Status Card */}
        <div className={`backdrop-blur-xl border ${config.border} ${config.bg} rounded-[2.5rem] p-8 text-center shadow-sm relative overflow-hidden mb-6 transition-all duration-500`}>
          <div className={`absolute top-0 left-0 w-full h-1.5 ${config.accentLine}`} />
          <div className="w-20 h-20 bg-white/60 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-white/50">
            {config.icon}
          </div>
          <h1 className={`text-2xl font-black ${config.titleColor} tracking-tight mb-2 uppercase`}>{config.title}</h1>
          <p className={`${config.titleColor} opacity-80 font-medium text-sm`}>{config.subtitle}</p>
        </div>

        {/* Details Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Booking Details</h2>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
              ID: {booking.id}
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Facility Name</span>
              <span className="block text-base font-bold text-slate-900">{booking.facilityName}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Date</span>
                <span className="block text-sm font-bold text-slate-900">{booking.bookingDate}</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Time</span>
                <span className="block text-sm font-bold text-slate-900">
                  {booking.startTime?.substring(0, 5)} - {booking.endTime?.substring(0, 5)}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Purpose</span>
              <span className="block text-sm font-bold text-slate-900">{booking.purpose}</span>
            </div>

            {booking.expectedAttendees && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Attendees</span>
                <span className="block text-sm font-bold text-slate-900">{booking.expectedAttendees} People</span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => window.history.back()}
            className="mt-8 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>

        <p className="text-center text-[10px] uppercase tracking-widest font-bold text-slate-300 mt-8">
          Smart Campus Hub Verification 
        </p>
      </div>
    </div>
  );
}