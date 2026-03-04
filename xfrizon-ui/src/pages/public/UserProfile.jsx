import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

// Import components
import ProfileHeader from "../../component/userProfile/ProfileHeader";

export default function UserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);

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
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // Try to fetch from API, fallback to mock data if fails
      try {
        const userResponse = await api.get(`/auth/users/${userId}`);

        // If user is an organizer, redirect to organizer profile
        if (userResponse.data.role === "ORGANIZER") {
          navigate(`/organizer/profile/${userId}`, { replace: true });
          return;
        }

        setUser(userResponse.data);
      } catch (error) {
        // Fallback to mock user data
        setUser(generateMockUser(userId));
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockUser = (id) => ({
    id,
    firstName: "Sandyxx",
    lastName: "",
    email: "sandyxx.johnson@example.com",
    location: "Berlin, Germany",
    bio: "Music lover and party enthusiast. Always up for discovering new events and meeting cool people!",
    profilePicture:
      id === "1"
        ? "https://i.pinimg.com/736x/65/f6/1a/65f61ae22f9e09181dcf1f71de73dd0f.jpg"
        : "https://ui-avatars.com/api/?name=User+Profile&background=random&color=fff",
    createdAt: new Date("2023-06-15"),
    musicInterests: ["Afrobeats", "Hip-Hop", "Electronic", "Reggae"],
    partyInterests: [
      "Nightclubs",
      "Live Concerts",
      "Festivals",
      "House Parties",
    ],
    favoriteArtists: ["Burna Boy", "Wizkid", "CKay", "Rema"],
    about:
      "Digital creator by day, party-goer by night. Love meeting new people at events and sharing experiences.",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">User not found</p>
          <button
            onClick={() => navigate(-1)}
            className="text-xf-accent hover:brightness-110 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const userProfilePicture = user.profilePicture
    ? getImageUrl(user.profilePicture)
    : `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=403838&color=fff`;

  const isOwnProfile =
    currentUser && parseInt(currentUser.id) === parseInt(userId);

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Back Button */}
      <div className="px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>
      </div>

      {/* Profile Header Component */}
      <ProfileHeader
        user={user}
        userProfilePicture={userProfilePicture}
        isOwnProfile={isOwnProfile}
        isFriend={isFriend}
        setIsFriend={setIsFriend}
      />
    </div>
  );
}
