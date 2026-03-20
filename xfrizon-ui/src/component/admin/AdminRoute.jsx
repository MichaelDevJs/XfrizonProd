import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import {
  canAccessRoute,
  getDefaultAdminPath,
  hasAdminDashboardAccess,
} from "../../utils/adminAccess";

export default function AdminRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const adminToken = localStorage.getItem("adminToken");
  const adminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("adminUser") || "null");
    } catch {
      return null;
    }
  })();
  const hasAdminAccess = hasAdminDashboardAccess(adminUser);
  const isAdminAuthenticated = Boolean(adminToken) && hasAdminAccess;

  useEffect(() => {
    let cancelled = false;

    const verifyAdmin = async () => {
      if (!isAdminAuthenticated) {
        if (!cancelled) setStatus("invalid");
        return;
      }

      try {
        const response = await api.get("/auth/user", {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        const refreshedAdminUser = {
          ...(adminUser || {}),
          id: response?.data?.id ?? adminUser?.id,
          email: response?.data?.email ?? adminUser?.email,
          name:
            response?.data?.name ||
            response?.data?.firstName ||
            adminUser?.name ||
            adminUser?.firstName,
          role: response?.data?.role ?? adminUser?.role,
          roles: response?.data?.roles ?? adminUser?.roles,
          permissions: response?.data?.permissions ?? adminUser?.permissions,
        };

        localStorage.setItem("adminUser", JSON.stringify(refreshedAdminUser));

        if (!cancelled) {
          const hasAccess = canAccessRoute(refreshedAdminUser, location.pathname);
          setStatus(hasAccess ? "valid" : "invalid");
        }
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    };

    verifyAdmin();
    return () => {
      cancelled = true;
    };
  }, [adminToken, isAdminAuthenticated]);

  if (!isAdminAuthenticated || status === "invalid") {
    if (!isAdminAuthenticated) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    }

    if (adminUser) {
      const fallback = getDefaultAdminPath(adminUser);
      if (fallback !== "/admin-login") {
        return <Navigate to={fallback} replace />;
      }
    }

    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    return (
      <Navigate
        to="/admin-login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  if (status === "checking") {
    return (
      <div className="admin-theme min-h-screen bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-zinc-400 text-sm uppercase tracking-wider">
          Verifying admin access...
        </div>
      </div>
    );
  }

  return children;
}
