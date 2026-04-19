import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, CalendarIcon, FileText, Users, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createBooking, checkAvailability } from "../../api/bookingApi";
import axiosInstance from "../../api/axiosInstance";

// Scrollable column for time picker
function Column({ items, selected, onSelect, format }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      const idx = items.indexOf(selected);
      if (idx >= 0) {
        const child = listRef.current.children[idx];
        if (child) child.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selected, items]);

  return (
    <div
      ref={listRef}
      className="overflow-y-auto max-h-[200px] py-2 scrollbar-none"
    >
      {items.map((item) => (
        <div
          key={item}
          onClick={() => onSelect(item)}
          className={`px-4 py-2 cursor-pointer rounded-lg mx-1.5 my-0.5 text-sm whitespace-nowrap transition-colors ${item === selected
            ? "font-semibold text-indigo-700 bg-indigo-50"
            : "font-normal text-slate-700 hover:bg-slate-100"
            }`}
        >
          {format(item)}
        </div>
      ))}
    </div>
  );
}

// Custom 24-hour time picker — no native browser popup
function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const timeStr = value || "08:00";
  const [hStr, mStr] = timeStr.split(":");
  const currentHour = parseInt(hStr, 10);
  const currentMinute = parseInt(mStr, 10);

  // Available hours 8 to 18
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const update = (newHour, newMinute) => {
    onChange(`${String(newHour).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`);
  };

  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => setOpen((o) => !o)}
        className="border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 cursor-pointer select-none relative focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all hover:bg-slate-100"
      >
        <span className="text-base font-semibold">{value ? value : "--:--"}</span>
        <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
      </div>

      {open && (
        <div className="absolute top-[110%] left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 flex overflow-hidden">
          <Column
            items={hours}
            selected={currentHour}
            onSelect={(h) => update(h, currentMinute)}
            format={(h) => String(h).padStart(2, "0")}
          />
          <div className="w-px bg-slate-100 my-2" />
          <Column
            items={minutes}
            selected={currentMinute}
            onSelect={(m) => update(currentHour, m)}
            format={(m) => String(m).padStart(2, "0")}
          />
        </div>
      )}
    </div>
  );
}

// Stepper
function Stepper({ value, min = 1, max, onChange }) {
  const handleInput = (e) => {
    const raw = e.target.value;
    if (raw === "") { onChange(""); return; }
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;
    const clamped = Math.min(max ?? Infinity, Math.max(min, num));
    onChange(clamped);
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, (Number(value) || min) - 1))}
        disabled={Number(value) <= min}
        className={`w-12 h-12 border border-slate-200 rounded-l-xl bg-slate-50 flex items-center justify-center text-xl font-medium transition-colors ${Number(value) <= min ? "cursor-not-allowed text-slate-300" : "cursor-pointer text-slate-700 hover:bg-slate-100"
          }`}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleInput}
        onBlur={(e) => {
          const num = parseInt(e.target.value, 10);
          if (isNaN(num) || num < min) onChange(min);
          else if (max !== undefined && num > max) onChange(max);
        }}
        className="w-16 h-12 border-y border-slate-200 text-center text-lg font-bold text-slate-800 bg-white focus:outline-none focus:ring-0"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max ?? Infinity, (Number(value) || min) + 1))}
        disabled={max !== undefined && Number(value) >= max}
        className={`w-12 h-12 border border-slate-200 rounded-r-xl bg-slate-50 flex items-center justify-center text-xl font-medium transition-colors ${(max !== undefined && Number(value) >= max) ? "cursor-not-allowed text-slate-300" : "cursor-pointer text-slate-700 hover:bg-slate-100"
          }`}
      >
        +
      </button>
    </div>
  );
}

// Inner section card - A styled card wrapper with an icon and title
function InnerSection({ icon: Icon, title, children }) {
  return (
    <div className="mb-10 p-6 border border-slate-100 rounded-3xl bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 group">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>
      <div className="pl-2 sm:pl-16">
        {children}
      </div>
    </div>
  );
}

