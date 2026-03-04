import { useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaPhone,
  FaGlobe,
  FaInstagram,
  FaTwitter,
  FaEnvelope,
  FaMusic,
} from "react-icons/fa";

const normalizeUrl = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  if (trimmed.startsWith("mailto:")) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
};

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const str = String(value).trim();
    if (str) return str;
  }
  return "";
};

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value))
    return value
      .filter(Boolean)
      .map((v) => String(v).trim())
      .filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const toAbsoluteMediaUrl = (rawUrl) => {
  if (!rawUrl) return null;
  const value = String(rawUrl).trim();
  if (!value) return null;
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }
  const base =
    import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8081/api/v1";
  if (value.startsWith("/")) return `${base}${value}`;
  return `${base}/${value}`;
};

export default function ProfileHeader({
  user,
  userProfilePicture,
  isOwnProfile,
  isFriend,
  setIsFriend,
}) {
  const navigate = useNavigate();
  const profile = user?.profile || user?.userProfile || user?.details || {};

  const username = user?.username || user?.handle || user?.firstName || "user";
  const safeUsername = String(username)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const aboutText = firstNonEmpty(
    user?.about,
    user?.bio,
    user?.description,
    profile?.about,
    profile?.bio,
    profile?.description,
  );
  const locationText = firstNonEmpty(
    user?.location,
    user?.city,
    user?.country,
    profile?.location,
    profile?.city,
    profile?.country,
  );
  const favoriteArtists = toArray(
    user?.favoriteArtists || profile?.favoriteArtists,
  );
  const musicInterests = toArray(
    user?.musicInterests || profile?.musicInterests,
  );
  const partyInterests = toArray(
    user?.partyInterests || profile?.partyInterests,
  );
  const interests = toArray(user?.interests || profile?.interests);

  const coverRaw = firstNonEmpty(
    user?.coverPhoto,
    user?.coverImage,
    user?.coverUrl,
    user?.banner,
    user?.bannerUrl,
    user?.headerImage,
    profile?.coverPhoto,
    profile?.coverImage,
    profile?.coverUrl,
    profile?.banner,
    profile?.bannerUrl,
    profile?.headerImage,
  );
  const coverUrl = toAbsoluteMediaUrl(coverRaw);

  const joinedText = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    : null;

  const socialLinks = [
    {
      id: "website",
      href: normalizeUrl(
        user?.website || profile?.website || user?.url || profile?.url,
      ),
      Icon: FaGlobe,
      label: "Website",
    },
    {
      id: "instagram",
      href: normalizeUrl(user?.instagram || profile?.instagram),
      Icon: FaInstagram,
      label: "Instagram",
    },
    {
      id: "twitter",
      href: normalizeUrl(
        user?.twitter || user?.x || profile?.twitter || profile?.x,
      ),
      Icon: FaTwitter,
      label: "Twitter/X",
    },
    {
      id: "email",
      href: user?.email
        ? `mailto:${user.email}`
        : profile?.email
          ? `mailto:${profile.email}`
          : null,
      Icon: FaEnvelope,
      label: "Email",
    },
  ].filter((l) => Boolean(l.href));

  return (
    <div className="relative">
      <div className="relative h-48 sm:h-64 bg-linear-to-br from-zinc-900 via-black to-zinc-900 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt="Cover"
            className="w-full h-full object-cover opacity-40"
          />
        ) : (
          <div className="absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
      </div>

      <div className="bg-black px-4 sm:px-6 pb-12">
        <div className="max-w-4xl mx-auto -mt-20 sm:-mt-24 relative z-10">
          {/* Profile Picture - Centered */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src={userProfilePicture}
                alt={
                  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                  "Profile"
                }
                className="w-40 h-40 sm:w-48 sm:h-48 rounded-full ring-4 ring-xf-accent object-cover bg-black shadow-2xl"
              />
            </div>
          </div>

          {/* User Info - Centered */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              {fullName || "User"}
            </h1>
            <p className="text-gray-400 text-base sm:text-lg mb-6">
              @{safeUsername}
            </p>

            {/* Edit Profile Button */}
            {isOwnProfile && (
              <div className="mb-8">
                <button
                  onClick={() => navigate("/user-profile-edit")}
                  className="px-8 py-2.5 bg-xf-accent text-white hover:brightness-110 rounded-full font-semibold transition flex items-center gap-2 mx-auto"
                >
                  <FaEdit />
                  Edit Profile
                </button>
              </div>
            )}

            {/* Basic Info */}
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm text-gray-300 mb-8">
              {locationText && (
                <span className="inline-flex items-center gap-2">
                  <FaMapMarkerAlt className="text-xf-accent" />
                  <span>{locationText}</span>
                </span>
              )}
              {joinedText && (
                <span className="inline-flex items-center gap-2">
                  <FaCalendarAlt className="text-xf-accent" />
                  <span>Joined {joinedText}</span>
                </span>
              )}
              {(user?.email || profile?.email) && (
                <span className="inline-flex items-center gap-2">
                  <FaEnvelope className="text-xf-accent" />
                  <span>{user?.email || profile?.email}</span>
                </span>
              )}
              {(user?.phone || profile?.phone) && (
                <span className="inline-flex items-center gap-2">
                  <FaPhone className="text-xf-accent" />
                  <span>{user?.phone || profile?.phone}</span>
                </span>
              )}
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex justify-center items-center gap-4 mb-8">
                {socialLinks.map(({ id, href, Icon, label }) => (
                  <a
                    key={id}
                    href={href}
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 text-gray-300 hover:text-white hover:bg-xf-accent transition-all duration-300 border border-zinc-800 hover:border-xf-accent"
                    aria-label={label}
                    title={label}
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            )}

            {/* About */}
            {aboutText && (
              <div className="mt-8 max-w-2xl mx-auto">
                <div className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-3">
                  About
                </div>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                  {aboutText}
                </p>
              </div>
            )}

            {/* Favorite Artists */}
            {favoriteArtists.length > 0 && (
              <div className="mt-8 max-w-3xl mx-auto">
                <div className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-4">
                  Favorite Artists
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {favoriteArtists.slice(0, 12).map((artist) => (
                    <span
                      key={artist}
                      className="inline-flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full text-sm text-gray-200 border border-zinc-800"
                    >
                      <FaMusic className="text-xf-accent" />
                      <span>{artist}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {(musicInterests.length > 0 ||
              partyInterests.length > 0 ||
              interests.length > 0) && (
              <div className="mt-8 max-w-3xl mx-auto">
                <div className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-4">
                  Interests
                </div>
                <div className="space-y-3 text-sm text-gray-200">
                  {musicInterests.length > 0 && (
                    <div className="flex flex-wrap justify-center items-center gap-2">
                      <span className="text-gray-400 font-semibold">
                        Music:
                      </span>
                      {musicInterests.map((interest) => (
                        <span
                          key={interest}
                          className="bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                  {partyInterests.length > 0 && (
                    <div className="flex flex-wrap justify-center items-center gap-2">
                      <span className="text-gray-400 font-semibold">
                        Events:
                      </span>
                      {partyInterests.map((interest) => (
                        <span
                          key={interest}
                          className="bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                  {interests.length > 0 && (
                    <div className="flex flex-wrap justify-center items-center gap-2">
                      <span className="text-gray-400 font-semibold">Tags:</span>
                      {interests.map((interest) => (
                        <span
                          key={interest}
                          className="bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
