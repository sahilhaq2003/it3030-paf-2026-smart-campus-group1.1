import { useState, useEffect } from "react";
import { checkAvailability } from "../../api/bookingApi";
import { useNavigate } from "react-router-dom";

export default function AvailabilityCheckerWidget({ facilityId }) {
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAvailable, setIsAvailable] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (facilityId && date && startTime && endTime) {
      setChecking(true);
      checkAvailability(facilityId, date, startTime, endTime)
        .then((res) => setIsAvailable(res.data))
        .catch(() => setIsAvailable(null))
        .finally(() => setChecking(false));
    }
  }, [facilityId, date, startTime, endTime]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Check Availability</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Availability Status */}
        {checking && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
            Checking availability...
          </div>
        )}
        {!checking && isAvailable === true && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            ✅ Available! This slot is free.
          </div>
        )}
        {!checking && isAvailable === false && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ❌ Not available. Please choose a different time.
          </div>
        )}

        {/* Book Now Button */}
        <button
          onClick={() => navigate(`/bookings/request?facilityId=${facilityId}&date=${date}&startTime=${startTime}&endTime=${endTime}`)}
          disabled={!isAvailable}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          Proceed to Book
        </button>
      </div>
    </div>
  );
}