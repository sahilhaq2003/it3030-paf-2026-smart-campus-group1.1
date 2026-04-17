import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createBooking, checkAvailability } from "../../api/bookingApi";
import axiosInstance from "../../api/axiosInstance";

// Convert HH:MM 24h to { hour12, minute, period } or null if empty
function parseTo12(time24) {
  if (!time24) return null;
  const [h, m] = time24.split(":").map(Number);
  return { hour12: h % 12 || 12, minute: m, period: h >= 12 ? "PM" : "AM" };
}

// Convert { hour12, minute, period } to HH:MM 24h
function toTime24({ hour12, minute, period }) {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDisplay(parsed) {
  if (!parsed) return "--:-- --";
  return `${String(parsed.hour12).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")} ${parsed.period}`;
}

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
      style={{ overflowY: "auto", maxHeight: 200, padding: "8px 0", scrollbarWidth: "none" }}
    >
      {items.map((item) => (
        <div
          key={item}
          onClick={() => onSelect(item)}
          style={{
            padding: "9px 18px",
            cursor: "pointer",
            fontWeight: item === selected ? 600 : 400,
            color: item === selected ? "#7c3aed" : "#374151",
            background: item === selected ? "#f5f3ff" : "transparent",
            borderRadius: 8,
            margin: "1px 6px",
            fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          {format(item)}
        </div>
      ))}
    </div>
  );
}

// Custom time picker — no native browser popup
function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const parsed = parseTo12(value);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const parsedOrDefault = parsed || { hour12: 12, minute: 0, period: "AM" };
  const update = (patch) => onChange(toTime24({ ...parsedOrDefault, ...patch }));

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "12px 44px 12px 16px",
          fontSize: 15,
          color: "#111827",
          background: "#fff",
          cursor: "pointer",
          userSelect: "none",
          position: "relative",
        }}
      >
        {formatDisplay(parsed)}
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 15 }}>
          ⏱
        </span>
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 100,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            display: "flex",
          }}
        >
          <Column
            items={hours}
            selected={parsedOrDefault.hour12}
            onSelect={(h) => update({ hour12: h })}
            format={(h) => String(h).padStart(2, "0")}
          />
          <div style={{ width: 1, background: "#f3f4f6", margin: "8px 0" }} />
          <Column
            items={minutes}
            selected={parsedOrDefault.minute}
            onSelect={(m) => update({ minute: m })}
            format={(m) => String(m).padStart(2, "0")}
          />
          <div style={{ width: 1, background: "#f3f4f6", margin: "8px 0" }} />
          <div style={{ display: "flex", flexDirection: "column", padding: "8px 0" }}>
            {["AM", "PM"].map((p) => (
              <div
                key={p}
                onClick={() => update({ period: p })}
                style={{
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontWeight: parsedOrDefault.period === p ? 600 : 400,
                  color: parsedOrDefault.period === p ? "#7c3aed" : "#374151",
                  background: parsedOrDefault.period === p ? "#f5f3ff" : "transparent",
                  borderRadius: 8,
                  margin: "2px 6px",
                  fontSize: 14,
                }}
              >
                {p}
              </div>
            ))}
          </div>
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
    <div style={{ display: "flex", alignItems: "center" }}>
      <button type="button" onClick={() => onChange(Math.max(min, (Number(value) || min) - 1))} disabled={Number(value) <= min}
        style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: "8px 0 0 8px", background: "#fff", fontSize: 20, cursor: Number(value) <= min ? "not-allowed" : "pointer", color: Number(value) <= min ? "#d1d5db" : "#374151", fontWeight: 500 }}>−</button>
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
        style={{
          width: 56, height: 40,
          border: "1px solid #e5e7eb", borderLeft: "none", borderRight: "none",
          textAlign: "center", fontSize: 16, fontWeight: 600, color: "#111827",
          background: "#fff", outline: "none",
        }}
      />
      <button type="button" onClick={() => onChange(Math.min(max ?? Infinity, (Number(value) || min) + 1))} disabled={max !== undefined && Number(value) >= max}
        style={{ width: 40, height: 40, border: "1px solid #e5e7eb", borderRadius: "0 8px 8px 0", background: "#fff", fontSize: 20, cursor: (max !== undefined && Number(value) >= max) ? "not-allowed" : "pointer", color: (max !== undefined && Number(value) >= max) ? "#d1d5db" : "#374151", fontWeight: 500 }}>+</button>
    </div>
  );
}

