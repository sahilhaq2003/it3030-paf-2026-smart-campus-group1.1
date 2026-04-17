import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import axios from "axios";

export default function VerifyBookingPage() {
  const { id } = useParams();
  
  const storageKey = `booking-checked-in-${id}`;
  const alreadyCheckedIn = localStorage.getItem(storageKey);
 const { data: booking, isLoading, isError } = useQuery({
    queryKey: ["verify-booking", id],
    queryFn: () =>
      axios.get(`http://localhost:8081/api/bookings/public/${id}`)
        .then((r) => r.data),
    refetchOnMount: true,
    staleTime: 0,
  });;
  // Mark as checked in on first successful APPROVED scan
useEffect(() => {
  if (booking?.status === "APPROVED" && !alreadyCheckedIn) {
    localStorage.setItem(storageKey, "true");
  }
}, [booking]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-lg">Verifying booking...</p>
    </div>
  );

  if (isError || !booking) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
        <p className="text-gray-500">This booking ID does not exist.</p>
      </div>
    </div>
  );

  const statusConfig = {
    APPROVED: {
  icon: alreadyCheckedIn 
    ? <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
    : <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />,
  title: alreadyCheckedIn ? "Already Checked In ⚠️" : "Booking Verified ✓",
  subtitle: alreadyCheckedIn 
    ? "This booking has already been used for check-in."
    : "This is a valid approved booking.",
  bg: alreadyCheckedIn ? "bg-amber-50" : "bg-emerald-50",
  border: alreadyCheckedIn ? "border-amber-200" : "border-emerald-200",
  titleColor: alreadyCheckedIn ? "text-amber-700" : "text-emerald-700",
},
    PENDING: {
      icon: <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />,
      title: "Booking Pending",
      subtitle: "This booking has not been approved yet.",
      bg: "bg-amber-50",
      border: "border-amber-200",
      titleColor: "text-amber-700",
    },
    REJECTED: {
      icon: <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />,
      title: "Booking Rejected",
      subtitle: "This booking was rejected.",
      bg: "bg-red-50",
      border: "border-red-200",
      titleColor: "text-red-700",
    },
    CANCELLED: {
      icon: <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />,
      title: "Booking Cancelled",
      subtitle: "This booking has been cancelled.",
      bg: "bg-gray-50",
      border: "border-gray-200",
      titleColor: "text-gray-600",
    },
  };

  const config = statusConfig[booking.status] || statusConfig.CANCELLED;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
         <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-[15px] font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className={`${config.bg} ${config.border} border rounded-2xl p-8 text-center mb-4`}>
          {config.icon}
          <h1 className={`text-2xl font-bold ${config.titleColor} mb-1`}>{config.title}</h1>
          <p className="text-gray-500 text-sm">{config.subtitle}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
          <h2 className="font-semibold text-gray-700 mb-4 text-center">Booking Details</h2>
          <div className="flex flex-col gap-3">
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
                {booking.startTime?.substring(0, 5)} — {booking.endTime?.substring(0, 5)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Purpose</span>
              <span className="text-sm font-medium text-gray-900">{booking.purpose}</span>
            </div>
            {booking.expectedAttendees && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Attendees</span>
                <span className="text-sm font-medium text-gray-900">{booking.expectedAttendees}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Booking ID</span>
              <span className="text-xs font-mono text-gray-500">{booking.id}</span>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400">
          Smart Campus Hub · Booking Verification
        </p>
      </div>
    </div>
  );
}