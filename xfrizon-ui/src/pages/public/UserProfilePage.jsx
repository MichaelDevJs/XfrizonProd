import { useLocation, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import ProfileHeader from "../../component/userProfile/ProfileHeader";

export default function UserProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to construct image URLs
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    // Ensure path starts with /
    const normalized = path.startsWith("/") ? path : `/${path}`;
    // Don't add /api/v1 to paths that already start with /api or /uploads
    if (import.meta.env.PROD) {
      return normalized;
    }
    if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
      return `http://localhost:8081${normalized}`;
    }
    return `http://localhost:8081/api/v1${normalized}`;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="mb-4">Please log in to view your profile</p>
          <button
            onClick={() =>
              navigate("/auth/login", {
                replace: true,
                state: { from: location },
              })
            }
            className="bg-xf-accent hover:brightness-110 text-white px-6 py-2 rounded-lg"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex justify-end max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 bg-[#1e1e1e] hover:bg-[#252525] text-white px-3 py-2 rounded-md transition-colors border border-gray-800 text-xs font-semibold"
        >
          <FaSignOutAlt size={14} />
          Log Out
        </button>
      </div>

      <ProfileHeader
        user={user}
        userProfilePicture={
          user.profilePicture
            ? getImageUrl(user.profilePicture)
            : `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=403838&color=fff`
        }
        isOwnProfile={true}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="mt-4 bg-[#121212] border border-gray-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-white font-semibold text-sm">XF Rewards</p>
            <p className="text-gray-400 text-xs mt-0.5">
              Buy tickets, earn points, redeem discounts with partner brands.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/my-rewards")}
              className="px-4 py-2 rounded-lg bg-[#c0f24d] text-black text-xs font-bold hover:brightness-110 transition-all"
            >
              My Rewards
            </button>
            <button
              onClick={() => navigate("/partners")}
              className="px-4 py-2 rounded-lg border border-gray-700 text-white text-xs font-semibold hover:bg-[#1f1f1f] transition-all"
            >
              Partners
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
