import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import OrganizerProfileHeader from "../../component/organizer/OrganizerProfileHeader";

const OrganizerProfile = () => {
  const navigate = useNavigate();
  const { organizerId, id, userId } = useParams();
  const { organizer: currentUser, loading: authLoading } =
    useContext(AuthContext);
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [profileImageError, setProfileImageError] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Use any of the available params (organizerId from /organizer/profile/:organizerId, id from /organizer/:id, or userId from redirect)
  const profileId = organizerId || id || userId;

  useEffect(() => {
    fetchOrganizerProfile();
    setProfileImageError(false);
  }, [profileId, currentUser?.id]);

  useEffect(() => {
    if (organizer?.id) {
      fetchOrganizerEvents(organizer.id);
    }
  }, [organizer?.id]);

  const fetchOrganizerProfile = async () => {
    try {
      setLoading(true);
      setProfileImageError(false);
      // Fetch specific organizer by ID
      if (profileId) {
        const response = await api.get(`/auth/users/${profileId}`);

        // Verify it's actually an organizer
        if (response.data.role !== "ORGANIZER") {
          navigate("/", { replace: true });
          return;
        }

        const normalizedData = {
          ...response.data,
          logo: response.data.logo || response.data.profilePicture,
          profilePicture: response.data.profilePicture || response.data.logo,
          coverPhoto: response.data.coverPhoto,
          name: response.data.name || response.data.firstName || "",
        };
        setOrganizer(normalizedData);
      } else if (currentUser && currentUser?.role === "ORGANIZER") {
        setOrganizer(currentUser);
      } else if (!authLoading && !currentUser) {
        setOrganizer(null);
      } else if (authLoading) {
        return;
      }
    } catch (error) {
      console.error("Failed to fetch organizer profile:", error);
      if (currentUser?.role === "ORGANIZER") {
        setOrganizer(currentUser);
      } else {
        setOrganizer(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizerEvents = async (organizerId) => {
    try {
      // Try public endpoint first (shows only published events)
      const response = await api.get(
        `/events/public/organizer/${organizerId}?page=0&size=100&sort=eventDateTime,desc`,
      );

      // Handle paginated response
      const events = response.data?.content || response.data || [];
      const eventArray = Array.isArray(events) ? events : [];

      const now = new Date();
      const upcoming = eventArray.filter(
        (event) => event.eventDateTime && new Date(event.eventDateTime) >= now,
      );
      const past = eventArray.filter(
        (event) => event.eventDateTime && new Date(event.eventDateTime) < now,
      );

      setUpcomingEvents(
        upcoming.sort(
          (a, b) => new Date(a.eventDateTime) - new Date(b.eventDateTime),
        ),
      );
      setPastEvents(
        past.sort(
          (a, b) => new Date(b.eventDateTime) - new Date(a.eventDateTime),
        ),
      );
    } catch (error) {
      console.error("Failed to fetch organizer events:", error);
      setUpcomingEvents([]);
      setPastEvents([]);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (!organizer) {
    // If no organizer and auth is still loading, show loading instead of not found
    if (authLoading) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Organizer not found</p>
          <button
            onClick={() => navigate(-1)}
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === organizer.id;
  const profilePictureUrl = getImageUrl(
    organizer?.logo || organizer?.profilePicture,
  );
  const coverImageUrl =
    getImageUrl(organizer?.coverPhoto) ||
    "https://i.pinimg.com/736x/8a/b8/9d/8ab89dc4611d0276369f955c193270af.jpg";

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Profile Header */}
      <OrganizerProfileHeader
        organizer={organizer}
        isOwnProfile={isOwnProfile}
        profilePictureUrl={profilePictureUrl}
        profileImageError={profileImageError}
        setProfileImageError={setProfileImageError}
        coverImageUrl={coverImageUrl}
      />

      {/* Events Sections */}
      <div className="px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex gap-6 mb-8 border-b border-gray-800/50">
            <button
              className={`pb-3 font-medium text-sm transition-colors duration-200 ${
                activeTab === "upcoming"
                  ? "text-xf-accent border-b-2 border-xf-accent"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming Events
            </button>
            <button
              className={`pb-3 font-medium text-sm transition-colors duration-200 ${
                activeTab === "past"
                  ? "text-xf-accent border-b-2 border-xf-accent"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("past")}
            >
              Past Events
            </button>
          </div>

          {/* Upcoming Events Tab */}
          {activeTab === "upcoming" && (
            <div className="space-y-6">
              {upcomingEvents.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                  <p className="text-gray-400">No upcoming events</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="bg-zinc-900 border border-zinc-800 hover:border-xf-accent rounded-xl overflow-hidden transition cursor-pointer group"
                    >
                      {/* Event Flyer */}
                      <div className="relative h-40 overflow-hidden bg-zinc-800">
                        {event.flyerUrl || event.flyer_url ? (
                          <img
                            src={getImageUrl(event.flyerUrl || event.flyer_url)}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ) : event.posterImage ? (
                          <img
                            src={getImageUrl(event.posterImage)}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-900" />
                        )}
                      </div>

                      {/* Event Info */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-white font-semibold text-lg group-hover:text-xf-accent transition truncate">
                          {event.title}
                        </h3>

                        <div className="space-y-2 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt
                              size={14}
                              className="text-xf-accent shrink-0"
                            />
                            <span>{formatDate(event.eventDateTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock
                              size={14}
                              className="text-xf-accent shrink-0"
                            />
                            <span>{formatTime(event.eventDateTime)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt
                                size={14}
                                className="text-xf-accent shrink-0"
                              />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>

                        {/* View Button */}
                        <div className="pt-2 border-t border-zinc-800">
                          <p className="text-xs text-xf-accent font-semibold">
                            Click to view event →
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Past Events Tab */}
          {activeTab === "past" && (
            <div className="space-y-6">
              {pastEvents.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                  <p className="text-gray-400">No past events</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pastEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition opacity-75"
                    >
                      {/* Event Flyer */}
                      <div className="relative h-40 overflow-hidden bg-zinc-800">
                        {event.flyerUrl || event.flyer_url ? (
                          <img
                            src={getImageUrl(event.flyerUrl || event.flyer_url)}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ) : event.posterImage ? (
                          <img
                            src={getImageUrl(event.posterImage)}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-900" />
                        )}
                        {/* Past Event Overlay */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            Past Event
                          </span>
                        </div>
                      </div>

                      {/* Event Info */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-white font-semibold text-lg truncate">
                          {event.title}
                        </h3>

                        <div className="space-y-2 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt
                              size={14}
                              className="text-xf-accent shrink-0"
                            />
                            <span>{formatDate(event.eventDateTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock
                              size={14}
                              className="text-xf-accent shrink-0"
                            />
                            <span>{formatTime(event.eventDateTime)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt
                                size={14}
                                className="text-xf-accent shrink-0"
                              />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerProfile;
