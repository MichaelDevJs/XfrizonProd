import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const hasPartnerRole = (user) => {
  if (!user) return false;
  if (user.role === "PARTNER") return true;

  const rawRoles = Array.isArray(user.roles)
    ? user.roles
    : String(user.roles || "")
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean);

  return rawRoles.some((role) => role.toUpperCase() === "PARTNER");
};

export default function PartnerRoute({ children }) {
  const { organizer, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!organizer) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (!hasPartnerRole(organizer) || organizer.role === "ORGANIZER") {
    return <Navigate to="/partners" replace />;
  }

  return children;
}
