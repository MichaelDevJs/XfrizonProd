import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const Header = () => {
  const { organizer, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [genreDropdown, setGenreDropdown] = useState(false);
  const [signupDropdownOpen, setSignupDropdownOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const dropdownBtnRef = useRef(null);
  const genreDropdownRef = useRef(null);
  const signupDropdownRef = useRef(null);

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

  const categories = ["Events", "For Organizers"];

  const isOrganizerDashboardArea =
    location.pathname === "/organizer" ||
    /^\/organizer\/(dashboard|statistics|scanner|my-events|create-event|edit-event|preview|profile|profile-edit|messages|finance|support)(\/|$)/.test(
      location.pathname,
    );

  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-transparent backdrop-blur-md">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 gap-3">
          {/* Left: Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group cursor-pointer transition-all duration-300 hover:opacity-80 shrink-0"
          >
            <span
              className="text-xl font-bold text-xf-accent tracking-widest"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              XF
            </span>
            <span className="text-xs text-gray-500 tracking-widest font-light">
              EVENTS
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
              <div className="relative" ref={dropdownBtnRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
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
                          : organizer?.firstName?.charAt(0)?.toUpperCase() ||
                            "U"}
                      </div>
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs uppercase tracking-widest">
                    {organizer?.role === "ORGANIZER"
                      ? (organizer?.name || "Organizer").split(" ")[0]
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
                            : organizer?.firstName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {organizer?.role === "ORGANIZER"
                            ? "Organizer"
                            : "Attendee"}
                        </p>
                      </div>
                    </div>

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
                            navigate("/ticket-history");
                          }}
                          className="w-full text-left px-4 py-2.5 text-gray-400 hover:text-xf-accent hover:bg-zinc-800 transition-all duration-200 border-b border-zinc-800 text-xs font-light cursor-pointer uppercase tracking-widest"
                        >
                          My Tickets
                        </button>
                      </>
                    )}

                    {/* User Menu Items */}
                    {organizer.role !== "ORGANIZER" && (
                      <>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            navigate(`/user/${organizer.id}`);
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
                        logout();
                        navigate("/");
                      }}
                      className="w-full text-left px-4 py-2.5 text-xf-accent hover:text-opacity-80 hover:bg-zinc-800 transition-all duration-200 text-xs font-light cursor-pointer uppercase tracking-widest"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Link
                  to="/auth/login"
                  state={{ from: location }}
                  className="px-3 sm:px-4 py-2 text-gray-400 hover:text-xf-accent border border-zinc-800 rounded-lg hover:border-xf-accent hover:bg-zinc-900 transition-all duration-300 text-[11px] sm:text-xs font-light uppercase tracking-widest whitespace-nowrap"
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
