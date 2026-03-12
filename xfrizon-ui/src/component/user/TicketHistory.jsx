import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import QRCode from "qrcode";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaDownload,
  FaQrcode,
} from "react-icons/fa";
import api from "../../api/axios";
import {
  parseTicketsFromResponse,
  downloadTicketPDF,
  normalizeTicketData,
} from "../../hooks/useTicketDownload";

export default function TicketHistory() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketQrUrl, setSelectedTicketQrUrl] = useState(null);

  // Helper function to construct image URLs
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    // Ensure path starts with /
    const normalized = path.startsWith("/") ? path : `/${path}`;
    // Don't add /api/v1 to paths that already start with /api or /uploads
    if (import.meta.env.PROD) {
      return normalized;
    }
    if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
      return `http://localhost:8081${normalized}`;
    }
    return `http://localhost:8081/api/v1${normalized}`;
  };

  useEffect(() => {
    fetchUserTickets();
  }, []);

  const fetchUserTickets = async () => {
    try {
      setLoading(true);
      // Prefer the list endpoint (typically returns all tickets), fall back if not available
      let response;
      try {
        response = await api.get("/user-tickets/list");
      } catch {
        response = await api.get("/user-tickets");
      }

      const normalizedTickets = parseTicketsFromResponse(response);
      setTickets(normalizedTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load ticket history");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const toValidDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (dateString) => {
    const date = toValidDate(dateString);
    if (!date) return "Date TBD";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = toValidDate(dateString);
    if (!date) return "Time TBD";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const downloadTicket = async (ticket, eventTitle = "event") => {
    // Prefer client-side branded PDF generation (falls back to backend)
    await downloadTicketPDF(ticket, eventTitle);
  };

  useEffect(() => {
    let cancelled = false;
    const generate = async () => {
      if (!selectedTicket) {
        setSelectedTicketQrUrl(null);
        return;
      }

      if (selectedTicket.qrCodeUrl) {
        setSelectedTicketQrUrl(selectedTicket.qrCodeUrl);
        return;
      }

      const payload =
        selectedTicket.qrPayload ||
        selectedTicket.qr_code_payload ||
        selectedTicket.validationCode ||
        selectedTicket.validation_code ||
        selectedTicket.ticketId ||
        selectedTicket.ticket_id ||
        selectedTicket.id ||
        "";

      if (!payload) {
        setSelectedTicketQrUrl(null);
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(String(payload), {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 360,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        if (!cancelled) setSelectedTicketQrUrl(dataUrl);
      } catch {
        if (!cancelled) setSelectedTicketQrUrl(null);
      }
    };

    generate();
    return () => {
      cancelled = true;
    };
  }, [selectedTicket]);

  const isUpcoming = (eventDate) => {
    const date = toValidDate(eventDate);
    if (!date) return false;
    return date > new Date();
  };

  const isPast = (eventDate) => {
    const date = toValidDate(eventDate);
    if (!date) return false;
    return date < new Date();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">My Tickets</h2>
        <p className="text-gray-400">
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-400">Loading your tickets...</div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">
            You haven't purchased any tickets yet
          </p>
          <a
            href="/explore-events"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
          >
            Browse Events
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((userTicket, index) => {
            const event = userTicket?.event || {};
            const eventTitle =
              userTicket?.eventTitle || event?.title || event?.name || "Event";
            const eventDateTime =
              event?.eventDateTime ||
              event?.event_date_time ||
              userTicket?.eventDate ||
              userTicket?.event_date ||
              null;
            const flyerUrl =
              userTicket?.eventFlyerUrl ||
              event?.flyerUrl ||
              event?.flyer_url ||
              null;
            const venue =
              userTicket?.eventLocation ||
              event?.venueName ||
              event?.venue_name ||
              "";
            const city = event?.city || "";
            const upcoming = isUpcoming(eventDateTime);
            const past = isPast(eventDateTime);
            const ticketKey = userTicket?.id || userTicket?.ticketId || index;

            return (
              <div
                key={ticketKey}
                className={`bg-[#1e1e1e] border rounded-lg overflow-hidden transition-all hover:border-red-600 ${
                  past ? "border-gray-800 opacity-75" : "border-gray-800"
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Event image */}
                  <div className="md:w-32 h-32 shrink-0">
                    <img
                      src={
                        flyerUrl
                          ? getImageUrl(flyerUrl)
                          : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Crect fill='%231a1a1a' width='128' height='128'/%3E%3C/svg%3E"
                      }
                      alt={eventTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            {eventTitle}
                          </h3>
                          <p className="text-red-500 text-sm font-medium">
                            {userTicket.ticketType} × {userTicket.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          {upcoming && (
                            <span className="inline-block bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                              Upcoming
                            </span>
                          )}
                          {past && (
                            <span className="inline-block bg-gray-600 text-white text-xs px-3 py-1 rounded-full">
                              Past Event
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt size={14} className="text-gray-500" />
                          <span>{formatDate(eventDateTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaClock size={14} className="text-gray-500" />
                          <span>{formatTime(eventDateTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt size={14} className="text-gray-500" />
                          <span>
                            {[venue, city].filter(Boolean).join(", ") ||
                              "Location TBD"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-4 md:py-4 md:px-6 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-800">
                    <button
                      onClick={() =>
                        downloadTicket(
                          userTicket,
                          userTicket?.eventTitle || userTicket?.event?.title,
                        )
                      }
                      className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-md transition-colors text-xs font-semibold"
                    >
                      <FaDownload size={14} />
                      Download
                    </button>
                    {upcoming && (
                      <button
                        onClick={() => setSelectedTicket(userTicket)}
                        className="flex items-center justify-center gap-1.5 bg-[#1e1e1e] hover:bg-[#252525] text-white px-3 py-2 rounded-md transition-colors border border-gray-700 text-xs font-semibold"
                      >
                        <FaQrcode size={14} />
                        QR Code
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] rounded-lg p-8 max-w-md w-full border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Ticket QR Code</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="text-center">
              <p className="text-gray-400 mb-4">
                {selectedTicket.eventTitle ||
                  selectedTicket.event?.title ||
                  "Event"}
              </p>
              {selectedTicketQrUrl ? (
                <img
                  src={selectedTicketQrUrl}
                  alt="Ticket QR Code"
                  className="w-48 h-48 border-4 border-red-600 p-4 bg-white rounded mx-auto mb-4"
                />
              ) : (
                <div className="w-48 h-48 border-4 border-gray-800 bg-white rounded mx-auto mb-4 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">QR unavailable</span>
                </div>
              )}

              <p className="text-gray-500 text-xs mb-2">Validation Code</p>
              <p className="text-white font-mono text-sm">
                {selectedTicket.validationCode || "—"}
              </p>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full mt-6 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
