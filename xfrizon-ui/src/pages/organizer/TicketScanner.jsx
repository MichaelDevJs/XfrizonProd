import { useState, useRef, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaQrcode, FaArrowLeft, FaCheckCircle, FaKeyboard } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/axios";
import { toast } from "react-toastify";
import jsQR from "jsqr";

const TicketScanner = () => {
  const navigate = useNavigate();
  const { organizer } = useContext(AuthContext);
  const [scanMode, setScanMode] = useState("camera"); // "camera" or "manual"
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [manualCode, setManualCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const lastScannedRef = useRef(null);

  useEffect(() => {
    if (scanMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          startScanning();
        };
      }
    } catch (error) {
      console.error("Failed to access camera:", error);
      toast.error("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      scanningRef.current = false;
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startScanning = () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    scanFrame();
  };

  const scanFrame = () => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        // Prevent duplicate scans within 3 seconds
        const now = Date.now();
        if (lastScannedRef.current !== code.data || (now - (lastScannedRef.lastTime || 0)) > 3000) {
          lastScannedRef.current = code.data;
          lastScannedRef.lastTime = now;
          handleCodeDetected(code.data);
        }
      }
    }

    requestAnimationFrame(scanFrame);
  };

  const handleCodeDetected = async (code) => {
    const resolvedCode = resolveTicketNumber(code);
    setScanResult(resolvedCode);
    toast.info(`QR Code detected: ${resolvedCode}`);
    // Auto-validate
    await validateTicket(resolvedCode);
  };

  const resolveTicketNumber = (rawValue) => {
    if (!rawValue) return "";
    const trimmed = String(rawValue).trim();

    try {
      const parsed = JSON.parse(trimmed);
      const code = parsed?.validation_code || parsed?.validationCode;
      if (code) return String(code).trim().toUpperCase();
    } catch {
      // Not JSON - treat as plain code
    }

    return trimmed.toUpperCase();
  };

  const validateTicket = async (ticketCode = scanResult) => {
    if (!ticketCode || isValidating) return;

    setIsValidating(true);
    try {
      // Try to validate ticket via API
      await api.post(`/organizers/${organizer?.id}/validate-ticket`, {
        ticketNumber: ticketCode,
      });

      const newEntry = {
        ticketNumber: ticketCode,
        timestamp: new Date().toLocaleTimeString(),
        status: "success",
      };

      setScanHistory((prev) => [newEntry, ...prev.slice(0, 9)]); // Keep last 10
      toast.success(`Ticket ${ticketCode} validated successfully!`);
      setScanResult(null);
      setManualCode("");
    } catch (error) {
      const errorEntry = {
        ticketNumber: ticketCode,
        timestamp: new Date().toLocaleTimeString(),
        status: "failed",
      };

      setScanHistory((prev) => [errorEntry, ...prev.slice(0, 9)]);
      toast.error(error.response?.data?.message || "Failed to validate ticket. Please try again.");
      setScanResult(null);
      setManualCode("");
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      validateTicket(resolveTicketNumber(manualCode));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/organizer/dashboard")}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <FaArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>
        <div>
          <h1 className="text-4xl font-light text-gray-200 mb-2">
            Ticket Scanner
          </h1>
          <p className="text-gray-500 font-light">
            Scan QR codes to validate tickets
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-3">
        <button
          onClick={() => setScanMode("camera")}
          className={`flex-1 px-4 py-3 rounded-lg font-light text-sm transition-all duration-300 ${
            scanMode === "camera"
              ? "bg-indigo-600 text-white"
              : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
          }`}
        >
          <FaQrcode className="inline mr-2 w-4 h-4" />
          Camera Scan
        </button>
        <button
          onClick={() => setScanMode("manual")}
          className={`flex-1 px-4 py-3 rounded-lg font-light text-sm transition-all duration-300 ${
            scanMode === "manual"
              ? "bg-indigo-600 text-white"
              : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
          }`}
        >
          <FaKeyboard className="inline mr-2 w-4 h-4" />
          Manual Entry
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <div className="space-y-4">
              {scanMode === "camera" ? (
                <>
                  <div className="bg-black rounded-lg overflow-hidden relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Auto-Scanning
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="bg-zinc-800/50 rounded-lg p-8">
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-light text-gray-400 mb-2">
                        Validation Code
                      </label>
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        placeholder="Enter ticket validation code"
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-lg font-mono text-lg focus:border-indigo-500 focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!manualCode.trim() || isValidating}
                      className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-light text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaCheckCircle className="inline mr-2 w-4 h-4" />
                      {isValidating ? "Validating..." : "Validate Ticket"}
                    </button>
                  </form>
                </div>
              )}

              {scanResult && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500 rounded-lg">
                  <p className="text-indigo-400 font-light text-sm">
                    Scanned:{" "}
                    <span className="font-mono font-semibold">
                      {scanResult}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scan History */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-light text-gray-200 mb-4">
            Scan History
          </h2>
          <div className="space-y-2">
            {scanHistory.length === 0 ? (
              <p className="text-gray-500 font-light text-sm text-center py-8">
                No scans yet
              </p>
            ) : (
              scanHistory.map((entry, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    entry.status === "success"
                      ? "border-green-500/30 bg-green-500/10"
                      : "border-red-500/30 bg-red-500/10"
                  }`}
                >
                  <p
                    className={`text-xs font-mono font-semibold ${
                      entry.status === "success"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {entry.ticketNumber}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {entry.timestamp}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-light text-gray-200 mb-4">Session Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-gray-500 font-light text-sm mb-2">Total Scans</p>
            <p className="text-2xl font-light text-white">
              {scanHistory.length}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-gray-500 font-light text-sm mb-2">Validated</p>
            <p className="text-2xl font-light text-green-400">
              {scanHistory.filter((s) => s.status === "success").length}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-gray-500 font-light text-sm mb-2">Failed</p>
            <p className="text-2xl font-light text-red-400">
              {scanHistory.filter((s) => s.status === "failed").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketScanner;
