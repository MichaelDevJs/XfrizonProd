const FALLBACK_SITE_URL = "https://xfrizon.up.railway.app";

export const getSiteBaseUrl = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  const fromEnv = (import.meta.env.VITE_SITE_URL || "").trim();
  if (fromEnv) {
    return fromEnv.endsWith("/") ? fromEnv.slice(0, -1) : fromEnv;
  }

  return FALLBACK_SITE_URL;
};

export const toAbsoluteSiteUrl = (path = "") => {
  const base = getSiteBaseUrl();
  const normalizedPath = String(path || "").startsWith("/")
    ? String(path)
    : `/${String(path || "")}`;
  return `${base}${normalizedPath}`;
};
