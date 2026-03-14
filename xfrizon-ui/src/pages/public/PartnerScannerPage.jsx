import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import partnersApi from "../../api/partnersApi";

function useQueryToken() {
  const location = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("token") || "";
  }, [location.search]);
}

export default function PartnerScannerPage() {
  const queryToken = useQueryToken();
  const [token, setToken] = useState(queryToken);
  const [partnerKey, setPartnerKey] = useState(
    localStorage.getItem("xf_partner_key") || "",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [scanSupported, setScanSupported] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setScanSupported(
      typeof window !== "undefined" && "BarcodeDetector" in window,
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const normalizeToken = (raw) => {
    const text = String(raw || "").trim();
    if (!text) return "";

    // Raw token
    if (/^[a-zA-Z0-9]{16,}$/.test(text)) return text;

    // JSON payload from QR: {"token":"..."}
    try {
      const parsed = JSON.parse(text);
      if (parsed?.token) return String(parsed.token).trim();
    } catch {
      // ignore
    }

    // URL payload: /partner-scanner?token=...
    try {
      const url = new URL(text);
      return (url.searchParams.get("token") || "").trim();
    } catch {
      return text;
    }
  };

  const verify = async () => {
    setError("");
    setResult(null);
    const normalizedToken = normalizeToken(token);
    if (!normalizedToken) {
      setError("Token is required");
      return;
    }
    if (!partnerKey.trim()) {
      setError("Partner API key is required");
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem("xf_partner_key", partnerKey.trim());
      const response = await partnersApi.verifyScan(
        normalizedToken,
        partnerKey.trim(),
      );
      setResult(response);
    } catch (e) {
      setError(e?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    setCameraOn(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setError("");
    if (!scanSupported) {
      setError(
        "Camera QR scanning is not supported on this browser. Use manual token input.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes?.length) {
            const raw = codes[0].rawValue || "";
            setToken(raw);
            stopCamera();
          }
        } catch {
          // Ignore transient frame read errors
        }
      }, 500);
    } catch {
      setError("Unable to access camera. Check browser permissions.");
      stopCamera();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-xl mx-auto bg-[#121212] border border-gray-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Partner QR Scanner</h1>
        <p className="text-gray-400 text-sm mt-1 mb-6">
          Verify XF reward QR and apply discount in-store.
        </p>

        <label className="block text-xs text-gray-400 mb-1">
          Partner API Key
        </label>
        <input
          value={partnerKey}
          onChange={(e) => setPartnerKey(e.target.value)}
          className="w-full bg-[#0d0d0d] border border-gray-700 rounded-lg px-3 py-2 text-sm mb-4"
          placeholder="XF_PARTNER_..."
        />

        <label className="block text-xs text-gray-400 mb-1">
          Redemption Token
        </label>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full bg-[#0d0d0d] border border-gray-700 rounded-lg px-3 py-2 text-sm"
          placeholder="Paste token from QR scan"
        />

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={cameraOn ? stopCamera : startCamera}
            className="text-xs px-3 py-1.5 rounded border border-gray-700 hover:bg-[#1a1a1a]"
          >
            {cameraOn ? "Stop Camera" : "Scan QR with Camera"}
          </button>
          {scanSupported ? (
            <span className="text-[11px] text-gray-500">
              Camera scan supported
            </span>
          ) : (
            <span className="text-[11px] text-yellow-500">
              Camera scan not supported on this browser
            </span>
          )}
        </div>

        {cameraOn && (
          <div className="mt-3 border border-gray-800 rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              className="w-full max-h-72 object-cover"
              autoPlay
              playsInline
              muted
            />
          </div>
        )}

        <button
          onClick={verify}
          disabled={loading}
          className="mt-5 w-full bg-[#c0f24d] text-black font-bold py-2.5 rounded-lg hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify & Apply Discount"}
        </button>

        {error && <p className="text-red-400 text-xs mt-4">{error}</p>}

        {result && (
          <div
            className={`mt-5 rounded-lg border p-4 ${
              result.valid
                ? "border-green-500/40 bg-green-500/10"
                : "border-red-500/40 bg-red-500/10"
            }`}
          >
            <p
              className={`font-semibold ${result.valid ? "text-green-400" : "text-red-400"}`}
            >
              {result.valid ? "VALID" : "INVALID"}
            </p>
            <p className="text-sm mt-1">{result.message}</p>
            {result.valid && (
              <div className="text-xs text-gray-300 mt-2 space-y-1">
                <p>User: {result.userName}</p>
                <p>Offer: {result.offerTitle}</p>
                <p>Discount: {result.discountPercent}%</p>
                <p>Partner: {result.partnerName}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
