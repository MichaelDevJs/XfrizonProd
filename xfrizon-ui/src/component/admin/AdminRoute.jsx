import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function AdminRoute({ children }) {
  const location = useLocation();
  // Check if admin is authenticated
  const isAdminAuthenticated = localStorage.getItem("adminToken");

  if (!isAdminAuthenticated) {
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

  return children;
}
