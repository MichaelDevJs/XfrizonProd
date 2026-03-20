const FALLBACK_SITE_URL = "https://xfrizon-ts.com";

const isLocalhostHostname = (hostname = "") =>
  ["localhost", "127.0.0.1"].includes(String(hostname).toLowerCase());

export const getSiteBaseUrl = () => {
  const fromEnv = (import.meta.env.VITE_SITE_URL || "").trim();

  if (typeof window !== "undefined" && window.location?.origin) {
    const runtimeOrigin = window.location.origin;
    const runtimeHostname = window.location.hostname;

    if (!isLocalhostHostname(runtimeHostname)) {
      return runtimeOrigin;
    }

    if (fromEnv) {
      return fromEnv.endsWith("/") ? fromEnv.slice(0, -1) : fromEnv;
    }
  }

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
