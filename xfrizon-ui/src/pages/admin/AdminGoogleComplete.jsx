import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import {
  getDefaultAdminPath,
  hasAdminDashboardAccess,
} from "../../utils/adminAccess";

const parseBoolean = (value) => {
  const normalized = String(value || "").toLowerCase();
  return ["1", "true", "yes"].includes(normalized);
};

const clearPendingMarkers = () => {
  localStorage.removeItem("pendingAdminGoogleLogin");
};

const clearUserSession = () => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("user");
};

const clearAdminSession = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
};

export default function AdminGoogleComplete() {
  const location = useLocation();
  const navigate = useNavigate();

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    const finalizeAdminGoogleLogin = async () => {
      const token = query.get("token") || query.get("accessToken") || "";
      const needsProfileCompletion =
        parseBoolean(query.get("needsProfileCompletion")) ||
        parseBoolean(query.get("isNewUser")) ||
        parseBoolean(query.get("signup")) ||
        Boolean(query.get("signupToken"));

      if (needsProfileCompletion) {
        clearPendingMarkers();
        clearAdminSession();
        clearUserSession();
        toast.error("Admin Google sign-in requires an existing role-assigned account.");
        navigate("/admin-login", { replace: true });
        return;
      }

      if (!token) {
        clearPendingMarkers();
        clearAdminSession();
        clearUserSession();
        toast.error("Google admin sign-in token missing.");
        navigate("/admin-login", { replace: true });
        return;
      }

      try {
        const response = await api.get("/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = response?.data || {};
        const adminUserData = {
          id: user.id,
          email: user.email,
          role: user.role,
          roles: user.roles,
          permissions: user.permissions,
          name: user.name || user.firstName,
        };

        if (!hasAdminDashboardAccess(adminUserData)) {
          clearPendingMarkers();
          clearAdminSession();
          clearUserSession();
          toast.error("Access denied. Admin dashboard role required.");
          navigate("/admin-login", { replace: true });
          return;
        }

        clearPendingMarkers();
        clearUserSession();
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminUser", JSON.stringify(adminUserData));

        toast.success("Google admin login successful!");
        navigate(getDefaultAdminPath(adminUserData), { replace: true });
      } catch (error) {
        clearPendingMarkers();
        clearAdminSession();
        clearUserSession();
        console.error("Google admin login failed:", error);
        toast.error(
          error?.response?.data?.message ||
            "Unable to complete admin Google login.",
        );
        navigate("/admin-login", { replace: true });
      }
    };

    finalizeAdminGoogleLogin();
  }, [navigate, query]);

  return (
    <div className="admin-theme min-h-screen bg-[#1e1e1e] flex items-center justify-center px-4 py-8">
      <div className="text-zinc-300 text-sm uppercase tracking-wider">
        Verifying Google admin access...
      </div>
    </div>
  );
}
