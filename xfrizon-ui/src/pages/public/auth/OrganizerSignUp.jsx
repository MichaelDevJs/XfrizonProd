import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import authService from "../../../api/authService";

const getDisplayErrorMessage = (
  payload,
  fallback = "Registration failed. Please try again.",
) => {
  const isValidString = (value) => {
    if (typeof value !== "string") {
      return false;
    }

    const normalized = value.trim();
    if (!normalized) {
      return false;
    }

    const lowered = normalized.toLowerCase();
    return !["false", "null", "undefined"].includes(lowered);
  };

  if (isValidString(payload)) {
    return payload.trim();
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const message = getDisplayErrorMessage(item, "");
      if (message) {
        return message;
      }
    }
    return fallback;
  }

  if (payload && typeof payload === "object") {
    const messageCandidates = [payload.message, payload.error, payload.details];

    for (const candidate of messageCandidates) {
      const message = getDisplayErrorMessage(candidate, "");
      if (message) {
        return message;
      }
    }
  }

  return fallback;
};

export default function OrganizerSignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    try {
      const response = await authService.registerOrganizer(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
      );

      if (response?.success) {
        // Store token and user info
        localStorage.setItem("userToken", response.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: response.userId,
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
            role: response.role,
          }),
        );

        const referralCode = (localStorage.getItem("xfrizon_referral") || "").trim();
        if (referralCode) {
          localStorage.removeItem("xfrizon_referral");
        }

        toast.success("Organizer account created successfully!");
        setTimeout(() => {
          navigate("/organizer/dashboard");
        }, 500);
      } else {
        setLoading(false);
        toast.error(getDisplayErrorMessage(response, "Registration failed"));
      }
    } catch (error) {
      if (error?.errors) {
        setErrors(error.errors);
      } else {
        toast.error(getDisplayErrorMessage(error));
      }
      setLoading(false);
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
          <h2 className="text-2xl font-light text-gray-300">
            Organizer SignUp
          </h2>
          <p className="text-sm text-gray-500 font-light mt-2">
            Create an account to start hosting events
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First Name */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-xs font-light text-gray-400 mb-2"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-lg text-white placeholder-gray-600 font-light text-sm transition-all duration-300 focus:outline-none ${
                errors.firstName
                  ? "border-red-500 focus:border-red-500"
                  : "border-zinc-800 hover:border-zinc-700 focus:border-red-500"
              }`}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 mt-1 font-light">
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-xs font-light text-gray-400 mb-2"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-lg text-white placeholder-gray-600 font-light text-sm transition-all duration-300 focus:outline-none ${
                errors.lastName
                  ? "border-red-500 focus:border-red-500"
                  : "border-zinc-800 hover:border-zinc-700 focus:border-red-500"
              }`}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500 mt-1 font-light">
                {errors.lastName}
              </p>
            )}
          </div>

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
              placeholder="organizer@example.com"
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
            <label
              htmlFor="password"
              className="block text-xs font-light text-gray-400 mb-2"
            >
              Password
            </label>
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

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-light text-gray-400 mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 bg-zinc-900 border rounded-lg text-white placeholder-gray-600 font-light text-sm transition-all duration-300 focus:outline-none pr-10 ${
                  errors.confirmPassword
                    ? "border-red-500 focus:border-red-500"
                    : "border-zinc-800 hover:border-zinc-700 focus:border-red-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="w-4 h-4" />
                ) : (
                  <FaEye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1 font-light">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-800 disabled:opacity-50 text-white py-2.5 rounded-lg transition-all duration-300 font-light text-sm mt-6"
          >
            {loading ? "Creating Account..." : "Create Organizer Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 border-t border-zinc-800" />
          <span className="text-xs text-gray-600 font-light">or</span>
          <div className="flex-1 border-t border-zinc-800" />
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-400 font-light">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              className="text-red-500 hover:text-red-400 transition-colors duration-300 font-light"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* User Registration Link */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-600 font-light">
            Looking for a regular account?{" "}
            <Link
              to="/auth/register"
              className="text-gray-400 hover:text-red-500 transition-colors duration-300 font-light"
            >
              User Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
