import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, FileText, Users } from "lucide-react";
import toast from "react-hot-toast";

// Imports from your API
import { getBookingById, checkAvailability, updateBooking } from "../../api/bookingApi";
import axiosInstance from "../../api/axiosInstance";

// --- Time Helper Functions ---


// --- Custom Pickers & Components from your Request Page ---
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
    <div ref={listRef} style={{ overflowY: "auto", maxHeight: 200, padding: "8px 0", scrollbarWidth: "none" }}>
      {items.map((item) => (
        <div key={item} onClick={() => onSelect(item)}
          style={{ padding: "9px 18px", cursor: "pointer", fontWeight: item === selected ? 600 : 400, color: item === selected ? "#7c3aed" : "#374151", background: item === selected ? "#f5f3ff" : "transparent", borderRadius: 8, margin: "1px 6px", fontSize: 14, whiteSpace: "nowrap" }}>
          {format(item)}
        </div>
      ))}
    </div>
  );
}

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
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const update = (newHour, newMinute) => {
    onChange(`${String(newHour).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div onClick={() => setOpen((o) => !o)} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 44px 12px 16px", fontSize: 15, color: "#111827", background: "#fff", cursor: "pointer", userSelect: "none", position: "relative" }}>
        {value ? value : "--:--"}
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 15 }}>⏱</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex" }}>
          <Column items={hours} selected={currentHour} onSelect={(h) => update(h, currentMinute)} format={(h) => String(h).padStart(2, "0")} />
          <div style={{ width: 1, background: "#f3f4f6", margin: "8px 0" }} />
          <Column items={minutes} selected={currentMinute} onSelect={(m) => update(currentHour, m)} format={(m) => String(m).padStart(2, "0")} />
        </div>
      )}
    </div>
  );
}

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
    <div style={{ display: "flex", alignItems: "center" }}>
      <button type="button" onClick={() => onChange(Math.max(min, (Number(value) || min) - 1))} disabled={Number(value) <= min} style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: "8px 0 0 8px", background: "#fff", fontSize: 20, cursor: Number(value) <= min ? "not-allowed" : "pointer", color: Number(value) <= min ? "#d1d5db" : "#374151", fontWeight: 500 }}>−</button>
      <input type="text" inputMode="numeric" value={value} onChange={handleInput} onBlur={(e) => {
        const num = parseInt(e.target.value, 10);
        if (isNaN(num) || num < min) onChange(min);
        else if (max !== undefined && num > max) onChange(max);
      }} style={{ width: 56, height: 40, border: "1px solid #e5e7eb", borderLeft: "none", borderRight: "none", textAlign: "center", fontSize: 16, fontWeight: 600, color: "#111827", background: "#fff", outline: "none" }} />
      <button type="button" onClick={() => onChange(Math.min(max ?? Infinity, (Number(value) || min) + 1))} disabled={max !== undefined && Number(value) >= max} style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: "0 8px 8px 0", background: "#fff", fontSize: 20, cursor: (max !== undefined && Number(value) >= max) ? "not-allowed" : "pointer", color: (max !== undefined && Number(value) >= max) ? "#d1d5db" : "#374151", fontWeight: 500 }}>+</button>
    </div>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "28px 32px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "#f5f3ff", color: "#7c3aed" }}>
          {icon}
        </div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#111827" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", fontSize: 15, color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };


// --- Main Edit Page ---
export default function EditBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    facilityId: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    purpose: "",
    expectedAttendees: 1,
  });

  const [isAvailable, setIsAvailable] = useState(null);
  const [checking, setChecking] = useState(false);

  // 1. Fetch existing Booking Data
  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(id).then((r) => r.data),
  });

  // 2. Fetch Facility info (to get max capacity size)
  const { data: facility } = useQuery({
    queryKey: ["facility", formData.facilityId],
    queryFn: () => axiosInstance.get(`/facilities/${formData.facilityId}`).then((r) => r.data),
    enabled: !!formData.facilityId,
  });

  // 3. Pre-fill the form once the booking is loaded
  useEffect(() => {
    if (booking) {
      setFormData({
        facilityId: booking.facilityId || "",
        bookingDate: booking.bookingDate || "",
        startTime: booking.startTime ? booking.startTime.substring(0, 5) : "",
        endTime: booking.endTime ? booking.endTime.substring(0, 5) : "",
        purpose: booking.purpose || "",
        expectedAttendees: booking.expectedAttendees || 1,
      });
      // Existing time is inherently available
      setIsAvailable(true);
    }
  }, [booking]);

  // 4. Verify availability if the user alters the Date or Time
  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getLocalTimeStr = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const isSameAsOriginal = booking &&
      booking.bookingDate === formData.bookingDate &&
      booking.startTime.substring(0, 5) === formData.startTime &&
      booking.endTime.substring(0, 5) === formData.endTime;

    if (isSameAsOriginal) {
      setIsAvailable(true);
      return;
    }

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
      checkAvailability(facilityId, bookingDate, startTime, endTime, id)
        .then((res) => setIsAvailable(res.data))
        .catch(() => setIsAvailable(null))
        .finally(() => setChecking(false));
    }
  }, [formData.facilityId, formData.bookingDate, formData.startTime, formData.endTime, booking]);


  // 5. Build mock updater (replace with your real edit API when ready)
  const updateMutation = useMutation({
    mutationFn: (data) => updateBooking(id, data), // <-- This actually calls your Spring Boot Server now!
    onSuccess: () => {
      toast.success("Booking updated!");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      navigate(-1);
    },
    onError: () => toast.error("Failed to update booking")
  });


  const handleSubmit = () => {
    updateMutation.mutate({
      facilityId: Number(formData.facilityId),
      bookingDate: formData.bookingDate,
      startTime: formData.startTime + ":00",
      endTime: formData.endTime + ":00",
      purpose: formData.purpose,
      expectedAttendees: formData.expectedAttendees ? Number(formData.expectedAttendees) : null,
    });
  };

  const maxAttendees = facility?.capacity ?? undefined;
  const isValidTimeRange = formData.startTime && formData.endTime && (formData.startTime < formData.endTime);
  const isPastTime = formData.bookingDate === getTodayStr() && formData.startTime && formData.startTime < getLocalTimeStr();

  const canSubmit = formData.bookingDate && isValidTimeRange && !isPastTime && formData.purpose && isAvailable !== false;

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "0px 24px", fontFamily: "system-ui, sans-serif" }}>

      {/* Header exactly like screenshot */}
      <div style={{ marginBottom: "32px", marginTop: "12px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
          {booking?.facilityName || "Smart Campus Hub"}
        </h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Edit Booking
        </p>
      </div>

      <SectionCard icon={<Calendar size={20} />} title="Select Date">
        <input type="date" name="bookingDate" value={formData.bookingDate}
          onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
          min={new Date().toISOString().split("T")[0]}
          style={{ ...inputStyle, color: formData.bookingDate ? "#111827" : "#9ca3af" }} />
      </SectionCard>

      <SectionCard icon={<Clock size={20} />} title="Time Range">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Start Time</label>
            <TimePicker value={formData.startTime} onChange={(val) => setFormData({ ...formData, startTime: val })} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>End Time</label>
            <TimePicker value={formData.endTime} onChange={(val) => setFormData({ ...formData, endTime: val })} />
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "8px 0 0" }}>Available hours: 08:00 — 18:00</p>

        {/* Availability Status Box */}
        {checking && <div style={{ marginTop: 10, padding: "10px 14px", background: "#f9fafb", borderRadius: 8, fontSize: 13, color: "#6b7280" }}>Checking availability...</div>}
        {!checking && isAvailable === true && !isPastTime && formData.startTime < formData.endTime && <div style={{ marginTop: 10, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, color: "#15803d" }}>✅ This time slot is available!</div>}
        {!checking && isAvailable === false && !isPastTime && formData.startTime < formData.endTime && <div style={{ marginTop: 10, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>❌ This slot is not available. Please choose a different time.</div>}
        {formData.startTime && formData.endTime && formData.startTime >= formData.endTime && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
            ❌ Invalid time range.
          </div>
        )}
        {isPastTime && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
            ❌ Cannot book for past times.
          </div>
        )}
      </SectionCard>

      <SectionCard icon={<FileText size={20} />} title="Purpose of Booking">
        <textarea
          name="purpose"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          rows={5}
          placeholder="Please describe the purpose of your booking..."
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
        />
      </SectionCard>

      <SectionCard icon={<Users size={20} />} title="Expected Attendees">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Stepper
            value={Number(formData.expectedAttendees)}
            min={1}
            max={maxAttendees || 5}
            onChange={(val) => setFormData({ ...formData, expectedAttendees: val })}
          />
          <span style={{ fontSize: 14, color: "#6b7280" }}>(Maximum: {maxAttendees || 5})</span>
        </div>
      </SectionCard>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 12, marginTop: 24, marginBottom: 40 }}>
        <button type="button" onClick={() => navigate(-1)}
          style={{ flex: 1, padding: "14px", border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", color: "#374151", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={!canSubmit || updateMutation.isPending}
          style={{ flex: 1, padding: "14px", border: "none", borderRadius: 12, background: (canSubmit && !updateMutation.isPending) ? "#7c3aed" : "#c4b5fd", color: "#fff", fontSize: 15, fontWeight: 600, cursor: (canSubmit && !updateMutation.isPending) ? "pointer" : "not-allowed" }}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
