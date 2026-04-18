import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CheckCircle, Info } from "lucide-react";

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

          html5QrCode.stop().catch(() => {});

          try {
            const url = new URL(decodedText);
            window.location.href = url.pathname;
          } catch {
            window.location.href = decodedText;
          }
        },
        () => {} 
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
    <div className="min-h-screen bg-slate-50 font-sans pb-24 pt-6">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8 mt-2 text-center">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Camera className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Scan Booking QR</h1>
          <p className="text-slate-500 font-medium text-sm mt-2">
            Point the camera at the student's booking receipt to verify their reservation.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 shadow-sm flex items-start gap-3">
            <Info className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-rose-700 text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Scanner Box */}
        {!scanned && (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm mb-6">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
              <span className="text-[11px] font-black tracking-widest uppercase text-slate-500">Camera Status</span>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <div className={`w-2 h-2 rounded-full ${scanning ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  {scanning ? "Active" : "Starting"}
                </span>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-center min-h-[300px]">
              <div id="qr-reader" className="w-full max-w-[300px] mx-auto rounded-3xl overflow-hidden border-4 border-white shadow-xl" />
            </div>
          </div>
        )}

        {/* Scanned success */}
        {scanned && (
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-[2rem] p-8 text-center shadow-sm mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <p className="text-xl font-black text-slate-900 tracking-tight">QR Code Scanned!</p>
            <p className="text-slate-500 font-medium text-sm mt-2">Redirecting you to the verification dashboard...</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/60 border border-slate-200 rounded-3xl p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Instructions</p>
          <ul className="text-sm font-medium text-slate-600 space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex-shrink-0">1</span>
              <span className="mt-0.5">Ask the student to open their booking receipt email or dashboard.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex-shrink-0">2</span>
              <span className="mt-0.5">Hold their phone screen steady in front of this camera.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex-shrink-0">3</span>
              <span className="mt-0.5">The system will automatically scan and verify the booking validity.</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}