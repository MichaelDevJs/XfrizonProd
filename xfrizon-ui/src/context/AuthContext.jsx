import { createContext, useState, useEffect } from "react";
import React from "react";
import api from "../api/axios";

export const AuthContext = createContext();

const safeJsonParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const hasPartnerRole = (role, roles) => {
  if (role === "PARTNER") return true;
  const roleTokens = Array.isArray(roles)
    ? roles
    : String(roles || "")
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
  return roleTokens.includes("PARTNER");
};

const AuthProvider = ({ children }) => {
  const [organizer, setOrganizer] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return safeJsonParse(storedUser);
  });
  // loading is used by route guards; keep it false when we can render immediately.
  const [loading, setLoading] = useState(false);

  // Keep in-memory auth in sync when other code clears credentials (e.g. Axios 401 handler)
  useEffect(() => {
    const handleLogoutEvent = () => {
      setOrganizer(null);
      setLoading(false);
    };

    window.addEventListener("auth:logout", handleLogoutEvent);
    return () => window.removeEventListener("auth:logout", handleLogoutEvent);
  }, []);

  // Validate token and load user data on mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        // Skip validation for admin routes - admin uses separate adminToken
        const isAdminRoute = window.location.pathname.startsWith("/admin");
        if (isAdminRoute) {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("userToken");
        const storedUser = safeJsonParse(localStorage.getItem("user"));

        // If we have a stored user but no token, treat as logged out and clean up.
        if (!token) {
          if (storedUser) {
            logout();
          }
          return;
        }

        // If we have a stored user, render immediately and validate in background.
        if (storedUser && !organizer) {
          setOrganizer(storedUser);
        }

        // Show loading spinner only if we have no cached user to render.
        if (!storedUser) {
          setLoading(true);
        }

        // Create abort controller with a short timeout. Timeout/network errors should NOT log users out.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 8000);

        try {
          const response = await api.get("/auth/validate-token", {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.data.valid) {
            // Fetch user data in background without blocking
            fetchUserData().catch((err) => {
              console.error("Failed to fetch user data:", err);
            });
          } else {
            logout();
          }
        } catch (error) {
          clearTimeout(timeoutId);
          const status = error?.response?.status;
          const isAbortOrCancel =
            error?.name === "CanceledError" ||
            error?.name === "AbortError" ||
            error?.code === "ERR_CANCELED";

          // Only log out for definitive auth failures.
          if (status === 401 || status === 403) {
            logout();
            return;
          }

          // Network/timeout/5xx: keep cached session and allow the app to render.
          if (!isAbortOrCancel) {
            console.warn(
              "Token validation failed (non-auth), keeping session",
              error?.message,
            );
          }
        }
      } finally {
        setLoading(false);
      }
    };

    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get("/auth/user");
      const isPartner = hasPartnerRole(response.data.role, response.data.roles);
      setOrganizer({
        id: response.data.id,
        name:
          response.data.role === "ORGANIZER"
            ? response.data.name || response.data.firstName || ""
            : isPartner
              ? response.data.name || response.data.firstName || ""
              : `${response.data.firstName} ${response.data.lastName}`,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        role: response.data.role,
        roles: response.data.roles,
        logo: response.data.logo || response.data.profilePicture,
        profilePicture: response.data.profilePicture || response.data.logo,
        phoneNumber: response.data.phoneNumber,
        location: response.data.location,
        address: response.data.address,
        bio: response.data.bio,
        coverPhoto: response.data.coverPhoto,
      });
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        logout();
      }
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        const isPartner = hasPartnerRole(response.data.role, response.data.roles);
        const nameForDisplay =
          response.data.role === "ORGANIZER"
            ? response.data.name || response.data.firstName
            : isPartner
              ? response.data.name || response.data.firstName
              : `${response.data.firstName} ${response.data.lastName}`;

        const userData = {
          id: response.data.userId,
          name: nameForDisplay,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          role: response.data.role,
          roles: response.data.roles,
          logo: response.data.logo || response.data.profilePicture,
          profilePicture: response.data.profilePicture || response.data.logo,
          phoneNumber: response.data.phoneNumber,
          location: response.data.location,
          address: response.data.address,
          bio: response.data.bio,
          coverPhoto: response.data.coverPhoto,
        };

        localStorage.setItem("userToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(userData));

        setOrganizer(userData);

        return response.data;
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const register = async (
    firstName,
    lastName,
    email,
    password,
    profilePicture,
  ) => {
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
        profilePicture,
        referralCode: referralCode || undefined,
      });

      if (response.data.success) {
        localStorage.setItem("userToken", response.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: response.data.userId,
            email: response.data.email,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            role: response.data.role,
            roles: response.data.roles,
            profilePicture: response.data.profilePicture,
          }),
        );

        setOrganizer({
          id: response.data.userId,
          name: `${response.data.firstName} ${response.data.lastName}`,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          role: response.data.role,
          roles: response.data.roles,
          profilePicture: response.data.profilePicture,
        });

        if (referralCode) {
          localStorage.removeItem("xfrizon_referral");
        }

        return response.data;
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    setOrganizer(null);
  };

  const updateUser = (userData) => {
    const updatedUser = {
      ...organizer,
      ...userData,
      // Build name from firstName/lastName for display
      name:
        userData.role === "ORGANIZER"
          ? userData.name || userData.firstName || organizer?.firstName || ""
          : `${userData.firstName || organizer?.firstName || ""} ${userData.lastName || organizer?.lastName || ""}`,
      // Ensure all fields are preserved
      id: userData.id || organizer?.id,
      firstName: userData.firstName || organizer?.firstName,
      lastName: userData.lastName || organizer?.lastName,
      email: userData.email || organizer?.email,
      role: userData.role || organizer?.role,
      roles: userData.roles || organizer?.roles,
      // Profile image fields
      logo:
        userData.logo ||
        userData.profilePicture ||
        organizer?.logo ||
        organizer?.profilePicture,
      profilePicture:
        userData.profilePicture ||
        userData.logo ||
        organizer?.profilePicture ||
        organizer?.logo,
      // Additional organizer fields
      phoneNumber:
        userData.phoneNumber ||
        userData.phone ||
        organizer?.phoneNumber ||
        organizer?.phone,
      location: userData.location || organizer?.location,
      address: userData.address || organizer?.address,
      bio:
        userData.bio ||
        userData.description ||
        organizer?.bio ||
        organizer?.description,
      coverPhoto: userData.coverPhoto || organizer?.coverPhoto,
      website: userData.website || organizer?.website || "",
      instagram: userData.instagram || organizer?.instagram || "",
      twitter: userData.twitter || organizer?.twitter || "",
    };
    setOrganizer(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{ organizer, login, register, logout, loading, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
