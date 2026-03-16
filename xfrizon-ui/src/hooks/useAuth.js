import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  const { organizer, loading, login, register, logout, updateUser } = context;

  const roleTokens = Array.isArray(organizer?.roles)
    ? organizer.roles
    : String(organizer?.roles || "")
        .split(",")
        .map((role) => role.trim().toUpperCase())
        .filter(Boolean);

  const isPartner = organizer?.role === "PARTNER" || roleTokens.includes("PARTNER");

  return {
    user: organizer,
    isAuthenticated: !!organizer,
    loading,
    isOrganizer: organizer?.role === "ORGANIZER",
    isPartner,
    login,
    register,
    logout,
    updateUser,
  };
};
