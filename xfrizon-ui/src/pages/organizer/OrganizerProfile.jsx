import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import OrganizerProfileHeader from "../../component/organizer/OrganizerProfileHeader";
import EventCard from "../../feature/events/EventCard";
import HeroSlideshow from "../../component/HeroSlideshow/HeroSlideshow";
import { FaGlobe, FaInstagram, FaTwitter } from "react-icons/fa";
import { FiMail, FiMapPin } from "react-icons/fi";

const OrganizerProfile = () => {
  const navigate = useNavigate();
  const { organizerId, id, userId } = useParams();
  const { organizer: currentUser, loading: authLoading } =
    useContext(AuthContext);
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [blogHeadlineSlideshow, setBlogHeadlineSlideshow] = useState([]);
  const [profileImageError, setProfileImageError] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Use any of the available params (organizerId from /organizer/profile/:organizerId, id from /organizer/:id, or userId from redirect)
  const profileId = organizerId || id || userId;

  const resolveCoverMedia = (userLike) => {
    const storageKey = userLike?.id
      ? `organizerCoverMedia:${userLike.id}`
      : null;
    return (
      userLike?.coverMedia ||
      (storageKey ? localStorage.getItem(storageKey) : null)
    );
  };

  useEffect(() => {
    fetchOrganizerProfile();
    setProfileImageError(false);
  }, [profileId, currentUser?.id, currentUser?.coverMedia]);

  useEffect(() => {
    if (organizer?.id) {
      fetchOrganizerEvents(organizer.id);
    }
  }, [organizer?.id]);

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

  const fetchOrganizerProfile = async () => {
    try {
      setLoading(true);
      setProfileImageError(false);
      // Fetch specific organizer by ID
      if (profileId) {
        const response = await api.get(`/auth/users/${profileId}`);
        let organizerDetails = {};

        try {
          const organizerRes = await api.get(`/organizers/${profileId}`);
          organizerDetails = organizerRes?.data?.data || organizerRes?.data || {};
        } catch {
          organizerDetails = {};
        }

        // Verify it's actually an organizer
        if (response.data.role !== "ORGANIZER") {
          navigate("/", { replace: true });
          return;
        }

        const mergedData = {
          ...response.data,
          ...organizerDetails,
        };

        const normalizedData = {
          ...mergedData,
          logo: mergedData.logo || mergedData.profilePicture,
          profilePicture: mergedData.profilePicture || mergedData.logo,
          coverPhoto: mergedData.coverPhoto,
          coverMedia: resolveCoverMedia(mergedData),
          name: mergedData.name || mergedData.firstName || "",
        };
        setOrganizer(normalizedData);
      } else if (currentUser && currentUser?.role === "ORGANIZER") {
        // Fetch fresh data for own profile to ensure cover media is updated
        try {
          const response = await api.get(`/auth/users/${currentUser.id}`);
          let organizerDetails = {};

          try {
            const organizerRes = await api.get(`/organizers/${currentUser.id}`);
            organizerDetails = organizerRes?.data?.data || organizerRes?.data || {};
          } catch {
            organizerDetails = {};
          }

          const mergedData = {
            ...response.data,
            ...organizerDetails,
          };

          const normalizedData = {
            ...mergedData,
            logo: mergedData.logo || mergedData.profilePicture,
            profilePicture: mergedData.profilePicture || mergedData.logo,
            coverPhoto: mergedData.coverPhoto,
            coverMedia: resolveCoverMedia(mergedData),
            name: mergedData.name || mergedData.firstName || "",
          };
          setOrganizer(normalizedData);
        } catch (fetchError) {
          // Fallback to context if fetch fails
          setOrganizer(currentUser);
        }
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

  const firstNonEmpty = (...values) => {
    for (const value of values) {
      if (value === null || value === undefined) continue;
      const trimmed = String(value).trim();
      if (trimmed) return trimmed;
    }
    return "";
  };

  const normalizeUrl = (value) => {
    const trimmed = firstNonEmpty(value);
    if (!trimmed) return null;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed.replace(/^\/+/, "")}`;
  };

  const organizerProfile =
    organizer?.profile || organizer?.organizerProfile || organizer?.details || {};
  const instagramLink = normalizeUrl(
    firstNonEmpty(
      organizer?.instagram,
      organizer?.instagramUrl,
      organizerProfile?.instagram,
      organizerProfile?.instagramUrl,
      organizer?.socialInstagram,
      organizerProfile?.socialInstagram,
    ),
  );
  const websiteLink = normalizeUrl(
    firstNonEmpty(
      organizer?.website,
      organizer?.url,
      organizer?.webUrl,
      organizer?.link,
      organizerProfile?.website,
      organizerProfile?.url,
      organizerProfile?.webUrl,
      organizerProfile?.link,
    ),
  );
  const emailValue = firstNonEmpty(organizer?.email, organizerProfile?.email);
  const emailLink = emailValue ? `mailto:${emailValue}` : null;
  const galleryItems = (() => {
    const rawMedia = organizer?.media;
    let parsedMedia = [];

    try {
      if (Array.isArray(rawMedia)) {
        parsedMedia = rawMedia;
      } else if (typeof rawMedia === "string" && rawMedia.trim()) {
        parsedMedia = JSON.parse(rawMedia);
      }
    } catch {
      parsedMedia = [];
    }

    return (Array.isArray(parsedMedia) ? parsedMedia : [])
      .filter((item) => item && item.url)
      .map((item, idx) => ({
        id: item.id || `gallery-${idx}`,
        url: getImageUrl(item.url) || item.url,
        type: item.type ||
          (String(item.url).toLowerCase().match(/\.(mp4|webm|ogg|mov|m4v)(\?|$)/)
            ? "video"
            : "image"),
      }));
  })();

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
    <div className="bg-black text-white min-h-screen pt-4 sm:pt-6">
      {/* Profile Header */}
      <OrganizerProfileHeader
        key={organizer?.id}
        organizer={organizer}
        isOwnProfile={isOwnProfile}
        profilePictureUrl={profilePictureUrl}
        profileImageError={profileImageError}
        setProfileImageError={setProfileImageError}
        coverImageUrl={coverImageUrl}
        belowCoverContent={
          <div className="flex justify-center gap-1.5 sm:gap-4 pt-4 sm:pt-6 pb-1 sm:pb-2">
            <button
              className={`pb-1 sm:pb-2 font-bold text-[9px] sm:text-xs transition-colors duration-200 antialiased uppercase tracking-wide ${
                activeTab === "overview"
                  ? "text-gray-200 border-b border-red-400 sm:border-b-2"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`pb-1 sm:pb-2 font-bold text-[9px] sm:text-xs transition-colors duration-200 antialiased uppercase tracking-wide ${
                activeTab === "upcoming"
                  ? "text-gray-200 border-b border-red-400 sm:border-b-2"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming Events
            </button>
            <button
              className={`pb-1 sm:pb-2 font-bold text-[9px] sm:text-xs transition-colors duration-200 antialiased uppercase tracking-wide ${
                activeTab === "past"
                  ? "text-gray-200 border-b border-red-400 sm:border-b-2"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("past")}
            >
              Past Events
            </button>
          </div>
        }
      />

      {/* About Org Block */}
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full max-w-4xl mx-auto">
          <h3 className="text-sm font-medium tracking-wide uppercase text-gray-200 mb-3 text-center">
            About Org
          </h3>
          <div className="rounded-lg p-4 sm:p-5 text-center">
            <div className="mb-4 flex justify-center">
              {!profileImageError && profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={organizer?.name || "Organizer"}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover bg-black shadow-2xl"
                  onError={() => setProfileImageError(true)}
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold tracking-tight shadow-2xl">
                  {(organizer?.name || organizer?.organizerName || "O")[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-white">
              {organizer?.name || organizer?.organizerName || "Organizer"}
            </p>
            <div className="mt-1 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-light tracking-[0.02em] text-gray-200/90">
              {(organizer?.location || organizer?.city || organizer?.country) && (
                <span>
                  {organizer?.location || [organizer?.city, organizer?.country].filter(Boolean).join(", ")}
                </span>
              )}
              {(organizer?.location || organizer?.city || organizer?.country) && organizer?.createdAt && (
                <span className="text-gray-500">|</span>
              )}
              {organizer?.createdAt && (
                <span>
                  Joined {new Date(organizer.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })}
                </span>
              )}
              {((organizer?.location || organizer?.city || organizer?.country) || organizer?.createdAt) &&
                (instagramLink || websiteLink || emailLink) && (
                  <span className="text-gray-500">|</span>
                )}
              <div className="flex items-center gap-2">
                {instagramLink && (
                  <a
                    href={instagramLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="text-gray-200 hover:text-white transition-colors"
                  >
                    <FaInstagram size={14} />
                  </a>
                )}
                {websiteLink && (
                  <a
                    href={websiteLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Website"
                    className="text-gray-200 hover:text-white transition-colors"
                  >
                    <FaGlobe size={14} />
                  </a>
                )}
                {emailLink && (
                  <a
                    href={emailLink}
                    aria-label="Email"
                    className="text-gray-200 hover:text-white transition-colors"
                  >
                    <FiMail size={14} />
                  </a>
                )}
              </div>
              {(instagramLink || websiteLink || emailLink) &&
                organizer?.address && <span className="text-gray-500">|</span>}
              {organizer?.address && <span>{organizer.address}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Event Block */}
      <div className="px-4 sm:px-6 pt-3 pb-12">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Featured Upcoming Events */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Featured Events</h3>
              {upcomingEvents.length > 0 ? (
                <div className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar">
                  {upcomingEvents.slice(0, 4).map((event) => (
                    <div key={event.id} className="shrink-0 w-68 sm:w-72">
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No featured events yet.</p>
              )}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setActiveTab("upcoming")}
                  className="text-xs text-red-500 hover:text-red-400 underline underline-offset-2 transition-colors"
                >
                  more event
                </button>
              </div>
              {blogHeadlineSlideshow.length > 0 && (
                <div className="w-full max-w-lg mx-auto mt-8">
                  <h3 className="text-sm font-medium tracking-wide uppercase text-gray-200 mb-3 text-center">
                    Headline
                  </h3>
                  <div className="overflow-hidden">
                    <HeroSlideshow items={blogHeadlineSlideshow} />
                  </div>
                </div>
              )}

              <div className="w-full max-w-4xl mx-auto mt-8">
                <h3 className="text-sm font-medium tracking-wide uppercase text-gray-200 mb-3 text-center">
                  Gallery
                </h3>
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 hide-scrollbar">
                  {galleryItems.length > 0 ? (
                    galleryItems.map((item) => (
                      <div
                        key={item.id}
                        className="shrink-0 w-48 sm:w-60 h-28 sm:h-32 rounded-lg border border-zinc-800 bg-zinc-900/70 overflow-hidden"
                      >
                        {item.type === "video" ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            muted
                            controls
                            playsInline
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt="Organizer gallery"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No gallery media yet.</p>
                  )}
                </div>
              </div>

              <div className="w-full max-w-4xl mx-auto mt-8">
                <h3 className="text-sm font-medium tracking-wide uppercase text-gray-200 mb-3 text-center">
                  About Org
                </h3>
                <div className="rounded-lg p-4 sm:p-5 text-center">
                  <div className="mb-4 flex justify-center">
                    {!profileImageError && profilePictureUrl ? (
                      <img
                        src={profilePictureUrl}
                        alt={organizer?.name || "Organizer"}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover bg-black shadow-2xl"
                        onError={() => setProfileImageError(true)}
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold tracking-tight shadow-2xl">
                        {(organizer?.name || organizer?.organizerName || "O")[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-white">
                    {organizer?.name || organizer?.organizerName || "Organizer"}
                  </p>
                  <div className="mt-1 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-light tracking-[0.02em] text-gray-200/90">
                    {(organizer?.location || organizer?.city || organizer?.country) && (
                      <span>
                        {organizer?.location || [organizer?.city, organizer?.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {(organizer?.location || organizer?.city || organizer?.country) && organizer?.createdAt && (
                      <span className="text-gray-500">|</span>
                    )}
                    {organizer?.createdAt && (
                      <span>
                        Joined {new Date(organizer.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                    {((organizer?.location || organizer?.city || organizer?.country) || organizer?.createdAt) &&
                      (instagramLink || websiteLink || emailLink) && (
                        <span className="text-gray-500">|</span>
                      )}
                    <div className="flex items-center gap-2">
                      {instagramLink && (
                        <a
                          href={instagramLink}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Instagram"
                          className="text-gray-200 hover:text-white transition-colors"
                        >
                          <FaInstagram size={14} />
                        </a>
                      )}
                      {websiteLink && (
                        <a
                          href={websiteLink}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Website"
                          className="text-gray-200 hover:text-white transition-colors"
                        >
                          <FaGlobe size={14} />
                        </a>
                      )}
                      {emailLink && (
                        <a
                          href={emailLink}
                          aria-label="Email"
                          className="text-gray-200 hover:text-white transition-colors"
                        >
                          <FiMail size={14} />
                        </a>
                      )}
                    </div>
                    {(instagramLink || websiteLink || emailLink) &&
                      organizer?.address && <span className="text-gray-500">|</span>}
                    {organizer?.address && <span>{organizer.address}</span>}
                  </div>
                  <p className="mt-3 max-w-2xl mx-auto max-h-35 overflow-y-auto hide-scrollbar text-left text-sm text-gray-300 leading-relaxed">
                    {organizer?.about ||
                      organizer?.bio ||
                      organizer?.description ||
                      "Organizer profile details will appear here."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Events Tab */}
        {activeTab === "upcoming" && (
          <div className="space-y-6">
            {upcomingEvents.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <p className="text-gray-400">No upcoming events</p>
              </div>
            ) : (
              <div className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="shrink-0 w-68 sm:w-72">
                    <EventCard event={event} />
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
              <div className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar">
                {pastEvents.map((event) => (
                  <div key={event.id} className="shrink-0 w-68 sm:w-72">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerProfile;
