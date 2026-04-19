import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getMyBookings, cancelBooking } from "../../api/bookingApi";
import StatusBadge from "../../components/StatusBadge";
import { Trash2, Plus, Calendar, Clock, ArrowRight, Loader2, SearchX } from "lucide-react";


const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];



export default function MyBookingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight")
    ? Number(searchParams.get("highlight"))
    : null;
  const highlightRef = useRef(null);
  // Data Fetching
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
  //Sorts bookings newest first by createdAt date.
  const bookings = (data || []).sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const filtered = activeTab === "ALL"
    ? bookings
    : bookings.filter((b) => b.status === activeTab);

  // Scroll the highlighted booking into view, then clear the query param
  useEffect(() => {
    if (!highlightId || !highlightRef.current) return;
    highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => {
      setSearchParams({}, { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [highlightId, highlightRef.current]);

  if (isLoading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600 w-14 h-14 mb-4" />
      <p className="text-slate-500 font-medium">Loading your bookings...</p>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
      <p className="text-rose-500 font-bold text-lg mb-2">Failed to load bookings</p>
      <button onClick={() => window.location.reload()} className="text-indigo-600 hover:underline">Try Again</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Bookings</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">View and manage your current and past facility reservations.</p>
          </div>
          <button
            onClick={() => navigate("/facilities")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1 hover:shadow-indigo-300 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1" /> New Booking
          </button>
        </div>


        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all border ${activeTab === tab
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-5">
              <SearchX className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No bookings found</h3>
            <p className="text-slate-500 mb-6 text-sm max-w-md mx-auto">You don't have any requests matching this status. Want to reserve a room?</p>
            <button
              onClick={() => navigate("/facilities")}
              className="text-indigo-600 font-bold hover:text-indigo-800 tracking-widest uppercase text-xs border-b-2 border-indigo-200 pb-1"
            >
              Make your first booking &rarr;
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const isHighlighted = booking.id === highlightId;
              return (
                <div
                  key={booking.id}
                  ref={isHighlighted ? highlightRef : null}
                  className={`bg-white rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/40 transition-all duration-300 group ${isHighlighted
                      ? "ring-2 ring-indigo-500 shadow-lg"
                      : "shadow-sm"
                    }`}
                >
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {booking.facilityName}
                      </h3>
                      <StatusBadge status={booking.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 bg-slate-50 rounded-xl mb-3 border border-slate-100 w-max max-w-full">
                      <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        {booking.bookingDate}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></div>
                      <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        {booking.startTime} <span className="text-slate-400 mx-1">-</span> {booking.endTime}
                      </div>
                    </div>

                    <p className="text-slate-600 leading-relaxed text-[13px] max-w-2xl">
                      <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] mr-2">Purpose</span>
                      {booking.purpose}
                    </p>

                    {booking.rejectionReason && (
                      <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                        <p className="text-rose-700 text-[13px]">
                          <span className="font-black text-rose-400 uppercase tracking-widest text-[9px] mr-2">Denial Reason</span>
                          {booking.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 sm:px-6 py-3 bg-slate-50 hover:bg-slate-900 text-slate-700 hover:text-white rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-300 group/btn"
                    >
                      View
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}