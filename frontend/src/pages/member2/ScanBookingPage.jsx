import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CheckCircle } from "lucide-react";

export default function ScanBookingPage() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
  if (scanned) return;
  setScanned(true);

  // Stop scanner
  html5QrCode.stop().catch(() => {});

  // Use window.location for full page load instead of React navigate
  try {
    const url = new URL(decodedText);
    window.location.href = url.pathname;
  } catch {
    window.location.href = decodedText;
  }
},
        () => {} // ignore scan errors
      )
      .then(() => setScanning(true))
      .catch((err) => {
        setError("Could not access camera. Please allow camera permission.");
      });

    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="max-w-lg mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Camera className="w-7 h-7 text-indigo-600" />
          Scan Booking QR
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Point the camera at the student's QR code to verify their booking.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Scanner Box */}
      {!scanned && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${scanning ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`} />
            <span className="text-sm text-gray-600">
              {scanning ? "Scanner active — show QR code" : "Starting camera..."}
            </span>
          </div>
          <div id="qr-reader" className="w-full" />
        </div>
      )}

      {/* Scanned success */}
      {scanned && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-emerald-700 font-semibold">QR Code Scanned!</p>
          <p className="text-gray-500 text-sm mt-1">Redirecting to booking details...</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-700 font-medium mb-2">Instructions:</p>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>1. Ask the student to open their booking QR code email</li>
          <li>2. Hold their phone screen in front of this camera</li>
          <li>3. The system will automatically verify the booking</li>
        </ul>
      </div>
    </div>
  );
}