import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createBooking, checkAvailability } from "../../api/bookingApi";
import axiosInstance from "../../api/axiosInstance";

export default function BookingRequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const facilityIdFromUrl = searchParams.get("facilityId");

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    facilityId: facilityIdFromUrl || "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    purpose: "",
    expectedAttendees: "",
  });
  const [isAvailable, setIsAvailable] = useState(null);
  const [checking, setChecking] = useState(false);

  // Fetch facility details
  const { data: facility } = useQuery({
    queryKey: ["facility", facilityIdFromUrl],
    queryFn: () => axiosInstance.get(`/facilities/${facilityIdFromUrl}`).then((r) => r.data),
    enabled: !!facilityIdFromUrl,
  });

  // Check availability when date/time changes
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
    onSuccess: () => {
      toast.success("Booking request submitted successfully!");
      navigate("/bookings/my");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to submit booking");
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const payload = {
      facilityId: Number(formData.facilityId),
      bookingDate: formData.bookingDate,
      startTime: formData.startTime + ":00",
      endTime: formData.endTime + ":00",
      purpose: formData.purpose,
      expectedAttendees: formData.expectedAttendees
        ? Number(formData.expectedAttendees)
        : null,
    };
    mutation.mutate(payload);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Booking Request</h1>
        <p className="text-gray-500 mt-1">
          {facility ? `Booking for: ${facility.name}` : "Fill in the details to request a facility booking"}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
              {s}
            </div>
            {s < 2 && (
              <div className={`h-1 w-16 mx-2 ${step > s ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
        <div className="ml-4 text-sm text-gray-500">
          {step === 1 && "Pick Date & Time"}
          {step === 2 && "Confirm Details"}
        </div>
      </div>

      {/* Step 1 — Date & Time */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Pick Date & Time</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking Date</label>
              <input
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Availability Status */}
            {checking && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                Checking availability...
              </div>
            )}
            {!checking && isAvailable === true && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                ✅ This slot is available!
              </div>
            )}
            {!checking && isAvailable === false && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                ❌ This slot is not available. Please choose a different time.
              </div>
            )}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!formData.bookingDate || !formData.startTime || !formData.endTime || isAvailable === false}
            className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-medium
              disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2 — Purpose & Confirm */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Confirm Details</h2>

          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
              <p><span className="font-medium">Facility:</span> {facility?.name}</p>
              <p><span className="font-medium">Date:</span> {formData.bookingDate}</p>
              <p><span className="font-medium">Time:</span> {formData.startTime} — {formData.endTime}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the purpose of this booking..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Attendees (optional)
              </label>
              <input
                type="number"
                name="expectedAttendees"
                value={formData.expectedAttendees}
                onChange={handleChange}
                min="1"
                placeholder="e.g. 10"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.purpose || mutation.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium
                disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              {mutation.isPending ? "Submitting..." : "Submit Booking Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}