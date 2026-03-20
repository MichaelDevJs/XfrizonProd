import { useCallback, useContext, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import blogApi from "../../api/blogApi";
import pointsApi from "../../api/pointsApi";
import { FaBell } from "react-icons/fa";

const Header = () => {
  const { organizer, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [genreDropdown, setGenreDropdown] = useState(false);
  const [signupDropdownOpen, setSignupDropdownOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [commentNotifications, setCommentNotifications] = useState([]);
  const [commentUnreadCount, setCommentUnreadCount] = useState(0);
  const [commentNotificationsLoading, setCommentNotificationsLoading] =
    useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userPoints, setUserPoints] = useState(null);
  const [userPointsLoading, setUserPointsLoading] = useState(false);
  const dropdownBtnRef = useRef(null);
  const notificationRef = useRef(null);
  const genreDropdownRef = useRef(null);
  const signupDropdownRef = useRef(null);
  const roleTokens = Array.isArray(organizer?.roles)
    ? organizer.roles
    : String(organizer?.roles || "")
        .split(",")
        .map((role) => role.trim().toUpperCase())
        .filter(Boolean);
  const isPartnerUser =
    organizer?.role === "PARTNER" || roleTokens.includes("PARTNER");

  const handleAccountLogout = () => {
    const hasAdminSession = Boolean(localStorage.getItem("adminToken"));
    if (hasAdminSession) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("pendingAdminGoogleLogin");
      navigate("/admin-login");
      return;
    }

    logout();
    navigate("/");
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownBtnRef.current &&
        !dropdownBtnRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
      if (
        genreDropdownRef.current &&
        !genreDropdownRef.current.contains(event.target)
      ) {
        setGenreDropdown(false);
      }
      if (
        signupDropdownRef.current &&
        !signupDropdownRef.current.contains(event.target)
      ) {
        setSignupDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset image error when organizer image changes
  useEffect(() => {
    setImageLoadError(false);
  }, [organizer?.logo, organizer?.profilePicture]);

  useEffect(() => {
    if (!organizer || !notificationOpen) return;
    fetchCommentNotifications();
  }, [organizer, notificationOpen]);

  const loadUserPoints = useCallback(async () => {
    if (!organizer || organizer.role === "ORGANIZER" || isPartnerUser) {
      setUserPoints(null);
      setUserPointsLoading(false);
      return;
    }

    try {
      setUserPointsLoading(true);
      const wallet = await pointsApi.getWallet();
      setUserPoints(Number(wallet?.availableBalance || 0));
    } catch {
      setUserPoints(null);
    } finally {
      setUserPointsLoading(false);
    }
  }, [organizer, isPartnerUser]);

  useEffect(() => {
    if (!organizer) return;

    fetchCommentNotifications();
    const intervalId = setInterval(() => {
      fetchCommentNotifications();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [organizer]);

  useEffect(() => {
    loadUserPoints();
  }, [loadUserPoints, location.pathname]);

  useEffect(() => {
    const handlePointsRefresh = () => {
      loadUserPoints();
    };

    window.addEventListener("points:refresh", handlePointsRefresh);
    return () => {
      window.removeEventListener("points:refresh", handlePointsRefresh);
    };
  }, [loadUserPoints]);

  useEffect(() => {
    if (!dropdownOpen || organizer?.role === "ORGANIZER" || isPartnerUser)
      return;
    loadUserPoints();
  }, [dropdownOpen, organizer?.role, isPartnerUser, loadUserPoints]);

  const fetchCommentNotifications = async () => {
    try {
      setCommentNotificationsLoading(true);
      const response = await blogApi.getCommentNotifications();
      const payload = response?.data ?? response ?? {};
      setCommentNotifications(
        Array.isArray(payload.notifications) ? payload.notifications : [],
      );
      setCommentUnreadCount(Number(payload.unreadCount || 0));
    } catch (err) {
      setCommentNotifications([]);
      setCommentUnreadCount(0);
    } finally {
      setCommentNotificationsLoading(false);
    }
  };

  const handleOpenNotification = async (notification) => {
    try {
      if (!notification?.isRead) {
        await blogApi.markCommentNotificationRead(notification.id);
        setCommentNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );
        setCommentUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Keep navigation behavior even if read-state update fails.
    } finally {
      setDropdownOpen(false);
      setNotificationOpen(false);
      if (notification?.blogId) {
        navigate(`/blog/${notification.blogId}`);
      }
    }
  };

  const handleMarkAllCommentNotificationsRead = async () => {
    try {
      await blogApi.markAllCommentNotificationsRead();
      setCommentNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
      setCommentUnreadCount(0);
    } catch {
      // Intentionally ignore to avoid blocking dropdown usage.
    }
  };

  const genres = [
    "All Genres",
    "Techno",
    "House",
    "Deep House",
    "Hip-Hop",
    "Drum & Bass",
    "Afrobeats",
    "Jazz",
    "Amapiano",
    "Comedy",
  ];

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

  const categories = ["Events", "Partners", "For Organizers"];

  const isOrganizerDashboardArea =
    location.pathname === "/organizer" ||
    /^\/organizer\/(dashboard|statistics|scanner|my-events|create-event|edit-event|preview|profile|profile-edit|messages|finance|support)(\/|$)/.test(
      location.pathname,
    );

  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-black border-b border-[#343232]">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-4 sm:px-6 h-12 sm:h-14 gap-3">
          {/* Left: Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group cursor-pointer transition-all duration-300 hover:opacity-80 shrink-0"
          >
            <span
              className="text-xl font-bold text-red-500 tracking-widest"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              XF
            </span>
          </Link>

          {/* Center: Navigation */}
          {!isOrganizerDashboardArea && (
            <div className="flex-1 flex items-center justify-center gap-4 lg:gap-10 mx-2 sm:mx-6 lg:mx-12 min-w-0">
              {/* Category Links */}
              <nav className="hidden lg:flex items-center gap-8">
                {categories.map((cat, idx) => {
                  // Hide "For Organizers" if logged in as organizer
                  if (
                    cat === "For Organizers" &&
                    organizer?.role === "ORGANIZER"
                  ) {
                    return null;
                  }

                  let link = "/";
                  if (cat === "Events") {
                    link = "/";
                  } else if (cat === "For Organizers") {
                    link =
                      organizer?.role === "ORGANIZER"
                        ? "/organizer/dashboard"
                        : "/auth/organizer-signup";
                  } else {
                    link = `/${cat.toLowerCase()}`;
                  }
                  return (
                    <Link
                      key={idx}
                      to={link}
                      className="text-gray-400 hover:text-white transition-colors duration-300 font-light text-xs uppercase tracking-widest whitespace-nowrap"
                    >
                      {cat}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Right: User Section */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Genre Selector */}

            {/* Auth Section */}
            {organizer ? (
              <div className="flex items-center gap-2">
                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationOpen((prev) => !prev);
                      setDropdownOpen(false);
                    }}
                    className={`relative flex items-center justify-center w-9 h-9 border border-zinc-800 rounded-lg hover:border-cyan-500 hover:text-cyan-500 transition-all duration-300 text-gray-400 hover:bg-zinc-900 ${
                      notificationOpen
                        ? "bg-zinc-900 border-cyan-500 text-cyan-500"
                        : ""
                    }`}
                    aria-label="Notifications"
                  >
                    <FaBell className="text-sm" />
                    {commentUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[9px] leading-4 text-center font-semibold">
                        {commentUnreadCount > 9 ? "9+" : commentUnreadCount}
                      </span>
                    )}
                  </button>

                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] text-gray-400 uppercase tracking-widest">
                            Notifications
                          </p>
                          <button
                            type="button"
                            onClick={handleMarkAllCommentNotificationsRead}
                            disabled={commentUnreadCount === 0}
                            className="text-[10px] text-xf-accent uppercase tracking-widest disabled:opacity-40"
                          >
                            Mark all
                          </button>
                        </div>
                      </div>

                      {commentNotificationsLoading ? (
                        <p className="px-4 py-3 text-xs text-gray-500">
                          Loading...
                        </p>
                      ) : commentNotifications.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-gray-500">
                          No comment activity yet
                        </p>
                      ) : (
                        <div
                          className={
                            commentNotifications.length > 10
                              ? "max-h-72 overflow-y-auto hide-scrollbar"
                              : ""
                          }
                        >
                          {commentNotifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() =>
                                handleOpenNotification(notification)
                              }
                              className={`w-full text-left px-4 py-2.5 border-t border-zinc-800 transition-colors ${
                                notification.isRead
                                  ? "text-gray-500 hover:bg-zinc-800"
                                  : "text-gray-300 hover:bg-zinc-800/90"
                              }`}
                            >
                              <p className="text-xs leading-5">
                                {notification.message}
                              </p>
                              {!notification.isRead && (
                                <p className="text-[10px] text-red-400 uppercase tracking-widest mt-1">
                                  New
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative" ref={dropdownBtnRef}>
                  <button
                    onClick={() => {
                      setDropdownOpen(!dropdownOpen);
                      setNotificationOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 border border-zinc-800 rounded-lg hover:border-cyan-500 hover:text-cyan-500 transition-all duration-300 text-xs font-light text-gray-400 hover:bg-zinc-900 ${
                      dropdownOpen
                        ? "bg-zinc-900 border-cyan-500 text-cyan-500"
                        : ""
                    }`}
                  >
                    <div className="relative w-5 h-5">
                      {!imageLoadError &&
                      (organizer?.logo || organizer?.profilePicture) ? (
                        <img
                          key={organizer?.logo || organizer?.profilePicture}
                          src={getImageUrl(
                            organizer?.logo || organizer?.profilePicture,
                          )}
                          alt={organizer?.name}
                          className="w-5 h-5 rounded-full object-cover border border-zinc-600"
                          onError={() => setImageLoadError(true)}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center text-xs font-bold text-white">
                          {organizer?.role === "ORGANIZER"
                            ? organizer?.name?.charAt(0)?.toUpperCase() ||
                              organizer?.firstName?.charAt(0)?.toUpperCase()
                            : isPartnerUser
                              ? organizer?.name?.charAt(0)?.toUpperCase() ||
                                organizer?.firstName?.charAt(0)?.toUpperCase() ||
                                "P"
                              : organizer?.firstName?.charAt(0)?.toUpperCase() ||
                                "U"}
                        </div>
                      )}
                    </div>
                    <span className="hidden sm:inline text-xs uppercase tracking-widest">
                      {organizer?.role === "ORGANIZER"
                        ? (organizer?.name || "Organizer").split(" ")[0]
                        : isPartnerUser
                          ? (organizer?.name || organizer?.firstName || "Partner").split(" ")[0]
                          : organizer?.firstName}
                    </span>
                  </button>

                  {/* User Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 flex items-center gap-3">
                        <div className="relative w-10 h-10 shrink-0">
                          {!imageLoadError &&
                          (organizer?.logo || organizer?.profilePicture) ? (
                            <img
                              key={organizer?.logo || organizer?.profilePicture}
                              src={getImageUrl(
                                organizer?.logo || organizer?.profilePicture,
                              )}
                              alt={organizer?.name}
                              className="w-10 h-10 rounded-full object-cover border border-xf-accent"
                              onError={() => setImageLoadError(true)}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-xf-accent to-opacity-80 flex items-center justify-center text-white font-bold text-sm">
                              {organizer?.role === "ORGANIZER"
                                ? organizer?.name?.charAt(0)?.toUpperCase() ||
                                  organizer?.firstName?.charAt(0)?.toUpperCase()
                                : isPartnerUser
                                  ? organizer?.name?.charAt(0)?.toUpperCase() ||
                                    organizer?.firstName?.charAt(0)?.toUpperCase() ||
                                    "P"
                                  : organizer?.firstName
                                      ?.charAt(0)
                                      ?.toUpperCase() || "U"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-xs uppercase tracking-widest truncate">
                            {organizer?.role === "ORGANIZER"
                              ? organizer?.name || organizer?.firstName
                              : isPartnerUser
                                ? organizer?.name || organizer?.firstName
                                : organizer?.firstName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {organizer?.role === "ORGANIZER"
                              ? "Organizer"
                              : isPartnerUser
                                ? "Partner"
                                : "Attendee"}
                          </p>
                        </div>
                      </div>

                      {organizer.role !== "ORGANIZER" && !isPartnerUser && (
                        <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/60">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                            XF Points
                          </p>
                          <p className="text-sm font-semibold text-[#c0f24d] mt-0.5">
                            {userPointsLoading
                              ? "Loading..."
                              : `${Number(userPoints || 0).toLocaleString()} pts`}
                          </p>
                        </div>
                      )}

                      {/* Organizer Menu Items */}
                      {organizer.role === "ORGANIZER" && (
                        <>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/organizer/dashboard");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            Dashboard
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/organizer/create-event");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            Create Event
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate(
                                organizer?.id
                                  ? `/organizer/profile/${organizer.id}`
                                  : "/organizer/profile-edit",
                              );
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/organizer/profile-edit");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/my-rewards");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            My Rewards
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/ticket-history");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            My Tickets
                          </button>
                        </>
                      )}

                      {isPartnerUser && (
                        <>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/partner-dashboard");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            Dashboard
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/partner-scanner");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            Scanner
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/partner-profile-edit");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            Edit Profile
                          </button>
                        </>
                      )}

                      {/* User Menu Items */}
                      {organizer.role !== "ORGANIZER" && !isPartnerUser && (
                        <>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate(organizer?.id ? `/user/${organizer.id}` : "/profile");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/user-profile-edit");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/ticket-history");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            My Tickets
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate("/saved-events");
                            }}
                            className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                          >
                            Saved Events
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleAccountLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xf-accent hover:text-opacity-80 hover:bg-zinc-800 transition-all duration-200 text-xs font-light cursor-pointer uppercase tracking-widest"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Link
                  to="/auth/login"
                  state={{ from: location }}
                  className="px-3 sm:px-4 py-2 text-gray-400 hover:text-xf-accent rounded-lg hover:bg-zinc-900 transition-all duration-300 text-[11px] sm:text-xs font-light uppercase tracking-widest whitespace-nowrap"
                >
                  Login
                </Link>
                <div className="relative" ref={signupDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setSignupDropdownOpen((prev) => !prev)}
                    className="px-3 sm:px-4 py-2 text-white bg-xf-accent hover:brightness-110 rounded-lg transition-all duration-300 text-[11px] sm:text-xs font-light uppercase tracking-widest whitespace-nowrap"
                  >
                    Sign Up
                  </button>

                  {signupDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden">
                      <Link
                        to="/auth/register"
                        onClick={() => setSignupDropdownOpen(false)}
                        className="block w-full px-4 py-2.5 text-gray-300 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 text-xs font-light uppercase tracking-widest"
                      >
                        User
                      </Link>
                      <Link
                        to="/auth/organizer-signup"
                        onClick={() => setSignupDropdownOpen(false)}
                        className="block w-full px-4 py-2.5 text-gray-300 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 text-xs font-light uppercase tracking-widest border-t border-zinc-800"
                      >
                        Organizer
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

