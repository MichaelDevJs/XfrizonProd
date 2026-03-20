import api from "./axios";
import { getSiteBaseUrl } from "../utils/siteUrl";

const isLocalhostHostname = (hostname = "") =>
  ["localhost", "127.0.0.1"].includes(String(hostname).toLowerCase());

const isLocalhostUrl = (value = "") => {
  try {
    return isLocalhostHostname(new URL(value).hostname);
  } catch {
    return false;
  }
};

const getBackendOrigin = () => {
  const currentHostname = window.location.hostname;
  const isDeployedHost = !isLocalhostHostname(currentHostname);
  const explicitOauthOrigin =
    import.meta.env.VITE_OAUTH_BACKEND_ORIGIN ||
    import.meta.env.VITE_BACKEND_ORIGIN;

  if (explicitOauthOrigin && !(isDeployedHost && isLocalhostUrl(explicitOauthOrigin))) {
    try {
      return new URL(explicitOauthOrigin).origin;
    } catch {
      // Ignore invalid override and continue with automatic detection.
    }
  }

  const configuredBaseUrl =
    api.defaults.baseURL || import.meta.env.VITE_API_BASE_URL || "/api/v1";

  if (isDeployedHost && isLocalhostUrl(configuredBaseUrl)) {
    return window.location.origin;
  }

  const isAbsoluteBaseUrl = /^https?:\/\//i.test(String(configuredBaseUrl));
  const isLocalDevHost = isLocalhostHostname(currentHostname);

  if (!isAbsoluteBaseUrl && import.meta.env.DEV && isLocalDevHost) {
    // In dev, a relative API base can accidentally point OAuth to the Vite origin.
    return "http://localhost:8081";
  }

  try {
    const parsedUrl = new URL(configuredBaseUrl, window.location.origin);
    return parsedUrl.origin;
  } catch {
    return window.location.origin;
  }
};

const resolveBackendUrl = (pathOrUrl) => {
  if (!pathOrUrl) return getBackendOrigin();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;
  return `${getBackendOrigin()}${normalizedPath}`;
};

const authService = {
  register: async (firstName, lastName, email, password) => {
    try {
      const referralCode = (
        localStorage.getItem("xfrizon_referral") || ""
      ).trim();
      const response = await api.post("/auth/register", {
        firstName,
        lastName,
        email,
        password,
        confirmPassword: password,
        referralCode: referralCode || undefined,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  registerOrganizer: async (firstName, lastName, email, password) => {
    try {
      const referralCode = (
        localStorage.getItem("xfrizon_referral") || ""
      ).trim();
      const response = await api.post("/auth/register-organizer", {
        firstName,
        lastName,
        email,
        password,
        confirmPassword: password,
        referralCode: referralCode || undefined,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/user");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  updateUser: async (userData) => {
    try {
      const response = await api.put("/auth/user", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  validateToken: async () => {
    try {
      const response = await api.get("/auth/validate-token");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  startGoogleSignup: ({ accountType = "USER", redirectPath } = {}) => {
    const oauthStartPath =
      import.meta.env.VITE_GOOGLE_OAUTH_START_PATH ||
      "/oauth2/authorization/google";
    const startUrl = new URL(resolveBackendUrl(oauthStartPath));
    if (redirectPath) {
      const callbackUrl = new URL(redirectPath, getSiteBaseUrl());
      callbackUrl.searchParams.set("accountType", String(accountType).toUpperCase());
      startUrl.searchParams.set("redirect_uri", callbackUrl.toString());
    }
    startUrl.searchParams.set("accountType", String(accountType).toUpperCase());

    window.location.assign(startUrl.toString());
  },

  completeGoogleSignup: async (payload) => {
    try {
      const endpoint =
        import.meta.env.VITE_GOOGLE_OAUTH_COMPLETE_PATH ||
        "/auth/oauth/google/complete-signup";
      const response = await api.post(endpoint, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
  },
};

export default authService;
