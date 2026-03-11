import React from "react";
import { useState, useEffect } from "react";
import { FaHeart, FaGlobe, FaInstagram, FaTwitter } from "react-icons/fa";
import OrganizerCoverSlideshow from "./OrganizerCoverSlideshow";

const VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".m4v",
  ".avi",
  ".mkv",
];

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
  // /uploads/* is served from API origin root, not /api/v1.
  if (value.startsWith("/uploads/")) {
    const origin = base.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
    return `${origin}${value}`;
  }
  if (value.startsWith("/")) return `${base}${value}`;
  return `${base}/${value}`;
};

const isLikelyVideoUrl = (url) => {
  if (!url) return false;
  const value = String(url).toLowerCase();

  if (value.startsWith("data:video/")) return true;
  if (value.includes("content-type=video") || value.includes("mime=video")) {
    return true;
  }

  return VIDEO_EXTENSIONS.some((ext) => value.includes(ext));
};

const OrganizerProfileHeader = ({
  organizer,
  isOwnProfile,
  profilePictureUrl,
  profileImageError,
  setProfileImageError,
  coverImageUrl,
  belowCoverContent,
}) => {
  const organizerName = organizer?.name || organizer?.firstName || "Organizer";
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
  ].filter((l) => Boolean(l.href));

  const coverUrl =
    toAbsoluteMediaUrl(organizer?.coverPhoto) || coverImageUrl || null;
  const coverIsVideo = isLikelyVideoUrl(coverUrl);

  // Build slides array — prefer coverMedia JSON array, fallback to single coverPhoto
  const coverSlides = (() => {
    if (organizer?.coverMedia) {
      try {
        const parsed =
          typeof organizer.coverMedia === "string"
            ? JSON.parse(organizer.coverMedia)
            : organizer.coverMedia;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, i) => {
            const url = toAbsoluteMediaUrl(
              typeof item === "string" ? item : item.url,
            );
            const type =
              typeof item === "string"
                ? isLikelyVideoUrl(item)
                  ? "video"
                  : "image"
                : item.type || (isLikelyVideoUrl(item.url) ? "video" : "image");
            return { id: `cm-${i}`, url, type };
          });
        }
      } catch (_) {}
    }
    // fallback single slide
    if (coverUrl) {
      return [
        {
          id: "cover-0",
          url: coverUrl,
          type: coverIsVideo ? "video" : "image",
        },
      ];
    }
    return [];
  })();

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
      {/* Cover Block */}
      <div className="relative w-full aspect-video sm:aspect-2/1 lg:aspect-3/1 xl:aspect-10/3 bg-black overflow-hidden">
        <OrganizerCoverSlideshow slides={coverSlides} />
      </div>

      {/* Nav Block */}
      {belowCoverContent && <div>{belowCoverContent}</div>}
    </div>
  );
};

export default OrganizerProfileHeader;
