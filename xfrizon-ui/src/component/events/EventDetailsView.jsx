import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaPhone,
  FaEnvelope,
  FaTicketAlt,
  FaMusic,
  FaHourglass,
} from "react-icons/fa";
import { FiCalendar, FiClock, FiMapPin, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CountdownTimer from "./CountdownTimer";
import { COUNTRIES_DATA } from "../../data/countriesData";
import HeroSlideshow from "../HeroSlideshow/HeroSlideshow";
import api from "../../api/axios";

export default function EventDetailsView({ event, organizer, onBuyTickets }) {
  const navigate = useNavigate();
  const [selectedTickets, setSelectedTickets] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [blogHeadlineSlideshow, setBlogHeadlineSlideshow] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchBlogHeadlineSlides = async () => {
      try {
        const response = await api.get("/blog-hero-settings");
        const settings = response?.data || {};
        if (!settings.blogHeroSlideshow) {
          setBlogHeadlineSlideshow([]);
          return;
        }

        const parsed = JSON.parse(settings.blogHeroSlideshow);
        setBlogHeadlineSlideshow(Array.isArray(parsed) ? parsed : []);
      } catch {
        setBlogHeadlineSlideshow([]);
      }
    };

    fetchBlogHeadlineSlides();
  }, []);

  const SERVICE_FEE_RATE = 0.1; // 10%
  const roundCurrency = (amount) =>
    Math.round((Number(amount) + 1e-9) * 100) / 100;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    return `${mm}-${dd}-${yy}`;
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
    const raw =
      organizer?.media || organizer?.mediaGallery || organizer?.gallery;
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
        {/* Hero Flyer Section - Full Width */}
        <section className="relative w-full h-125 bg-black overflow-hidden -mt-20">
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
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/10"></div>
          <div className="absolute inset-0">
            <div className="max-w-5xl mx-auto px-6 h-full flex items-end justify-center pb-8">
              <div className="max-w-3xl text-center">
                <h1
                  className="text-3xl md:text-5xl font-extrabold text-white leading-tight"
                  style={{
                    fontFamily:
                      "'Bebas Neue', 'Oswald', 'Arial Narrow', sans-serif",
                    letterSpacing: "0.01em",
                  }}
                >
                  {event.title}
                </h1>
                <div className="mt-4 space-y-2 text-[11px] font-light tracking-[0.02em] text-gray-200/90">
                  <div className="flex items-center justify-center gap-2">
                    <FiCalendar size={13} className="text-gray-300 shrink-0" />
                    <span>
                      Start {formatDate(event.eventDateTime)}{" "}
                      {formatTime(event.eventDateTime)}
                      {event.eventEndDate
                        ? ` - End ${formatDate(event.eventEndDate)} ${formatTime(event.eventEndDate)}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <FiMapPin size={13} className="text-gray-300 shrink-0" />
                    <span>
                      {event.venueName}, {event.city}, {event.country}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content - Clean Layout */}
        <div className="max-w-3xl mx-auto px-4 pb-28 md:pb-12">
          {/* Navigation Tabs */}
          <div className="flex justify-center gap-5 mb-6 pt-6">
            <button
              className={`pb-2.5 font-medium text-xs transition-colors duration-200 ${activeTab === "overview" ? "text-gray-200 border-b-2 border-red-400" : "text-gray-400 hover:text-gray-300"}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
          </div>

          {activeTab === "overview" && (
            <>
              {/* About Event */}
              {event.description && (
                <div className="w-full max-w-lg mx-auto mb-6 space-y-3">
                  <h2 className="text-sm font-medium tracking-wide uppercase text-gray-200">
                    About Event
                  </h2>
                  <p className="text-[12px] text-gray-400 font-light leading-relaxed max-h-[7.5em] overflow-y-auto hide-scrollbar pr-1">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Tickets Section - Clean and Minimal */}
              <div className="w-full max-w-lg mx-auto mt-12 space-y-2 bg-black/20 border-r border-b border-emerald-500/70 shadow-sm shadow-black/20 p-2.5 text-xs">
                {(event.ticketTiers && event.ticketTiers.length > 0) ||
                (event.tickets && event.tickets.length > 0) ? (
                  <div className="space-y-2 mb-5">
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
                          className={`p-3 transition-all duration-200 ${
                            !availability.available
                              ? "opacity-50 bg-gray-900/50"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-xs font-medium text-white mb-0.5 tracking-wide">
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
                            <span className="text-sm font-medium text-gray-300 font-mono">
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
                              className="bg-gray-900 w-6 h-6 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs"
                            >
                              −
                            </button>
                            <span className="w-5 text-center font-medium text-white font-mono text-xs">
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
                              className="bg-gray-900 w-6 h-6 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs"
                            >
                              +
                            </button>
                            {selectedQty > 0 && (
                              <span className="ml-auto text-xs font-medium text-gray-300 font-mono">
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
                <div className="flex items-center justify-between pt-3">
                  <div className="text-xs">
                    <span className="text-gray-400">Total: </span>
                    <span className="text-sm font-medium text-gray-200">
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
                    className="bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-5 rounded transition-all duration-200 text-xs"
                  >
                    {getTotalSelectedTickets() > 0
                      ? `Buy ${getTotalSelectedTickets()} Ticket${getTotalSelectedTickets() !== 1 ? "s" : ""}`
                      : "Select Tickets"}
                  </button>
                </div>
              </div>

              <div className="w-full max-w-lg mx-auto mt-12">
                <h3 className="text-sm font-medium tracking-wide uppercase text-gray-200 mb-3 text-center">
                  Blog Headline
                </h3>

                <div className="overflow-hidden">
                  <HeroSlideshow items={blogHeadlineSlideshow} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-zinc-800 bg-black/95 backdrop-blur-sm p-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="text-xs text-gray-300">
              <span className="text-gray-400">Selected: </span>
              <span className="font-mono text-gray-100">
                {getTotalSelectedTickets()}
              </span>
              <span className="ml-1">tickets</span>
            </div>
            <button
              onClick={() => {
                if (typeof onBuyTickets === "function") {
                  onBuyTickets(selectedTickets);
                }
              }}
              disabled={getTotalSelectedTickets() === 0}
              className="bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded text-xs"
            >
              {getTotalSelectedTickets() > 0
                ? `Buy ${getTotalSelectedTickets()} Ticket${getTotalSelectedTickets() !== 1 ? "s" : ""}`
                : "Select Tickets"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
