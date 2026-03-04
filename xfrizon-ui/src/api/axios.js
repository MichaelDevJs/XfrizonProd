import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

const RETRYABLE_METHODS = new Set(["get", "head", "options"]);
const MAX_NETWORK_RETRIES = 1;
const NETWORK_RETRY_DELAY_MS = 700;

const isRetryableNetworkError = (error) => {
  const code = error?.code;
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "ECONNABORTED" ||
    code === "ERR_NETWORK" ||
    message.includes("timeout") ||
    message.includes("network")
  );
};

// Add JWT token to request headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  const adminToken = localStorage.getItem("adminToken");

  // Use userToken if available, otherwise use adminToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error?.config;
    const method = String(config?.method || "get").toLowerCase();

    if (error?.response?.status === 401 || error?.response?.status === 403) {
      const isAdminRoute = String(config?.url || "").includes("/admin/");
      if (isAdminRoute) {
        localStorage.removeItem("adminToken");
      } else {
        localStorage.removeItem("userToken");
      }
    }

    if (
      config &&
      RETRYABLE_METHODS.has(method) &&
      isRetryableNetworkError(error)
    ) {
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < MAX_NETWORK_RETRIES) {
        config.__retryCount += 1;
        return new Promise((resolve) => {
          setTimeout(() => resolve(api(config)), NETWORK_RETRY_DELAY_MS);
        });
      }
    }

    if (error.response?.status === 401) {
      // Unauthorized - clear stored credentials.
      // Do NOT hard-reload to a fixed login route; let the router handle redirects and preserve "return to".
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
      localStorage.removeItem("adminToken");

      // Inform the app so in-memory auth state updates immediately.
      window.dispatchEvent(new CustomEvent("auth:logout"));

      const pathname = window.location?.pathname || "";
      const loginPath = pathname.startsWith("/admin")
        ? "/admin-login"
        : pathname.startsWith("/organizer")
          ? "/organizer/login"
          : "/auth/login";
      window.dispatchEvent(
        new CustomEvent("auth:unauthorized", { detail: { loginPath } }),
      );
    }
    return Promise.reject(error);
  },
);

export default api;
