import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSpinner,
} from "react-icons/fa";
import api from "../../api/axios";
import { toast } from "react-toastify";
import EventCard from "../../feature/events/EventCard.jsx";

const OrganizerStorePage = () => {
  const { organizerId } = useParams();
  const navigate = useNavigate();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

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
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchOrganizerEvents();
  }, [organizerId, page]);

  const fetchOrganizerEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch public events by organizer
      const response = await api.get(
        `/events/public/organizer/${organizerId}?page=${page}&size=12&sort=eventDateTime,desc`,
      );

      const { content, totalPages: total, empty } = response.data;

      if (content && content.length > 0) {
        // Extract organizer info from first event
        if (content[0]?.organizer && !organizer) {
          setOrganizer(content[0].organizer);
        }

        setEvents((prev) => (page === 0 ? content : [...prev, ...content]));
        setTotalPages(total);
        setHasMore(!empty && page < total - 1);
      } else if (page === 0) {
        setEvents([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching organizer events:", err);
      if (err.response?.status === 400 || err.response?.status === 404) {
        setError("Organizer not found or has no public events");
      } else {
        setError("Failed to load events");
      }
      toast.error("Failed to load organizer events");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && page === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <FaSpinner className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    );
  }

  if (error && page === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-2">Oops!</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="font-light">Back</span>
        </button>

        {organizer && (
          <div className="flex items-center gap-6">
            {organizer.logo ? (
              <img
                src={getImageUrl(organizer.logo)}
                alt={organizer.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-red-500"
                onError={(e) => (e.target.style.display = "none")}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-4xl border-2 border-red-500">
                {organizer.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-4xl font-light mb-2">{organizer.name}</h1>
              <p className="text-gray-400 font-light mb-3">{organizer.email}</p>
              <p className="text-sm text-gray-500">
                {events.length} {events.length === 1 ? "Event" : "Events"}{" "}
                Available
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Events Grid */}
      <div className="p-6">
        {events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white rounded-lg transition-colors font-light flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Events"
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 font-light mb-4">
              No events available from this organizer yet.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              Browse Other Events
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerStorePage;
