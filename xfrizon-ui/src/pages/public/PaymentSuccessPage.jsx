import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import QRCode from "qrcode";
import {
  FaCheckCircle,
  FaDownload,
  FaQrcode,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";
import api from "../../api/axios";
import {
  parseTicketsFromResponse,
  downloadTicketPDF,
  downloadCombinedTicketsPDF,
} from "../../hooks/useTicketDownload";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ticketData, setTicketData] = useState(null);
  const [allPurchasedTickets, setAllPurchasedTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketQrUrl, setSelectedTicketQrUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const paymentIntentId = searchParams.get("payment_intent");

  useEffect(() => {
    fetchPaymentAndTickets();
  }, [paymentIntentId]);

  useEffect(() => {
    let cancelled = false;
    const generate = async () => {
      if (!selectedTicket) {
        setSelectedTicketQrUrl(null);
        return;
      }

      // If backend provided a QR image URL, prefer it
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

  const fetchPaymentAndTickets = async () => {
    try {
      if (!paymentIntentId) {
        console.warn("No payment reference");
        setError("No payment reference found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Fetch all tickets for this user
      const response = await api.get("/user-tickets/list");

      console.log("Tickets API response:", response.data);

      // Use unified parsing service
      const allTickets = parseTicketsFromResponse(response);

      console.log("All tickets:", allTickets);
      console.log("Looking for payment intent:", paymentIntentId);

      // Find tickets matching this payment intent
      const purchasedTickets = allTickets.filter((t) => {
        const matches =
          t.paymentIntentId === paymentIntentId ||
          t.stripeIntentId === paymentIntentId;

        if (matches) {
          console.log("✓ MATCH FOUND on paymentIntentId:", {
            ticketId: t.id,
            paymentIntentId: t.paymentIntentId,
            eventTitle: t.eventTitle,
          });
        }
        return matches;
      });

      console.log("Matched tickets:", purchasedTickets);

      if (purchasedTickets.length > 0) {
        setTicketData(purchasedTickets[0]);
        setAllPurchasedTickets(purchasedTickets);
        setError(null);
        window.dispatchEvent(
          new CustomEvent("points:refresh", {
            detail: { source: "payment-success", paymentIntentId },
          }),
        );
        console.log("✓ Ticket data set:", purchasedTickets);
        console.log("✓ Total tickets purchased:", purchasedTickets.length);
      } else {
        console.warn(
          "✗ No tickets found matching payment intent:",
          paymentIntentId,
        );
        setError(
          "Your ticket is being processed. If this message persists, please refresh the page or check your email for your ticket.",
        );
      }
    } catch (error) {
      console.error("Error fetching ticket data:", error);
      setError("Failed to load ticket data. Please try refreshing the page.");
      toast.error("Failed to load ticket data");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!ticketData) return;
    // Use unified download service
    await downloadTicketPDF(ticketData, ticketData.eventTitle);
  };

  const downloadAllTickets = async () => {
    if (!paymentIntentId || allPurchasedTickets.length === 0) return;
    // If multiple tickets, use combined download
    if (allPurchasedTickets.length > 1) {
      const eventTitle = ticketData?.eventTitle || "event";
      await downloadCombinedTicketsPDF(paymentIntentId, eventTitle);
    } else {
      // Single ticket - use individual download
      await downloadPDF();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <FaCheckCircle className="text-red-600 text-5xl" />
          </div>
          <p className="text-gray-400 mt-4">Confirming your purchase...</p>
        </div>
      </div>
    );
  }

  // Show error state if no ticket data and not loading
  if (!loading && !ticketData && error) {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <FaCheckCircle className="text-yellow-500 text-5xl mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">
              Payment Confirmed
            </h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-200 text-sm">
                If this takes too long, please check your email for your ticket
                or visit your profile.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center bg-green-500/20 rounded-full w-20 h-20 mb-6">
            <FaCheckCircle className="text-green-500 text-5xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-400">
            Your ticket has been confirmed. Check your email for QR code and
            event details.
          </p>
        </div>

        {/* Ticket Cards - Show all purchased tickets */}
        {allPurchasedTickets.length > 0 && (
          <div className="space-y-6 mb-8">
            {/* Top actions */}
            <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-3">
              <div className="flex flex-col sm:flex-row gap-2">
                {allPurchasedTickets.length > 1 && (
                  <button
                    onClick={downloadAllTickets}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-[#1e1e1e] hover:bg-[#252525] text-white px-3 py-2 rounded-md transition-colors border border-gray-700 text-sm font-semibold"
                  >
                    <FaDownload size={14} />
                    Download All ({allPurchasedTickets.length})
                  </button>
                )}

                <button
                  onClick={() => navigate("/ticket-history")}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-[#1e1e1e] hover:bg-[#252525] text-white px-3 py-2 rounded-md transition-colors border border-gray-700 text-sm font-semibold"
                >
                  View All Tickets
                </button>
              </div>
            </div>

            {allPurchasedTickets.map((ticket, index) => {
              // Use flattened properties from normalized ticket data
              const event = ticket.event || {};
              const flyerUrl =
                ticket.eventFlyerUrl || event.flyerUrl || event.flyer_url;
              const eventTitle = ticket.eventTitle || event.title || "Event";
              const eventDate =
                ticket.eventDate ||
                event.eventDateTime ||
                event.event_date_time;
              const location =
                ticket.eventLocation || event.venueName || event.venue_name;
              const venueAddress =
                event.venueAddress || event.venue_address || "";
              const city = event.city || "";
              const mapLink = event.venueMapLink || "";
              const fullLocation = [location, venueAddress, city]
                .filter(Boolean)
                .join(", ");

              return (
                <div
                  key={ticket.id}
                  className="bg-[#1e1e1e] border border-gray-800 rounded-lg overflow-hidden"
                >
                  {/* Ticket Number Indicator if Multiple */}
                  {allPurchasedTickets.length > 1 && (
                    <div className="bg-gray-700 text-white text-xs font-medium px-4 py-2 border-b border-gray-800">
                      Ticket {index + 1} of {allPurchasedTickets.length} -{" "}
                      {ticket.ticketType}
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={
                          flyerUrl
                            ? getImageUrl(flyerUrl)
                            : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23111111' width='400' height='400'/%3E%3C/svg%3E"
                        }
                        alt={eventTitle}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-md shrink-0"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23111111' width='400' height='400'/%3E%3C/svg%3E";
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                            {eventTitle}
                          </h2>
                          <span className="inline-block bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0">
                            Confirmed
                          </span>
                        </div>

                        <p className="text-red-400 text-sm mb-3">
                          {ticket.ticketType} x {ticket.quantity}
                        </p>

                        <div className="space-y-1.5 text-xs text-gray-400">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt
                              size={12}
                              className="text-gray-500 shrink-0"
                            />
                            <span className="truncate">
                              {eventDate
                                ? new Date(eventDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )
                                : "Date TBD"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock
                              size={12}
                              className="text-gray-500 shrink-0"
                            />
                            <span>
                              {eventDate
                                ? new Date(eventDate).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    },
                                  )
                                : "Time TBD"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt
                              size={12}
                              className="text-gray-500 shrink-0"
                            />
                            {mapLink ? (
                              <a
                                href={mapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-blue-400 hover:text-blue-300 underline cursor-pointer"
                                title="Click to open on Google Maps"
                              >
                                {fullLocation}
                              </a>
                            ) : (
                              <span className="truncate">{fullLocation}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() =>
                          downloadTicketPDF(
                            ticket,
                            ticket.eventTitle || ticket.event?.title || "event",
                          )
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 text-white px-3 py-2 rounded-md transition-colors text-xs font-semibold"
                        style={{ backgroundColor: "#403838" }}
                        onMouseEnter={(e) =>
                          (e.target.style.backgroundColor = "#4a4242")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor = "#403838")
                        }
                      >
                        <FaDownload size={12} />
                        Download
                      </button>
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-md transition-colors border border-gray-700 text-xs font-semibold"
                      >
                        <FaQrcode size={12} />
                        QR Code
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Email Info */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-200 text-sm">
            ✓ A confirmation email with your ticket QR code and event details
            has been sent to your registered email address.
          </p>
        </div>

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
                    <span className="text-gray-500 text-xs">
                      QR unavailable
                    </span>
                  </div>
                )}
                <p className="text-gray-500 text-xs mb-2">Validation Code</p>
                <p className="text-white font-mono text-sm">
                  {selectedTicket.validationCode}
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
    </div>
  );
}