// Section card
function SectionCard({ icon, title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "28px 32px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ color: "#7c3aed", fontSize: 20 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#111827" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", border: "1px solid #e5e7eb", borderRadius: 10,
  padding: "12px 16px", fontSize: 15, color: "#111827",
  background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

export default function BookingRequestPage() {
  const navigate = useNavigate();
  const { id: facilityIdFromUrl } = useParams();

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

  const { data: facility } = useQuery({
    queryKey: ["facility", facilityIdFromUrl],
    queryFn: () => axiosInstance.get(`/facilities/${facilityIdFromUrl}`).then((r) => r.data),
    enabled: !!facilityIdFromUrl,
  });

  useEffect(() => {
    const { facilityId, bookingDate, startTime, endTime } = formData;
    if (facilityId && bookingDate && startTime && endTime) {
      setChecking(true);
      checkAvailability(facilityId, bookingDate, startTime, endTime)
        .then((res) => setIsAvailable(res.data))
        .catch(() => setIsAvailable(null))
        .finally(() => setChecking(false));
    }
  }, [formData.facilityId, formData.bookingDate, formData.startTime, formData.endTime]);

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

  const maxAttendees = facility?.capacity ?? undefined;
  const canSubmit = formData.bookingDate && formData.startTime && formData.endTime && formData.purpose && isAvailable !== false;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px", fontFamily: "system-ui, sans-serif" }}>
      <a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }}
        style={{ color: "#6b7280", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
        ← Back to facility
      </a>

      <h1 style={{ fontSize: 30, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>
        Book {facility?.name || "Facility"}
      </h1>
      {facility && (
        <p style={{ color: "#6b7280", margin: "0 0 28px", fontSize: 15 }}>
          Location: {facility.location} &bull; Capacity: {facility.capacity} {facility.capacity === 1 ? "Individual" : "People"}
        </p>
      )}

      <SectionCard icon="📅" title="Select Date">
        <input type="date" name="bookingDate" value={formData.bookingDate}
          onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
          min={new Date().toISOString().split("T")[0]}
          style={{ ...inputStyle, color: formData.bookingDate ? "#111827" : "#9ca3af" }} />
      </SectionCard>

      <SectionCard icon="🕐" title="Time Range">
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
        {checking && <div style={{ marginTop: 10, padding: "10px 14px", background: "#f9fafb", borderRadius: 8, fontSize: 13, color: "#6b7280" }}>Checking availability...</div>}
        {!checking && isAvailable === true && <div style={{ marginTop: 10, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, color: "#15803d" }}>✅ This slot is available!</div>}
        {!checking && isAvailable === false && <div style={{ marginTop: 10, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>❌ This slot is not available. Please choose a different time.</div>}
      </SectionCard>

      <SectionCard icon="📄" title="Purpose of Booking">
        <textarea name="purpose" value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          rows={5} placeholder="Please describe the purpose of your booking..."
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
      </SectionCard>

      <SectionCard icon="👥" title="Expected Attendees">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Stepper value={Number(formData.expectedAttendees)} min={1} max={maxAttendees}
            onChange={(val) => setFormData({ ...formData, expectedAttendees: val })} />
          {maxAttendees && <span style={{ fontSize: 14, color: "#6b7280" }}>(Maximum: {maxAttendees})</span>}
        </div>
      </SectionCard>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button type="button" onClick={() => navigate(-1)}
          style={{ flex: 1, padding: "14px", border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", color: "#374151", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={!canSubmit || mutation.isPending}
          style={{ flex: 2, padding: "14px", border: "none", borderRadius: 12, background: canSubmit && !mutation.isPending ? "#7c3aed" : "#c4b5fd", color: "#fff", fontSize: 15, fontWeight: 600, cursor: canSubmit && !mutation.isPending ? "pointer" : "not-allowed" }}>
          {mutation.isPending ? "Submitting..." : "Submit Booking Request"}
        </button>
      </div>
    </div>
  );
}
