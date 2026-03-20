import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaGlobe, FaInstagram, FaTwitter } from "react-icons/fa";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

export default function UserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { organizer: currentUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const isOwnProfile =
    Boolean(currentUser?.id) && Number(currentUser.id) === Number(userId);

  const userProfilePicture = useMemo(() => {
    const raw = user?.profilePicture || user?.logo;
    return getMediaUrl(raw) || "/assets/african-panther-dark.svg";
  }, [user]);

  const userCoverPhoto = useMemo(() => {
    return getMediaUrl(user?.coverPhoto);
  }, [user]);

  const countryText = user?.country || extractCountry(user?.location);

  const websiteLink = normalizeUrl(user?.website);
  const instagramLink = normalizeUrl(user?.instagram);
  const twitterLink = normalizeUrl(user?.twitter || user?.x);

  const socialLinks = [
    {
      id: "website",
      href: websiteLink,
      Icon: FaGlobe,
      label: "Website",
    },
    {
      id: "instagram",
      href: instagramLink,
      Icon: FaInstagram,
      label: "Instagram",
    },
    {
      id: "twitter",
      href: twitterLink,
      Icon: FaTwitter,
      label: "Twitter/X",
    },
  ].filter((item) => Boolean(item.href));

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const userResponse = await api.get(`/auth/users/${userId}`);

      if (userResponse.data.role === "ORGANIZER") {
        navigate(`/organizer/profile/${userId}`, { replace: true });
        return;
      }

      if (userResponse.data.role === "PARTNER") {
        navigate(`/partners/${userId}`, { replace: true });
        return;
      }

      setUser(userResponse.data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setError(
        error?.response?.data?.message || "Unable to load this profile right now.",
      );
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-gray-400 mb-4">{error || "User not found"}</p>
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

  return (
    <div className="bg-black text-white min-h-screen pt-4 sm:pt-6">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative w-full aspect-video sm:aspect-2/1 lg:aspect-3/1 xl:aspect-10/3 bg-black border border-zinc-800 overflow-hidden">
          {userCoverPhoto ? (
            <img
              src={userCoverPhoto}
              alt="Profile cover"
              className="w-full h-full object-cover scale-105 blur-[2px] brightness-50"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
              <span className="text-xs uppercase tracking-widest text-zinc-500">
                No Cover Image
              </span>
            </div>
          )}

          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center sm:left-6 md:left-8">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-black shadow-2xl sm:h-28 sm:w-28 md:h-32 md:w-32">
              <img
                src={userProfilePicture}
                alt={`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Profile"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/assets/african-panther-dark.svg";
                }}
              />
            </div>
            <p className="mt-2 text-xs sm:text-sm font-medium text-white text-center drop-shadow-md max-w-32 truncate">
              {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User"}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-3">
        <div className="flex items-center justify-center gap-4 sm:gap-6 border-b border-zinc-800/90">
          <button
            className={`pb-2 text-[10px] sm:text-[11px] font-light tracking-[0.08em] transition-colors duration-200 ${
              activeTab === "overview"
                ? "text-zinc-200 border-b border-red-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`pb-2 text-[10px] sm:text-[11px] font-light tracking-[0.08em] transition-colors duration-200 ${
              activeTab === "past-events"
                ? "text-zinc-200 border-b border-red-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            onClick={() => setActiveTab("past-events")}
          >
            Past Events
          </button>
          <button
            className={`pb-2 text-[10px] sm:text-[11px] font-light tracking-[0.08em] transition-colors duration-200 ${
              activeTab === "attending-events"
                ? "text-zinc-200 border-b border-red-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            onClick={() => setActiveTab("attending-events")}
          >
            Attending Events
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="p-4 sm:p-5 text-center">
            {activeTab === "overview" && (
              <div className="max-w-2xl mx-auto text-left border border-zinc-800 bg-zinc-950/60 px-4 py-4 sm:px-5 sm:py-5 space-y-3">
                <div>
                  <p className="text-[10px] text-zinc-500 tracking-[0.08em]">Name</p>
                  <p className="text-sm text-zinc-200 font-light">
                    {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-500 tracking-[0.08em]">Location</p>
                  <p className="text-sm text-zinc-200 font-light inline-flex items-center gap-2">
                    {countryText ? (
                      <><span className="text-base leading-none">{countryToFlag(countryText)}</span> {countryText}</>
                    ) : "- -"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-500 tracking-[0.08em]">Bio</p>
                  <p className="text-sm text-zinc-200 font-light whitespace-pre-wrap leading-6">
                    {user?.bio || "No bio yet."}
                  </p>
                </div>
              </div>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-2 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-light tracking-[0.02em] text-gray-200/90">
                {socialLinks.map(({ id, href, Icon, label }, index) => (
                  <span key={id} className="inline-flex items-center gap-2">
                    {index > 0 ? <span className="text-gray-500">|</span> : null}
                    <a
                      href={href}
                      target={href.startsWith("mailto:") ? undefined : "_blank"}
                      rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
                      className="inline-flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <Icon size={12} /> {label}
                    </a>
                  </span>
                ))}
              </div>
            )}

            {activeTab === "past-events" && (
              <div className="mt-4 max-w-2xl mx-auto">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  No past events available yet.
                </p>
              </div>
            )}

            {activeTab === "attending-events" && (
              <div className="mt-4 max-w-2xl mx-auto">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  No upcoming attending events yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Extract the last comma-separated segment as country from a "City, Country" string
function extractCountry(locationStr) {
  if (!locationStr) return null;
  const parts = String(locationStr).split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || null;
}

// Map country name to flag emoji via ISO 3166-1 alpha-2 regional indicators
const COUNTRY_CODES = {
  Afghanistan:"AF",Albania:"AL",Algeria:"DZ",Andorra:"AD",Angola:"AO",
  Argentina:"AR",Armenia:"AM",Australia:"AU",Austria:"AT",Azerbaijan:"AZ",
  Bahamas:"BS",Bahrain:"BH",Bangladesh:"BD",Belarus:"BY",Belgium:"BE",
  Belize:"BZ",Benin:"BJ",Bhutan:"BT",Bolivia:"BO","Bosnia and Herzegovina":"BA",
  Botswana:"BW",Brazil:"BR",Brunei:"BN",Bulgaria:"BG","Burkina Faso":"BF",
  Burundi:"BI",Cambodia:"KH",Cameroon:"CM",Canada:"CA","Cape Verde":"CV",
  Chad:"TD",Chile:"CL",China:"CN",Colombia:"CO",Comoros:"KM",
  Congo:"CG","Costa Rica":"CR",Croatia:"HR",Cuba:"CU",Cyprus:"CY",
  Czechia:"CZ","Czech Republic":"CZ",Denmark:"DK",Djibouti:"DJ",
  "Dominican Republic":"DO",Ecuador:"EC",Egypt:"EG","El Salvador":"SV",
  Eritrea:"ER",Estonia:"EE",Eswatini:"SZ",Ethiopia:"ET",Fiji:"FJ",
  Finland:"FI",France:"FR",Gabon:"GA",Gambia:"GM",Georgia:"GE",
  Germany:"DE",Ghana:"GH",Greece:"GR",Guatemala:"GT",Guinea:"GN",
  Guyana:"GY",Haiti:"HT",Honduras:"HN",Hungary:"HU",Iceland:"IS",
  India:"IN",Indonesia:"ID",Iran:"IR",Iraq:"IQ",Ireland:"IE",
  Israel:"IL",Italy:"IT",Jamaica:"JM",Japan:"JP",Jordan:"JO",
  Kazakhstan:"KZ",Kenya:"KE",Kosovo:"XK",Kuwait:"KW",Kyrgyzstan:"KG",
  Laos:"LA",Latvia:"LV",Lebanon:"LB",Lesotho:"LS",Liberia:"LR",
  Libya:"LY",Liechtenstein:"LI",Lithuania:"LT",Luxembourg:"LU",
  Madagascar:"MG",Malawi:"MW",Malaysia:"MY",Maldives:"MV",Mali:"ML",
  Malta:"MT",Mauritania:"MR",Mauritius:"MU",Mexico:"MX",Moldova:"MD",
  Monaco:"MC",Mongolia:"MN",Montenegro:"ME",Morocco:"MA",Mozambique:"MZ",
  Myanmar:"MM",Namibia:"NA",Nepal:"NP",Netherlands:"NL","New Zealand":"NZ",
  Nicaragua:"NI",Niger:"NE",Nigeria:"NG","North Korea":"KP","North Macedonia":"MK",
  Norway:"NO",Oman:"OM",Pakistan:"PK",Panama:"PA",Paraguay:"PY",
  Peru:"PE",Philippines:"PH",Poland:"PL",Portugal:"PT",Qatar:"QA",
  Romania:"RO",Russia:"RU",Rwanda:"RW","Saudi Arabia":"SA",Senegal:"SN",
  Serbia:"RS","Sierra Leone":"SL",Singapore:"SG",Slovakia:"SK",Slovenia:"SI",
  Somalia:"SO","South Africa":"ZA","South Korea":"KR","South Sudan":"SS",
  Spain:"ES","Sri Lanka":"LK",Sudan:"SD",Suriname:"SR",Sweden:"SE",
  Switzerland:"CH",Syria:"SY",Taiwan:"TW",Tajikistan:"TJ",Tanzania:"TZ",
  Thailand:"TH",Togo:"TG","Trinidad and Tobago":"TT",Tunisia:"TN",
  Turkey:"TR",Turkmenistan:"TM",Uganda:"UG",Ukraine:"UA",
  "United Arab Emirates":"AE",UAE:"AE","United Kingdom":"GB",UK:"GB",
  "United States":"US",USA:"US",Uruguay:"UY",Uzbekistan:"UZ",
  Venezuela:"VE",Vietnam:"VN",Yemen:"YE",Zambia:"ZM",Zimbabwe:"ZW",
};

function countryToFlag(country) {
  if (!country) return "";
  const code = COUNTRY_CODES[country] || COUNTRY_CODES[country.trim()];
  if (!code) return "";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

function normalizeUrl(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("mailto:")) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function getMediaUrl(path) {
  if (!path) return null;
  const value = String(path).trim();
  if (!value) return null;
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const normalized = value.startsWith("/") ? value : `/${value}`;
  if (import.meta.env.PROD) {
    return normalized;
  }
  if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
    return `http://localhost:8081${normalized}`;
  }
  return `http://localhost:8081/api/v1${normalized}`;
}
