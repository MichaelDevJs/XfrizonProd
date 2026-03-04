import { useState, useRef, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import api from "../../../api/axios";
import { toast } from "react-toastify";

export const useScanner = () => {
  const { organizer } = useContext(AuthContext);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Failed to access camera:", error);
      toast.error("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const captureAndScan = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );

      // For demo: simulate QR code scan
      setTimeout(() => {
        const ticketId =
          "TKT-" + Math.random().toString(36).substring(7).toUpperCase();
        setScanResult(ticketId);
        toast.success(`Ticket scanned: ${ticketId}`);
      }, 500);
    }
  };

  const validateTicket = async (onSuccess) => {
    if (!scanResult) return;

    try {
      await api.post(`/organizers/${organizer?.id}/validate-ticket`, {
        ticketNumber: scanResult,
      });

      toast.success(`Ticket ${scanResult} validated successfully!`);
      onSuccess && onSuccess(scanResult);
      setScanResult(null);
      setShowScanner(false);
    } catch (error) {
      console.error("Failed to validate ticket:", error);
      toast.error("Failed to validate ticket. Please try again.");
    }
  };

  const closeScanner = () => {
    stopCamera();
    setShowScanner(false);
    setScanResult(null);
  };

  const openScanner = () => {
    setShowScanner(true);
    setTimeout(() => startCamera(), 100);
  };

  return {
    showScanner,
    setShowScanner,
    scanResult,
    setScanResult,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureAndScan,
    validateTicket,
    closeScanner,
    openScanner,
  };
};
