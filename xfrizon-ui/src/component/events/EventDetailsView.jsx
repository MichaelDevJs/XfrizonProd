import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaTicketAlt,
  FaMusic,
  FaHourglass,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CountdownTimer from "./CountdownTimer";
import { COUNTRIES_DATA } from "../../data/countriesData";

export default function EventDetailsView({ event, organizer, onBuyTickets }) {
  const navigate = useNavigate();
  const [selectedTickets, setSelectedTickets] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const SERVICE_FEE_RATE = 0.1; // 10%
  const roundCurrency = (amount) =>
    Math.round((Number(amount) + 1e-9) * 100) / 100;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleQuantityChange = (tierId, quantity) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [tierId]: quantity,
    }));
  };

  const isTicketAvailable = (tier) => {
    const now = currentTime;
    const saleStart = tier.saleStart ? new Date(tier.saleStart) : null;
    const saleEnd = tier.saleEnd ? new Date(tier.saleEnd) : null;

    if (saleStart && now < saleStart) {
      return { available: false, reason: "notStarted", startsAt: saleStart };
    }
    if (saleEnd && now > saleEnd) {
      return { available: false, reason: "ended", endedAt: saleEnd };
    }
    return { available: true };
  };

  const getTimeUntilEnd = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = currentTime;
    const diff = end - now;

    if (diff <= 0) return null;
    if (diff > 24 * 60 * 60 * 1000) return null; // More than 24 hours

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  const getTotalPrice = (tier) => {
    const qty = selectedTickets[tier.id] || 0;
    return tier.price * qty;
  };

  const getTotalSelectedTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const getSubtotal = () => {
    const tiers =
      event?.ticketTiers && event.ticketTiers.length > 0
        ? event.ticketTiers
        : event?.tickets && event.tickets.length > 0
          ? event.tickets
          : [];

    let subtotal = 0;
    tiers.forEach((tier, idx) => {
      const tierId = tier.id || tier._id || idx;
      const qty = selectedTickets[tierId] || 0;
      if (qty > 0) {
        subtotal += Number(tier.price || 0) * qty;
      }
    });
    return roundCurrency(subtotal);
  };

  const subtotalAmount = getSubtotal();
  const serviceFeeAmount = roundCurrency(subtotalAmount * SERVICE_FEE_RATE);
  const totalAmount = roundCurrency(subtotalAmount + serviceFeeAmount);

  const resolveFlyerUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    // Ensure path starts with /
    const normalized = path.startsWith("/") ? path : `/${path}`;
    // Don't add /api/v1 to paths that already start with /api or /uploads
    if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
      return `http://localhost:8081${normalized}`;
    }
    return `http://localhost:8081/api/v1${normalized}`;
  };

  // Helper to get currency symbol for the event's country
  const getCurrencySymbol = () => {
    if (!event?.country) return "₦";
    const country = COUNTRIES_DATA[event.country];
    if (!country || !country.currency) return "₦";
    // Map currency code to symbol (minimal set, fallback to code)
    const symbols = {
      NGN: "₦",
      USD: "$",
      EUR: "€",
      GBP: "£",
      GHS: "₵",
      ZAR: "R",
      KES: "Ksh",
      XOF: "CFA",
      XAF: "FCFA",
      CAD: "$",
      AUD: "$",
      INR: "₹",
      JPY: "¥",
      CNY: "¥",
      BRL: "R$",
      RUB: "₽",
    };
    return symbols[country.currency] || country.currency;
  };

  const currencySymbol = getCurrencySymbol();

  const parseOrganizerMedia = () => {
    const raw = organizer?.media || organizer?.mediaGallery || organizer?.gallery;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const isVideoUrl = (url = "") => {
    const value = String(url).toLowerCase();
    return /(\.mp4|\.mov|\.webm|\.m4v|\.ogg)(\?|$)/.test(value);
  };

  const getMediaUrl = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.url || item.src || item.path || item.mediaUrl || "";
  };

  const getMediaType = (item) => {
    if (!item || typeof item === "string") return "";
    return String(item.type || item.mediaType || "").toLowerCase();
  };

  const organizerMedia = parseOrganizerMedia();
  const organizerVideoCount = organizerMedia.filter((item) => {
    const type = getMediaType(item);
    const url = getMediaUrl(item);
    return type === "video" || isVideoUrl(url);
  }).length;
  const nightWithUsMedia = organizerMedia.find((item) => {
    if (!item) return false;
    const type = getMediaType(item);
    const url = getMediaUrl(item);
    return type === "video" || isVideoUrl(url);
  });

  const nightWithUsVideoUrl = nightWithUsMedia
    ? resolveFlyerUrl(getMediaUrl(nightWithUsMedia))
    : null;
  const nightWithUsCaption =
    (typeof nightWithUsMedia === "object" ? nightWithUsMedia?.caption : "") ||
    "From organizer media";

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        {/* Minimal Header */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-sm z-20 border-b border-gray-800/50">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
              aria-label="Back"
            >
              <FaArrowLeft size={18} />
              <span className="font-medium text-sm">Back</span>
            </button>
          </div>
        </div>

        {/* Main Content - Clean Layout */}
        <div className="max-w-3xl mx-auto px-4 pb-12">
          {activeTab === "overview" && (
            <>
              {/* Flyer & Title */}
              <div className="mb-8">
                <img
                  src={
                    resolveFlyerUrl(
                      event.flyerUrl || event.flyer_url || event.image,
                    ) ||
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='500'%3E%3Crect fill='%23111111' width='1200' height='500'/%3E%3C/svg%3E"
                  }
                  alt={event.title}
                  onError={(e) =>
                    (e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='500'%3E%3Crect fill='%23111111' width='1200' height='500'/%3E%3C/svg%3E")
                  }
                  className="w-full h-48 object-cover rounded-lg mb-6"
                />
                <div className="space-y-3 mb-6">
                  <h1 className="text-4xl font-bold tracking-tight">
                    {event.title}
                  </h1>
                  {event.ageLimit && (
                    <span className="inline-block bg-gray-900 px-3 py-1 rounded text-xs font-medium text-gray-300 border border-gray-800">
                      {event.ageLimit}+
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation Tabs - Below Age Limit */}
              <div className="flex gap-6 mb-8 border-b border-gray-800/50">
                <button
                  className={`pb-3 font-medium text-sm transition-colors duration-200 ${activeTab === "overview" ? "text-red-400 border-b-2 border-red-400" : "text-gray-400 hover:text-gray-300"}`}
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </button>
                <button
                  className={`pb-3 font-medium text-sm transition-colors duration-200 ${activeTab === "info" ? "text-red-400 border-b-2 border-red-400" : "text-gray-400 hover:text-gray-300"}`}
                  onClick={() => setActiveTab("info")}
                >
                  Info
                </button>
              </div>

              {/* Info Row - Clean, readable */}
              <div className="space-y-3 mb-8 text-sm text-gray-400 pb-8 border-b border-gray-800/50">
                <div className="flex items-center gap-3">
                  <FaCalendarAlt size={16} className="text-gray-500 shrink-0" />
                  <span>
                    {formatDate(event.eventDateTime)} at{" "}
                    {formatTime(event.eventDateTime)}
                  </span>
                </div>
                {event.eventEndDate && (
                  <div className="flex items-center gap-3">
                    <FaClock size={16} className="text-gray-500 shrink-0" />
                    <span>
                      Ends {formatDate(event.eventEndDate)}{" "}
                      {formatTime(event.eventEndDate)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt
                    size={16}
                    className="text-gray-500 shrink-0"
                  />
                  <span>
                    {event.venueName}, {event.city}, {event.country}
                  </span>
                </div>
                {event.capacity && (
                  <div className="flex items-center gap-3">
                    <FaUsers size={16} className="text-gray-500 shrink-0" />
                    <span>Capacity: {event.capacity}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-8">
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              {/* Tickets Section - Clean and Minimal */}
              <div className="space-y-4 bg-[#1e1e1e] rounded-lg p-4 text-sm">
                <h2 className="text-sm font-medium tracking-wide uppercase text-gray-200">
                  Get Tickets
                </h2>
                {(event.ticketTiers && event.ticketTiers.length > 0) ||
                (event.tickets && event.tickets.length > 0) ? (
                  <div className="space-y-3 mb-6">
                    {(event.ticketTiers && event.ticketTiers.length > 0
                      ? event.ticketTiers
                      : event.tickets
                    ).map((tier, idx) => {
                      // Support both id and _id, name and ticketType
                      const tierId = tier.id || tier._id || idx;
                      const tierName =
                        tier.name || tier.ticketType || tier.type || "Ticket";
                      const selectedQty = selectedTickets[tierId] || 0;
                      const availableQty =
                        (tier.quantity || 0) - (tier.quantitySold || 0);
                      const availability = isTicketAvailable(tier);
                      const timeLeft =
                        availability.available && tier.saleEnd
                          ? getTimeUntilEnd(tier.saleEnd)
                          : null;

                      return (
                        <div
                          key={tierId}
                          className={`border-b border-gray-800 rounded-lg p-4 transition-all duration-200 ${
                            !availability.available
                              ? "opacity-50 bg-gray-900/50"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white mb-1 tracking-wide">
                                {tierName}
                              </div>
                              {availability.available ? (
                                <p className="text-xs text-gray-500">
                                  {availableQty} available
                                </p>
                              ) : availability.reason === "notStarted" ? (
                                <p className="text-xs text-yellow-500">
                                  Sales start{" "}
                                  {new Date(
                                    availability.startsAt,
                                  ).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              ) : (
                                <p className="text-xs text-red-500">
                                  Sales ended
                                </p>
                              )}
                            </div>
                            <span className="text-base font-medium text-gray-300 font-mono">
                              {currencySymbol}
                              {tier.price?.toLocaleString
                                ? tier.price.toLocaleString()
                                : tier.price}
                            </span>
                          </div>
                          {timeLeft && (
                            <div className="mb-2 bg-red-900/30 border border-red-800/50 rounded px-3 py-2 flex items-center gap-2">
                              <FaHourglass className="text-red-500 text-xs" />
                              <span className="text-xs text-red-400 font-medium">
                                Ends in {timeLeft.hours}h {timeLeft.minutes}m{" "}
                                {timeLeft.seconds}s
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  tierId,
                                  Math.max(0, selectedQty - 1),
                                )
                              }
                              disabled={
                                selectedQty === 0 || !availability.available
                              }
                              className="bg-gray-900 w-7 h-7 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
                            >
                              −
                            </button>
                            <span className="w-6 text-center font-medium text-white font-mono">
                              {selectedQty}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  tierId,
                                  Math.min(availableQty, selectedQty + 1),
                                )
                              }
                              disabled={
                                selectedQty >= availableQty ||
                                !availability.available
                              }
                              className="bg-gray-900 w-7 h-7 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
                            >
                              +
                            </button>
                            {selectedQty > 0 && (
                              <span className="ml-auto text-sm font-medium text-gray-300 font-mono">
                                {currencySymbol}
                                {getTotalPrice({
                                  ...tier,
                                  id: tierId,
                                }).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-center text-gray-400">
                    <p>No tickets available</p>
                  </div>
                )}

                {/* Buy Button */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                  <div className="text-sm">
                    <span className="text-gray-400">Total: </span>
                    <span className="text-base font-medium text-gray-200">
                      <span className="font-mono">
                        {getTotalSelectedTickets()}
                      </span>{" "}
                      {getTotalSelectedTickets() === 1 ? "Ticket" : "Tickets"}
                    </span>
                    {getTotalSelectedTickets() > 0 && (
                      <div className="mt-2 space-y-1 text-xs text-gray-400">
                        <div className="flex items-center justify-between gap-6">
                          <span>Subtotal</span>
                          <span className="text-gray-300 font-mono">
                            {currencySymbol}
                            {subtotalAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                          <span>Service fee (10%)</span>
                          <span className="text-gray-300 font-mono">
                            {currencySymbol}
                            {serviceFeeAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                          <span className="text-gray-300">Total</span>
                          <span className="text-gray-200 font-mono">
                            {currencySymbol}
                            {totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (typeof onBuyTickets === "function") {
                        onBuyTickets(selectedTickets);
                      }
                    }}
                    disabled={getTotalSelectedTickets() === 0}
                    className="bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 text-sm"
                  >
                    {getTotalSelectedTickets() > 0
                      ? `Buy ${getTotalSelectedTickets()} Ticket${getTotalSelectedTickets() !== 1 ? "s" : ""}`
                      : "Select Tickets"}
                  </button>
                </div>

              </div>

              {/* Night With Us Video */}
              {organizer && nightWithUsVideoUrl && (
                <div className="w-full mt-5 flex justify-center">
                  <div className="w-full max-w-md overflow-hidden">
                    <div className="px-4 pt-4 pb-2 text-center">
                      <h3 className="text-sm font-light text-gray-300 tracking-wide">
                        Night with Us
                      </h3>
                    </div>

                    <video
                      src={nightWithUsVideoUrl}
                      className="w-full aspect-video object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "info" && (
            <div className="space-y-8">
              {/* Recently Purchased */}
              {event.attendees && event.attendees.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">
                    Recently Purchased ({event.attendees.length})
                  </h2>
                  <div className="flex flex-wrap gap-6">
                    {event.attendees.map((attendee) => (
                      <button
                        key={attendee.id}
                        onClick={() => navigate(`/user/${attendee.id}`)}
                        className="flex flex-col items-center gap-2 group hover:opacity-70 transition-opacity duration-200"
                        title={`${attendee.firstName} ${attendee.lastName}`}
                      >
                        <div className="relative">
                          {attendee.profilePicture ? (
                            <img
                              src={resolveFlyerUrl(attendee.profilePicture)}
                              alt={`${attendee.firstName} ${attendee.lastName}`}
                              className="w-12 h-12 rounded-full object-cover"
                              onError={(e) =>
                                (e.target.style.display = "none") ||
                                (e.target.nextElementSibling &&
                                  (e.target.nextElementSibling.style.display =
                                    "flex"))
                              }
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium text-sm">
                              {attendee.firstName?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-center text-gray-400 max-w-16 truncate">
                          {attendee.firstName}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Organizer Profile */}
              {organizer && (
                <div className="space-y-4 pb-8">
                  <h2 className="text-lg font-semibold">Organizer</h2>
                  <div
                    className="border border-gray-800 rounded-lg p-4 bg-gray-950 hover:border-gray-700 transition-colors duration-200 cursor-pointer"
                    onClick={() => navigate(`/organizer/${organizer.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      {organizer.profilePicture ? (
                        <img
                          src={resolveFlyerUrl(organizer.profilePicture)}
                          alt={organizer.name}
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold text-lg">
                          {organizer.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-white mb-1">
                          {organizer.name}
                        </h3>
                        {organizer.email && (
                          <p className="text-xs text-gray-400 mb-1 truncate">
                            {organizer.email}
                          </p>
                        )}
                        {organizer.phone && (
                          <p className="text-xs text-gray-400">
                            {organizer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
