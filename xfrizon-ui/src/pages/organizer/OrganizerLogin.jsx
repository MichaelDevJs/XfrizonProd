import { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import React from "react";

const OrganizerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!form.email || !form.password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      // Call the login function from AuthContext with email and password
      const result = await login(form.email, form.password);

      if (result && result.success) {
        console.log("Login successful, navigating...");
        setLoading(false);
        const from = location.state?.from;
        const fromPath = from?.pathname
          ? `${from.pathname}${from.search || ""}${from.hash || ""}`
          : null;
        const isFromLogin =
          from?.pathname === "/organizer/login" ||
          from?.pathname === "/auth/login";
        navigate(!isFromLogin && fromPath ? fromPath : "/organizer/dashboard", {
          replace: true,
        });
      } else {
        setLoading(false);
        throw new Error("Login failed: Invalid response from server");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      setError(err?.message || "Invalid email or password");
    }
  };
  return (
    <div className="min-h-screen flex justify-center items-center bg-black text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-8 rounded w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Organizer Login</h2>

        {error && <p className="text-red-500">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          className="w-full p-3 bg-gray-800 rounded"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          className="w-full p-3 bg-gray-800 rounded"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-3 rounded font-semibold transition ${
            loading
              ? "bg-indigo-600 opacity-50 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default OrganizerLogin;
