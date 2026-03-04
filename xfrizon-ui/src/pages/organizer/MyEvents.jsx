import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { FaPlus, FaArrowRight, FaCheck, FaTrash, FaEdit } from "react-icons/fa";

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState({});

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-light text-gray-200 mb-2">My Events</h1>
          <p className="text-gray-500 font-light">
            Manage and track all your events
          </p>
        </div>
        <Link
          to="/organizer/create-event"
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light text-sm transition-all duration-300 flex items-center gap-2"
        >
          <FaPlus className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 font-light mb-4">No events created yet</p>
          <Link
            to="/organizer/create-event"
            className="inline-block px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light text-sm transition-all duration-300"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-500 transition-all duration-300 group"
            >
              {/* Flyer Image */}
              <div className="w-full h-40 bg-gradient-to-br from-zinc-800 to-black overflow-hidden">
                {event.flyerUrl || event.flyer_url ? (
                  <img
                    src={getImageUrl(event.flyerUrl || event.flyer_url)}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%231a1a1a' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='%23666' text-anchor='middle' dominant-baseline='middle'%3E" +
                        encodeURIComponent(event.title.substring(0, 30)) +
                        "%3C/text%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900 to-zinc-900">
                    <div className="text-center">
                      <p className="text-gray-400 font-light text-sm">
                        No flyer uploaded
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-light text-white group-hover:text-red-500 transition-colors flex-1">
                    {event.title}
                  </h3>
                  <span
                    className={`text-xs font-light px-3 py-1 rounded-full ${
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
                <p className="text-gray-500 font-light text-sm mb-2">
                  {event.eventDateTime
                    ? new Date(event.eventDateTime).toLocaleDateString()
                    : event.date || "N/A"}
                </p>
                <p className="text-gray-400 font-light text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>
                <div className="flex gap-2">
                  {event.status === "DRAFT" ? (
                    <>
                      <Link
                        to={`/organizer/edit-event/${event.id}`}
                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-light text-sm transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <FaEdit className="w-4 h-4" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handlePublish(event.id)}
                        disabled={publishing[event.id]}
                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-light text-sm transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <FaCheck className="w-4 h-4" />
                        {publishing[event.id] ? "Publishing..." : "Publish"}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/organizer/edit-event/${event.id}`}
                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-light text-sm transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <FaEdit className="w-4 h-4" />
                        Edit
                      </Link>
                      <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-light text-sm cursor-default">
                        ✓ Published
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-red-900 text-red-400 rounded-lg font-light text-sm transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <FaTrash className="w-4 h-4" />
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
