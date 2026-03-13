import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RoleBasedRoute({ children, requiredRole }) {
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

  // If user is not logged in, redirect to login
  if (!organizer) {
    const loginPath = "/auth/login";
    return (
      <Navigate
        to={loginPath}
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // If user doesn't have the required role, redirect to home
  if (requiredRole && organizer.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
