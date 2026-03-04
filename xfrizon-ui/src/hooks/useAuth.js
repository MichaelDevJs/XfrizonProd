import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  const { organizer, loading } = context;

  return {
    user: organizer,
    isAuthenticated: !!organizer,
    loading,
    isOrganizer: organizer?.role === "ORGANIZER",
  };
};