// Main BookingRequestPage component
export default function BookingRequestPage() {
  const navigate = useNavigate();
  const { id: facilityIdFromUrl } = useParams();
  // stores all form inputs
  const [formData, setFormData] = useState({
    facilityId: facilityIdFromUrl || "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    purpose: "",
    expectedAttendees: 1,
  });
  const [isAvailable, setIsAvailable] = useState(null);
  const [checking, setChecking] = useState(false);
  //Facility data fetching
  const { data: facility, isLoading: isLoadingFacility } = useQuery({
    queryKey: ["facility", facilityIdFromUrl],
    queryFn: () => axiosInstance.get(`/facilities/${facilityIdFromUrl}`).then((r) => r.data),
    enabled: !!facilityIdFromUrl,
  });

  const getFacilityImage = (type) => {
    if (!type) return '/facilities/campus.png';
    switch (type) {
      case 'LECTURE_HALL': return '/facilities/lecture_hall.png';
      case 'LAB': return '/facilities/lab.png';
      case 'MEETING_ROOM': return '/facilities/meeting.png';
      case 'EQUIPMENT': return '/facilities/equipment.png';
      default: return '/facilities/campus.png';
    }
  };

  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getLocalTimeStr = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  //Every time date/time changes,automatically calls /api/bookings/availability
  useEffect(() => {
    const { facilityId, bookingDate, startTime, endTime } = formData;
    if (facilityId && bookingDate && startTime && endTime) {
      if (startTime >= endTime) {
        setIsAvailable(null);
        return;
      }
      if (bookingDate === getTodayStr() && startTime < getLocalTimeStr()) {
        setIsAvailable(null);
        return;
      }
      setChecking(true);
      checkAvailability(facilityId, bookingDate, startTime, endTime)//Availability validation
        .then((res) => setIsAvailable(res.data))
        .catch(() => setIsAvailable(null))
        .finally(() => setChecking(false));
    }
  }, [formData.facilityId, formData.bookingDate, formData.startTime, formData.endTime]);
  //sends the form data to POST /api/bookings
  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => { toast.success("Booking request submitted successfully!"); navigate("/bookings/my"); },
    onError: (error) => { toast.error(error.response?.data?.message || "Failed to submit booking"); },
  });

  const handleSubmit = () => {
    mutation.mutate({
      facilityId: Number(formData.facilityId),
      bookingDate: formData.bookingDate,
      startTime: formData.startTime + ":00",
      endTime: formData.endTime + ":00",
      purpose: formData.purpose,
      expectedAttendees: formData.expectedAttendees ? Number(formData.expectedAttendees) : null,
    });
  };

  if (isLoadingFacility) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 w-14 h-14" />
      </div>
    );
  }
  //Attendees validation
  const maxAttendees = facility?.capacity ?? undefined;
  //Time range validation
  const isValidTimeRange = formData.startTime && formData.endTime && (formData.startTime < formData.endTime);
  //Past time validation
  const isPastTime = formData.bookingDate === getTodayStr() && formData.startTime && formData.startTime < getLocalTimeStr();
  //Submit button is only enabled when ALL conditions are met
  const canSubmit = formData.bookingDate && isValidTimeRange && !isPastTime && formData.purpose && isAvailable !== false;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white pb-24">
      {/* Immersive Header Banner */}
      <div className="relative h-[28rem] w-full bg-slate-900 overflow-hidden">
        <img
          src={getFacilityImage(facility?.resourceType)}
          alt={facility?.name || 'Facility'}
          className="absolute inset-0 w-full h-full object-cover opacity-60 animate-in fade-in zoom-in duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-900/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-transparent"></div>

        {/* Header Content */}
        <div className="absolute inset-0 flex flex-col justify-start pt-24 px-4 sm:px-10 lg:px-20 max-w-5xl mx-auto drop-shadow-xl">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-white/80 hover:text-white mb-12 lg:mb-16 font-bold text-sm tracking-widest uppercase transition-colors w-max group"
          >
            <ArrowLeft className="w-5 h-5 mr-3 transition-transform group-hover:-translate-x-2" />
            Back to Facility
          </button>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-white leading-tight mb-4">
            {facility?.name || "Facility"}
          </h1>
          {facility && (
            <p className="text-indigo-100 font-medium text-lg flex items-center gap-3">
              <span>{facility.location}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              <span>Up to {facility.capacity} {facility.capacity === 1 ? "Person" : "People"}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main Single Overlapping Card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-white p-6 sm:p-14">

          <div className="mb-10">
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Reservation Details</h3>
            <p className="text-slate-500 font-medium text-base">Fill out the form below to submit your official booking request to campus administration.</p>
          </div>

          <InnerSection icon={CalendarIcon} title="Select Date">
            <div className="relative max-w-sm">
              <input
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]} //Cannot select a past date
                className={`w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold ${!formData.bookingDate && 'text-slate-400 font-normal'} hover:bg-slate-100`}
              />
            </div>
          </InnerSection>

          <InnerSection icon={Clock} title="Time Range">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4 max-w-xl">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Time</label>
                <TimePicker value={formData.startTime} onChange={(val) => setFormData({ ...formData, startTime: val })} />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">End Time</label>
                <TimePicker value={formData.endTime} onChange={(val) => setFormData({ ...formData, endTime: val })} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-500 mt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Available hours: 08:00 — 18:00
            </p>

            <div className="mt-6 space-y-3 max-w-xl">
              {checking && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-600 shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> Checking availability...
                </div>
              )}

              {!checking && isAvailable === true && !isPastTime && formData.startTime < formData.endTime && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-bold text-emerald-700 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> This slot is available!
                </div>
              )}

              {!checking && isAvailable === false && !isPastTime && formData.startTime < formData.endTime && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm font-bold text-rose-700 shadow-sm">
                  <XCircle className="w-5 h-5 text-rose-500" /> This slot is not available. Please choose a different time.
                </div>
              )}

              {formData.startTime && formData.endTime && formData.startTime >= formData.endTime && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm font-bold text-amber-700 shadow-sm">
                  <XCircle className="w-5 h-5 text-amber-500" /> Invalid time range. Start time must be before end time.
                </div>
              )}

              {isPastTime && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm font-bold text-amber-700 shadow-sm">
                  <XCircle className="w-5 h-5 text-amber-500" /> Cannot book for times in the past.
                </div>
              )}
            </div>
          </InnerSection>

          <InnerSection icon={FileText} title="Purpose of Booking">
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows={4}
              placeholder="Please describe the purpose of your academic or organizational booking..."
              className="w-full max-w-2xl border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-base resize-y hover:bg-slate-100"
            />
          </InnerSection>

          <InnerSection icon={Users} title="Expected Attendees">
            <div className="flex items-center gap-6">
              <Stepper
                value={Number(formData.expectedAttendees)}
                min={1}
                max={maxAttendees}
                onChange={(val) => setFormData({ ...formData, expectedAttendees: val })}
              />
              {maxAttendees && (
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Capacity Limit</span>
                  <span className="text-base font-bold text-slate-700">Max {maxAttendees} persons</span>
                </div>
              )}
            </div>
          </InnerSection>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="sm:w-1/3 py-3.5 border border-slate-200 rounded-xl bg-white text-slate-600 text-sm font-bold uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 hover:shadow-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || mutation.isPending}
              className={`sm:w-2/3 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg transition-all duration-300 relative overflow-hidden group
                ${canSubmit && !mutation.isPending
                  ? 'bg-slate-900 text-white hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/30'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'}`}
            >
              {canSubmit && !mutation.isPending && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              )}
              {mutation.isPending ? "Submitting Request..." : "Submit Booking Request"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
