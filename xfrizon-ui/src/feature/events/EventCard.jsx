import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaHeart,
} from "react-icons/fa";
import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%233f3f46' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='%23a1a1a1' text-anchor='middle' dominant-baseline='middle'%3EEvent Image%3C/text%3E%3C/svg%3E";

const resolveFlyerUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  // Ensure path starts with /
  const normalized = path.startsWith("/") ? path : `/${path}`;
  
  // In production, use relative paths; in dev, prepend API base
  if (import.meta.env.PROD) {
    return normalized;
  }
  
  // Development: prepend localhost
  if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
    return `http://localhost:8081${normalized}`;
  }
  return `http://localhost:8081/api/v1${normalized}`;
};

export default function EventCard({ event, onSaveChange }) {
  const navigate = useNavigate();
  const { organizer: currentUser } = useContext(AuthContext);
  const [imageError, setImageError] = useState(false);
  const [isSaved, setIsSaved] = useState(
    event.attendees?.some((u) => u.id === currentUser?.id) || false,
  );
  const [saving, setSaving] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(event);

  // Sync currentEvent with event prop when it changes
  useEffect(() => {
    console.log(
      `EventCard ${event.id} - Syncing event state, attendees:`,
      event.attendees?.length,
      "currentUser:",
      currentUser?.id,
    );
    setCurrentEvent(event);
    const newSavedState =
      event.attendees?.some((u) => u.id === currentUser?.id) || false;
    console.log(`EventCard ${event.id} - Setting isSaved to:`, newSavedState);
    setIsSaved(newSavedState);
  }, [event, currentUser?.id]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking on a link or button
    if (e.target.closest("a") || e.target.closest("button")) {
      return;
    }
    // Don't navigate if event is in the past
    if (isPastEvent()) {
      return;
    }
    navigate(`/event/${event.id}`);
  };

  const handleSaveToggle = async (e) => {
    e.stopPropagation();

    if (isPastEvent()) {
      toast.info("Cannot save past events");
      return;
    }

    if (!currentUser) {
      toast.error("Please log in to save events");
      return;
    }

    setSaving(true);
    const wasJustSaved = isSaved;

    try {
      if (isSaved) {
        // Unsave event
        console.log(`Unsaving event ${event.id} for user ${currentUser.id}`);
        await api.delete(`/events/${event.id}/save`);
        setIsSaved(false);
        toast.success("Event removed from saved");
      } else {
        // Save event
        console.log(`Saving event ${event.id} for user ${currentUser.id}`);
        await api.post(`/events/${event.id}/save`);
        setIsSaved(true);
        toast.success("Event saved!");
      }

      // Always trigger refetch on parent to update all cards
      console.log(`Calling onSaveChange for event ${event.id}`);
      if (onSaveChange) {
        onSaveChange(event.id, !wasJustSaved);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(error.response?.data?.message || "Failed to save event");
      // Revert state on error
      setIsSaved(wasJustSaved);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeRange = () => {
    const startTime = formatTime(event.eventDateTime);
    if (!event.eventEndDate) return startTime;

    const endTime = formatTime(event.eventEndDate);
    return endTime && endTime.trim() ? `${startTime} - ${endTime}` : startTime;
  };

  const isPastEvent = () => {
    if (!event.eventDateTime) return false;
    return new Date(event.eventDateTime) < new Date();
  };

  const getTotalAvailableTickets = () => {
    if (!event.ticketTiers || event.ticketTiers.length === 0) return 0;
    return event.ticketTiers.reduce((total, tier) => {
      const remaining = tier.quantity - (tier.sold || 0);
      return total + Math.max(0, remaining);
    }, 0);
  };

  const allTicketsSoldOut = () => {
    return getTotalAvailableTickets() === 0;
  };

  return (
    <div
      onClick={handleCardClick}
      className={`block ${isPastEvent() ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div
        className={`shadow-[0_8px_22px_rgba(0,0,0,0.45),0_0_14px_rgba(236,72,153,0.22),0_0_24px_rgba(34,211,238,0.18)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.5),0_0_20px_rgba(236,72,153,0.35),0_0_34px_rgba(34,211,238,0.28)] transition-all duration-300 flex flex-col justify-between group h-full ${isPastEvent() ? "opacity-50" : ""}`}
      >
        {/* Event Image with Save Button - Using Image as Hover Trigger */}
        <div className="relative overflow-hidden h-48 border border-zinc-800">
          <img
            src={
              imageError
                ? PLACEHOLDER_IMAGE
                : resolveFlyerUrl(
                    event.flyerUrl || event.flyer_url || event.image,
                  ) || PLACEHOLDER_IMAGE
            }
            onError={handleImageError}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Dark Overlay on Group Hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            {/* Save Button */}
            {!isPastEvent() && (
              <button
                onClick={handleSaveToggle}
                disabled={saving}
                className="p-3 rounded-full bg-black/80 hover:bg-black/95 transition-all duration-200 transform hover:scale-110"
                title={isSaved ? "Unsave event" : "Save event"}
              >
                <FaHeart
                  size={20}
                  className={`transition-colors duration-200 ${
                    isSaved
                      ? "text-red-500 fill-red-500"
                      : "text-white fill-white"
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {/* Title + Organizer */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-light text-gray-300 group-hover:text-red-500 transition-colors duration-300 truncate flex-1">
              {event.title}
            </h3>

            {/* Organizer Logo/Badge */}
            {event.organizer ? (
              event.organizer.logo ? (
                <Link
                  to={`/organizer/${event.organizer.id}`}
                  onClick={(e) => e.stopPropagation()}
                  title={`View ${event.organizer.name}'s events`}
                  className="hover:opacity-80 transition-opacity shrink-0"
                >
                  <img
                    src={resolveFlyerUrl(event.organizer.logo)}
                    alt={event.organizer.name}
                    className="w-8 h-8 rounded-full object-cover shadow-sm"
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextElementSibling) {
                        e.target.nextElementSibling.style.display = "flex";
                      }
                    }}
                  />
                  <div
                    className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold transition-colors"
                    style={{ display: "none" }}
                  >
                    {event.organizer.name?.charAt(0)?.toUpperCase()}
                  </div>
                </Link>
              ) : (
                <Link
                  to={`/organizer/${event.organizer.id}`}
                  onClick={(e) => e.stopPropagation()}
                  title={`View ${event.organizer.name}'s events`}
                  className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold transition-colors hover:opacity-90 shrink-0 shadow-sm"
                >
                  {event.organizer.name?.charAt(0)?.toUpperCase()}
                </Link>
              )
            ) : (
              <div
                className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0"
                title="Organizer info not available"
              >
                ?
              </div>
            )}
          </div>

          {/* Genre Tags */}
          {event.genres && event.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.genres.map((genre, index) => {
                const nightClubTextColors = [
                  "text-fuchsia-300",
                  "text-cyan-300",
                  "text-violet-300",
                  "text-emerald-300",
                  "text-pink-300",
                ];
                const tagTextColor =
                  nightClubTextColors[index % nightClubTextColors.length];

                return (
                  <span
                    key={genre}
                    className={`inline-block px-2 py-1 bg-red-500/10 border border-red-500/20 ${tagTextColor} text-xs rounded hover:bg-red-500/20 transition-all duration-300 font-light`}
                  >
                    {genre}
                  </span>
                );
              })}
            </div>
          )}

          {/* Date and Time */}
          <div className="flex flex-col gap-1 text-xs text-gray-400 font-light">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="shrink-0" />
              <span>{formatDate(event.eventDateTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="shrink-0" />
              <span>{getTimeRange()}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-400 line-clamp-2 font-light">
            {event.description}
          </p>

          {/* Location */}
          <div className="flex items-center gap-2 text-xs text-gray-500 font-light">
            <FaMapMarkerAlt />
            <span>
              {event.city && event.country
                ? `${event.city}, ${event.country}`
                : event.city || event.country || "Location TBA"}
            </span>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 mt-auto gap-3">
            {/* Ticket Status or Interested Count */}
            {allTicketsSoldOut() ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="px-3 py-1 bg-gray-600 text-gray-300 text-xs font-semibold rounded-full whitespace-nowrap">
                  SOLD OUT
                </span>
              </div>
            ) : (
              <>
                {/* Interested Count + User Avatars */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Interested Count */}
                  <span className="text-xs text-red-500 font-light whitespace-nowrap shrink-0">
                    {currentEvent.attendees?.length || 0} Interested
                  </span>

                  {/* User Avatars or Message */}
                  {currentEvent.attendees &&
                  currentEvent.attendees.length > 0 ? (
                    <div className="flex items-center -space-x-2">
                      {currentEvent.attendees.slice(0, 3).map((user) => {
                        console.log(
                          `Rendering attendee for event ${currentEvent.id}:`,
                          user,
                        );
                        return (
                          <div
                            key={user.id}
                            title={
                              `${user.firstName} ${user.lastName}` || "User"
                            }
                            className="w-6 h-6 rounded-full object-cover bg-zinc-800 shrink-0"
                          >
                            {user.profilePicture ? (
                              <img
                                src={resolveFlyerUrl(user.profilePicture)}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  if (e.target.nextElementSibling) {
                                    e.target.nextElementSibling.style.display =
                                      "flex";
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                              style={{
                                display: user.profilePicture ? "none" : "flex",
                              }}
                            >
                              {`${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase()}
                            </div>
                          </div>
                        );
                      })}
                      {currentEvent.attendees.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-gray-300 font-light shrink-0">
                          +{currentEvent.attendees.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 font-light italic">
                      No one yet
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
