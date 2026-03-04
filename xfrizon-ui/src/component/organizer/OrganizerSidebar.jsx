import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaCalendarAlt,
  FaPlus,
  FaEnvelope,
  FaDollarSign,
  FaHeadset,
  FaUser,
  FaSignOutAlt,
  FaQrcode,
  FaChartLine,
} from "react-icons/fa";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const OrganizerSidebar = () => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const isActive = (path) => location.pathname.includes(path);

  const dashboardItems = [
    {
      path: "/organizer/dashboard",
      label: "Overview",
      icon: <FaHome className="w-4 h-4" />,
    },
    {
      path: "/organizer/my-events",
      label: "My Events",
      icon: <FaCalendarAlt className="w-4 h-4" />,
    },
    {
      path: "/organizer/create-event",
      label: "Create Event",
      icon: <FaPlus className="w-4 h-4" />,
    },
  ];

  const manageItems = [
    {
      path: "/organizer/statistics",
      label: "Statistics",
      icon: <FaChartLine className="w-4 h-4" />,
    },
    {
      path: "/organizer/scanner",
      label: "Ticket Scanner",
      icon: <FaQrcode className="w-4 h-4" />,
    },
    {
      path: "/organizer/messages",
      label: "Messages",
      icon: <FaEnvelope className="w-4 h-4" />,
      badge: 0,
    },
    {
      path: "/organizer/finance",
      label: "Finance",
      icon: <FaDollarSign className="w-4 h-4" />,
    },
    {
      path: "/organizer/profile",
      label: "Profile",
      icon: <FaUser className="w-4 h-4" />,
    },
  ];

  const supportItems = [
    {
      path: "/organizer/support",
      label: "Contact Support",
      icon: <FaHeadset className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-zinc-900 text-white p-6 min-h-screen border-r border-zinc-800 sticky top-0 overflow-y-auto flex flex-col">
      {/* Logo */}
      <Link
        to="/organizer/dashboard"
        className="flex items-center gap-2 mb-8 hover:opacity-80 transition"
      >
        <span className="text-2xl font-light text-gray-400 tracking-wider">
          XFRIZON
        </span>
      </Link>

      {/* Dashboard Section */}
      <div className="mb-6 pb-6 border-b border-zinc-800">
        <p className="text-xs font-light text-gray-500 uppercase tracking-wider mb-3">
          Dashboard
        </p>
        <nav className="space-y-2">
          {dashboardItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-light text-sm ${
                isActive(item.path)
                  ? "bg-red-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Manage Section */}
      <div className="mb-6 pb-6 border-b border-zinc-800 flex-1">
        <p className="text-xs font-light text-gray-500 uppercase tracking-wider mb-3">
          Manage
        </p>
        <nav className="space-y-2">
          {manageItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-light text-sm relative ${
                isActive(item.path)
                  ? "bg-red-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {item.icon}
              {item.label}
              {item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Support Section */}
      <div className="mb-6 pb-6 border-b border-zinc-800">
        <p className="text-xs font-light text-gray-500 uppercase tracking-wider mb-3">
          Support
        </p>
        <nav className="space-y-2">
          {supportItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-light text-sm ${
                isActive(item.path)
                  ? "bg-red-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-zinc-800 rounded-lg transition-all duration-300 font-light text-sm"
      >
        <FaSignOutAlt className="w-4 h-4" />
        Logout
      </button>
    </aside>
  );
};

export default OrganizerSidebar;
