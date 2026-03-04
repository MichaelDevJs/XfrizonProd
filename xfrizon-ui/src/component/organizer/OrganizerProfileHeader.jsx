import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaHeart,
  FaMapMarkerAlt,
  FaGlobe,
  FaInstagram,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaTwitter,
  FaUsers,
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

const OrganizerProfileHeader = ({
  organizer,
  isOwnProfile,
  profilePictureUrl,
  profileImageError,
  setProfileImageError,
  coverImageUrl,
}) => {
  const navigate = useNavigate();

  const organizerName = organizer?.name || organizer?.firstName || "Organizer";
  const username = organizer?.email?.split("@")[0] || "organizer";
  const aboutText = firstNonEmpty(
    organizer?.bio,
    organizer?.description,
    organizer?.about,
  );
  const locationText = firstNonEmpty(
    organizer?.location,
    organizer?.city,
    organizer?.country,
  );

  const joinedText = organizer?.createdAt
    ? new Date(organizer.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    : null;

  const coverUrl =
    toAbsoluteMediaUrl(organizer?.coverPhoto) ||
    coverImageUrl ||
    "https://i.pinimg.com/736x/8a/b8/9d/8ab89dc4611d0276369f955c193270af.jpg";

  const socialLinks = [
    {
      id: "website",
      href: normalizeUrl(organizer?.website || organizer?.url),
      Icon: FaGlobe,
      label: "Website",
    },
    {
      id: "instagram",
      href: normalizeUrl(organizer?.instagram),
      Icon: FaInstagram,
      label: "Instagram",
    },
    {
      id: "twitter",
      href: normalizeUrl(organizer?.twitter || organizer?.x),
      Icon: FaTwitter,
      label: "Twitter/X",
    },
    {
      id: "email",
      href: organizer?.email ? `mailto:${organizer.email}` : null,
      Icon: FaEnvelope,
      label: "Email",
    },
  ].filter((l) => Boolean(l.href));

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 bg-linear-to-br from-zinc-900 via-black to-zinc-900 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt="Cover"
            className="w-full h-full object-cover opacity-40"
            onError={(e) => {
              e.target.src =
                "https://i.pinimg.com/736x/8a/b8/9d/8ab89dc4611d0276369f955c193270af.jpg";
            }}
          />
        ) : (
          <div className="absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
      </div>

      {/* Profile Content */}
      <div className="bg-black px-4 sm:px-6 pb-12">
        <div className="max-w-4xl mx-auto -mt-20 sm:-mt-24 relative z-10">
          {/* Profile Picture - Centered */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {!profileImageError && profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={organizerName}
                  className="w-40 h-40 sm:w-48 sm:h-48 rounded-full ring-4 ring-xf-accent object-cover bg-black shadow-2xl"
                  onError={() => setProfileImageError(true)}
                />
              ) : (
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full ring-4 ring-xf-accent bg-linear-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-white text-6xl font-bold tracking-tight shadow-2xl">
                  {organizerName[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Organizer Info - Centered */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              {organizerName}
            </h1>
            <p className="text-gray-400 text-base sm:text-lg mb-6">
              @{username}
            </p>

            <p className="text-gray-400 text-base sm:text-lg mb-6">
              @{username}
            </p>

            {/* Action Buttons */}
            <div className="mb-8 flex justify-center gap-4">
              {isOwnProfile ? (
                <button
                  onClick={() => navigate("/organizer/profile-edit")}
                  className="px-8 py-2.5 bg-xf-accent text-white hover:brightness-110 rounded-full font-semibold transition flex items-center gap-2"
                >
                  <FaEdit />
                  Edit Profile
                </button>
              ) : (
                <button className="px-8 py-2.5 bg-xf-accent text-white hover:brightness-110 rounded-full font-semibold transition flex items-center gap-2">
                  <FaHeart />
                  Follow
                </button>
              )}
            </div>

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
              {organizer?.email && (
                <span className="inline-flex items-center gap-2">
                  <FaEnvelope className="text-xf-accent" />
                  <span>{organizer.email}</span>
                </span>
              )}
              {organizer?.phone && (
                <span className="inline-flex items-center gap-2">
                  <FaPhone className="text-xf-accent" />
                  <span>{organizer.phone}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerProfileHeader;
