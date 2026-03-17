import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../../api/axios";

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
  const isAdminAuthenticated =
    Boolean(adminToken) &&
    String(adminUser?.role || "").toUpperCase() === "ADMIN";

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

        const role = String(response?.data?.role || "").toUpperCase();
        if (!cancelled) {
          setStatus(role === "ADMIN" ? "valid" : "invalid");
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
