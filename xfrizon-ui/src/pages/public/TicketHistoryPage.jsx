import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import TicketHistory from "../../component/user/TicketHistory";

export default function TicketHistoryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="mb-4">Please log in to view your tickets</p>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft size={16} />
            Back
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-[#1e1e1e] hover:bg-[#252525] text-white px-3 py-2 rounded-md transition-colors border border-gray-800 text-xs font-semibold"
          >
            <FaSignOutAlt size={14} />
            Log Out
          </button>
        </div>

        <TicketHistory />
      </div>
    </div>
  );
}
