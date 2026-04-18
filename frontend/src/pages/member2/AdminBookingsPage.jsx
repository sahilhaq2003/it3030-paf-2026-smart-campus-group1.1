import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, Trash2, SearchX, AlertCircle } from "lucide-react";
import { getAllBookings, deleteBooking } from "../../api/bookingApi";
import StatusBadge from "../../components/StatusBadge";
import toast from "react-hot-toast";

export default function AdminBookingsPage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [bookingToDelete, setBookingToDelete] = useState(null);

  const queryClient = useQueryClient();

   const deleteMutation = useMutation({
    mutationFn: (id) => deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["allBookings"]);
      toast.success("Booking deleted successfully!");
      setBookingToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete booking.");
      setBookingToDelete(null);
    }
  });

  const confirmDelete = () => {
    if (bookingToDelete) {
      deleteMutation.mutate(bookingToDelete);
    }
  };

  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ["allBookings"],
    queryFn: () => getAllBookings().then((r) => r.data),
  });

  // Filter based on Tabs and Search Bar (facility or purpose)
  const filtered = bookings.filter((b) => {
    const matchStatus = filterStatus === "ALL" || b.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchSearch = term === "" || 
      (b.facilityName && b.facilityName.toLowerCase().includes(term)) ||
      (b.purpose && b.purpose.toLowerCase().includes(term));
    return matchStatus && matchSearch;
  })
   .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (isLoading) return <div className="min-h-screen bg-slate-50 p-6 text-center text-slate-500 font-medium">Loading bookings...</div>;
  if (isError) return <div className="min-h-screen bg-slate-50 p-6 text-center text-rose-500 font-bold">Failed to load bookings.</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manage Bookings</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Review, moderate, and manage all campus facility reservations.</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          {/* Search Bar (Left side) */}
          <div className="relative w-full md:flex-1 md:max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by facility, purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 bg-white shadow-sm font-medium text-sm placeholder-slate-400 transition-all hover:bg-slate-50"
            />
          </div>

          {/* Status filter tabs (Right side) */}
          <div className="flex flex-wrap gap-2.5 md:justify-end">
            {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all border ${
                  filterStatus === status
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/6">User</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/6">Facility</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/6">Date & Time</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/4">Purpose</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/12">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-1/12">Review</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-5">
                          <SearchX className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">No bookings found</h3>
                        <p className="text-slate-500 text-sm">We couldn't find any requests answering this criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-slate-900 mb-0.5">{booking.userName || "Student"}</div>
                        <div className="text-[10px] font-black text-slate-400 tracking-wider">ID: {booking.userId}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-slate-800">{booking.facilityName}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[13px] font-bold text-slate-700 mb-0.5">{booking.bookingDate}</div>
                        <div className="text-[11px] font-bold tracking-wider text-slate-500 flex items-center gap-1">
                          {booking.startTime ? booking.startTime.substring(0,5) : ''} 
                          <span className="text-slate-300">—</span> 
                          {booking.endTime ? booking.endTime.substring(0,5) : ''}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[13px] font-medium text-slate-600 max-w-[200px] truncate" title={booking.purpose}>
                          {booking.purpose}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                          className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-900 text-slate-700 hover:border-slate-900 hover:text-white rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 shadow-sm"
                        >
                          Review
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setBookingToDelete(booking.id)}
                            className="p-2.5 border border-rose-100 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all duration-300 focus:outline-none shadow-sm hover:shadow-md hover:shadow-rose-600/20"
                            title="Delete Request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        {bookingToDelete && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-rose-950 mb-2 tracking-tight">Delete Booking</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                Are you absolutely sure you want to permanently delete this booking request? This action cannot be undone and the user's request will be removed from the system.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setBookingToDelete(null)}
                  className="flex-1 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all bg-slate-100 hover:bg-slate-200 text-slate-600"
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 disabled:opacity-50 flex justify-center items-center gap-2"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Processing..." : "Confirm Deletion"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

   
