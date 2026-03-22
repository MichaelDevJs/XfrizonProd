import React, { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-toastify";
import { AuthContext } from "../../../context/AuthContext";
import authService from "../../../api/authService";

export default function Login() {
  const hasPartnerRole = (role, roles) => {
    if (role === "PARTNER") return true;
    const roleTokens = Array.isArray(roles)
      ? roles
      : String(roles || "")
          .split(",")
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean);
    return roleTokens.includes("PARTNER");
  };

  const getFallbackPathByRole = (role, roles) => {
    if (role === "ORGANIZER") return "/organizer/dashboard";
    if (hasPartnerRole(role, roles)) return "/partner-dashboard";
    return "/";
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  const handleGoogleLogin = () => {
    authService.startGoogleSignup({ accountType: "USER" });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      setLoading(false);
      toast.error(
        "Login request timed out. Please check your connection and try again.",
      );
    }, 8000); // 8 seconds

    try {
      // Call backend API through AuthContext
      const response = await loginUser(formData.email, formData.password);

      if (!didTimeout) {
        clearTimeout(timeoutId);
        if (response?.success) {
          if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
          }
          toast.success("Logged in successfully!");

          // Navigate based on user role after state settles
          setTimeout(() => {
            const from = location.state?.from;
            const fromPath = from?.pathname
              ? `${from.pathname}${from.search || ""}${from.hash || ""}`
              : null;
            const isFromLogin =
              from?.pathname === "/auth/login" ||
              from?.pathname === "/admin-login";

            const fallback = getFallbackPathByRole(
              response.role,
              response.roles,
            );

            navigate(!isFromLogin && fromPath ? fromPath : fallback, {
              replace: true,
            });
            setLoading(false);
          }, 300);
        } else if (response?.emailVerificationPending) {
          // Email not verified - redirect to verification page
          setLoading(false);
          toast.warning("Please verify your email to continue");
          setTimeout(() => {
            navigate("/verify-email", { 
              state: { email: formData.email } 
            });
          }, 500);
        } else {
          setLoading(false);
          toast.error(response?.message || "Login failed");
        }
      }
    } catch (error) {
      if (!didTimeout) {
        clearTimeout(timeoutId);
        if (error?.errors) {
          setErrors(error.errors);
        } else if (error?.message) {
          toast.error(error.message);
        } else {
          toast.error("Login failed. Please try again.");
        }
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-400 tracking-wider mb-2">
            XFRIZON
          </h1>
          <h2 className="text-2xl font-light text-gray-300">Welcome Back</h2>
          <p className="text-sm text-gray-500 font-light mt-2">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-light text-gray-400 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-lg text-white placeholder-gray-600 font-light text-sm transition-all duration-300 focus:outline-none ${
                errors.email
                  ? "border-red-500 focus:border-red-500"
                  : "border-zinc-800 hover:border-zinc-700 focus:border-red-500"
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1 font-light">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-xs font-light text-gray-400"
              >
                Password
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-xs text-gray-600 hover:text-red-500 transition-colors duration-300 font-light"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-lg text-white placeholder-gray-600 font-light text-sm transition-all duration-300 focus:outline-none pr-10 ${
                  errors.password
                    ? "border-red-500 focus:border-red-500"
                    : "border-zinc-800 hover:border-zinc-700 focus:border-red-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
              >
                {showPassword ? (
                  <FaEyeSlash className="w-4 h-4" />
                ) : (
                  <FaEye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1 font-light">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 bg-zinc-900 border border-zinc-800 rounded cursor-pointer accent-red-500"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 text-xs font-light text-gray-400 cursor-pointer"
            >
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-800 disabled:opacity-50 text-white py-2.5 rounded-lg transition-all duration-300 font-light text-sm mt-6"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 border-t border-zinc-800" />
          <span className="text-xs text-gray-600 font-light">or</span>
          <div className="flex-1 border-t border-zinc-800" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg transition-all duration-300 font-light text-sm border border-zinc-700"
        >
          <FcGoogle className="w-4 h-4" />
          Continue with Google
        </button>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-400 font-light">
            Don't have an account?{" "}
            <Link
              to="/auth/register"
              className="text-red-500 hover:text-red-400 transition-colors duration-300 font-light"
            >
              Sign Up
            </Link>
          </p>
        </div>

        {/* Organizer Link */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-600 font-light">
            Want to host events?{" "}
            <Link
              to="/auth/organizer-signup"
              className="text-gray-400 hover:text-red-500 transition-colors duration-300 font-light"
            >
              Organizer Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
