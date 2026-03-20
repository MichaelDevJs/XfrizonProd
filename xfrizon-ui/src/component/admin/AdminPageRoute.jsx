import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { canAccessRoute, getDefaultAdminPath } from "../../utils/adminAccess";

export default function AdminPageRoute({ children }) {
  const location = useLocation();

  let adminUser = null;
  try {
    adminUser = JSON.parse(localStorage.getItem("adminUser") || "null");
  } catch {
    adminUser = null;
  }

  if (!canAccessRoute(adminUser, location.pathname)) {
    const fallback = getDefaultAdminPath(adminUser);
    return <Navigate to={fallback} replace />;
  }

  return children;
}
