import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaHeart } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import EventCard from "../../feature/events/EventCard";

export default function SavedEventsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { organizer: currentUser } = useContext(AuthContext);
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedEvents();
  }, []);

  const fetchSavedEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/user/saved");
      setSavedEvents(response.data || []);
    } catch (error) {
      console.error("Failed to fetch saved events:", error);
      toast.error("Failed to load saved events");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChange = (eventId, isSaved) => {
    if (!isSaved) {
      // Remove event from list
      setSavedEvents(savedEvents.filter((e) => e.id !== eventId));
    } else {
      // Refresh the list
      fetchSavedEvents();
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Please log in to view saved events
          </p>
          <button
            onClick={() =>
              navigate("/auth/login", {
                replace: true,
                state: { from: location },
              })
            }
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
          >
            <FaArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-xl font-light flex items-center gap-2">
            <FaHeart className="text-red-500" />
            Saved Events
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-400">Loading saved events...</p>
          </div>
        ) : savedEvents.length > 0 ? (
          <div>
            <p className="text-gray-400 mb-6">
              You have {savedEvents.length} saved event
              {savedEvents.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSaveChange={handleSaveChange}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <FaHeart className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">No saved events yet</p>
            <p className="text-gray-500 mb-6">
              Click the heart icon on any event to save it for later
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Explore Events
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
