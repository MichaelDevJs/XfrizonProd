import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaShieldAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../api/axios";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call real backend login endpoint
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success && response.data.token) {
        // Store the real JWT token as adminToken
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem(
          "adminUser",
          JSON.stringify({
            id: response.data.userId,
            email: response.data.email,
            role: response.data.role,
            name: response.data.name || response.data.firstName,
          }),
        );

        toast.success("✓ Admin login successful!");

        // Add small delay to ensure token is persisted before navigation
        setTimeout(() => {
          setLoading(false);
          const from = location.state?.from;
          const fromPath = from?.pathname
            ? `${from.pathname}${from.search || ""}${from.hash || ""}`
            : null;
          const isFromLogin = from?.pathname === "/admin-login";

          navigate(!isFromLogin && fromPath ? fromPath : "/admin/dashboard", {
            replace: true,
          });
        }, 100);
      } else {
        toast.error("Login failed. Please check your credentials.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Admin login error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        "Invalid credentials. Please try again.";
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="admin-theme min-h-screen bg-[#1e1e1e] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-950 border-2 border-[#403838] rounded-lg mb-4">
            <FaShieldAlt className="text-[#403838] text-3xl" />
          </div>
          <h1 className="text-2xl font-semibold tracking-[0.18em] uppercase text-[#403838] mb-2">
            XF Admin
          </h1>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Administrator Access
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-950/70 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 font-light text-sm transition-all duration-300 focus:outline-none hover:border-zinc-700 focus:border-[#403838]"
                placeholder="admin@example.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 font-light text-sm transition-all duration-300 focus:outline-none hover:border-zinc-700 focus:border-[#403838] pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? (
                    <FaEyeSlash className="w-4 h-4" />
                  ) : (
                    <FaEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#403838] hover:bg-[#403838]/90 disabled:bg-[#403838]/50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg transition-all duration-300 font-light text-sm uppercase tracking-wider mt-6"
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-[#403838] mt-0.5">
                <FaShieldAlt className="w-3 h-3" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide font-light">
                  Admin Access:
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-600 font-light">
                    Use your admin credentials to access the dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-xs text-zinc-600 font-light">
            Secure administrative access only
          </p>
        </div>
      </div>
    </div>
  );
}
