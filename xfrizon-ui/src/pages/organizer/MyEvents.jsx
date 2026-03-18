import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaArrowRight,
  FaCheck,
  FaTrash,
  FaEdit,
  FaCopy,
} from "react-icons/fa";

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState({});
  const [duplicating, setDuplicating] = useState({});

  // Helper function to construct image URLs
  const getImageUrl = (path) => {
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

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        console.warn("No authentication token found");
        toast.error("Session expired. Please login again.");
        setLoading(false);
        return;
      }

      console.log(
        "Fetching events with token:",
        token.substring(0, 10) + "...",
      );
      const response = await api.get("/events?page=0&size=20");
      setEvents(response.data.content || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);

      const errorMsg =
        error.response?.status === 302
          ? "Server communication error"
          : error.response?.data?.message ||
            error.message ||
            "Failed to fetch events";

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (eventId) => {
    if (!eventId) {
      toast.error("Event ID is missing");
      return;
    }

    setPublishing({ ...publishing, [eventId]: true });
    try {
      const response = await api.post(`/events/${eventId}/publish`);
      toast.success("✨ Event published successfully!");

      // Update the event in the list
      setEvents(
        events.map((e) =>
          e.id === eventId ? { ...e, status: "PUBLISHED" } : e,
        ),
      );
    } catch (error) {
      console.error("Publish error:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to publish event";

      // Check if error is about payout configuration
      if (
        errorMsg.includes("PAYOUT_NOT_CONFIGURED") ||
        errorMsg.includes("payout method")
      ) {
        toast.error(
          "⚠️ Payout method required! Please set up your payout method in Finance settings before publishing events.",
          { autoClose: 7000 },
        );
        // Optionally navigate to finance page after a delay
        setTimeout(() => {
          if (
            window.confirm(
              "Would you like to go to Finance settings now to set up payouts?",
            )
          ) {
            window.location.href = "/organizer/finance";
          }
        }, 1000);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setPublishing({ ...publishing, [eventId]: false });
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.delete(`/events/${eventId}`);
        toast.success("Event deleted successfully");
        setEvents(events.filter((e) => e.id !== eventId));
      } catch (error) {
        console.error("Delete error:", error);
        toast.error(error.response?.data?.message || "Failed to delete event");
      }
    }
  };

  const handleDuplicate = async (eventId) => {
    if (!eventId) {
      toast.error("Event ID is missing");
      return;
    }

    setDuplicating((prev) => ({ ...prev, [eventId]: true }));
    try {
      const response = await api.post(`/events/${eventId}/duplicate`);
      const duplicatedEvent = response?.data;

      if (duplicatedEvent?.id) {
        setEvents((prev) => [duplicatedEvent, ...prev]);
      } else {
        await fetchEvents();
      }

      toast.success("Event duplicated successfully");
    } catch (error) {
      console.error("Duplicate error:", error);
      toast.error(error.response?.data?.message || "Failed to duplicate event");
    } finally {
      setDuplicating((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-light text-gray-200 mb-1">
            My Events
          </h1>
          <p className="text-xs text-gray-500 font-light">
            Manage and track all your events
          </p>
        </div>
        <Link
          to="/organizer/create-event"
          className="w-full sm:w-auto px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light text-xs transition-all duration-300 flex items-center justify-center gap-2"
        >
          <FaPlus className="w-3 h-3" />
          Create Event
        </Link>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-xs text-gray-500 font-light mb-3">
            No events created yet
          </p>
          <Link
            to="/organizer/create-event"
            className="inline-block px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light text-xs transition-all duration-300"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-red-500 transition-all duration-300 group"
            >
              {/* Flyer Image */}
              <div className="w-full h-32 bg-linear-to-br from-zinc-800 to-black overflow-hidden">
                {event.flyerUrl || event.flyer_url ? (
                  <img
                    src={getImageUrl(event.flyerUrl || event.flyer_url)}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = "/assets/african-panther-dark.svg";
                    }}
                  />
                ) : (
                  <img
                    src="/assets/african-panther-dark.svg"
                    alt="Event placeholder"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Event Details */}
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-light text-white group-hover:text-red-500 transition-colors flex-1 pr-2 wrap-break-word">
                    {event.title}
                  </h3>
                  <span
                    className={`text-[10px] font-light px-2 py-0.5 rounded-full whitespace-nowrap ${
                      event.status === "PUBLISHED"
                        ? "bg-green-900 text-green-200"
                        : event.status === "DRAFT"
                          ? "bg-yellow-900 text-yellow-200"
                          : event.status === "LIVE"
                            ? "bg-blue-900 text-blue-200"
                            : "bg-gray-900 text-gray-200"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <p className="text-gray-500 font-light text-xs mb-1.5">
                  {event.eventDateTime
                    ? new Date(event.eventDateTime).toLocaleDateString()
                    : event.date || "N/A"}
                </p>
                <p className="text-gray-400 font-light text-xs mb-3 line-clamp-2">
                  {event.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-1.5">
                  <button
                    onClick={() => handleDuplicate(event.id)}
                    disabled={duplicating[event.id]}
                    className="w-full sm:flex-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-purple-300 hover:text-purple-200 disabled:opacity-50 rounded font-light text-xs transition-all duration-300 flex items-center justify-center gap-1.5"
                  >
                    <FaCopy className="w-3 h-3" />
                    {duplicating[event.id] ? "Duplicating..." : "Duplicate"}
                  </button>
                  {event.status === "DRAFT" ? (
                    <>
                      <Link
                        to={`/organizer/edit-event/${event.id}`}
                        className="w-full sm:flex-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-400 hover:text-blue-300 rounded font-light text-xs transition-all duration-300 flex items-center justify-center gap-1.5"
                      >
                        <FaEdit className="w-3 h-3" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handlePublish(event.id)}
                        disabled={publishing[event.id]}
                        className="w-full sm:flex-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-red-400 hover:text-red-300 disabled:opacity-50 rounded font-light text-xs transition-all duration-300 flex items-center justify-center gap-1.5"
                      >
                        <FaCheck className="w-3 h-3" />
                        {publishing[event.id] ? "Publishing..." : "Publish"}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/organizer/edit-event/${event.id}`}
                        className="w-full sm:flex-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-400 hover:text-blue-300 rounded font-light text-xs transition-all duration-300 flex items-center justify-center gap-1.5"
                      >
                        <FaEdit className="w-3 h-3" />
                        Edit
                      </Link>
                      <button className="w-full sm:flex-1 px-3 py-1.5 bg-zinc-800 text-green-400 rounded font-light text-xs cursor-default">
                        ✓ Published
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="w-full sm:w-auto px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-red-400 hover:text-red-300 rounded font-light text-xs transition-all duration-300 flex items-center justify-center gap-1.5"
                  >
                    <FaTrash className="w-3 h-3" />
                    <span className="sm:hidden">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;
