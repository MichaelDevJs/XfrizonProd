import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-toastify";
import { AuthContext } from "../../../context/AuthContext";
import authService from "../../../api/authService";

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useContext(AuthContext);

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

  const handleGoogleSignup = () => {
    authService.startGoogleSignup({ accountType: "USER" });
  };

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
    try {
      // Call backend API through AuthContext
      const response = await registerUser(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
      );

      if (response?.success) {
        toast.success("Account created successfully!");
        setLoading(false);
        // Delay navigation to allow toast to display
        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        setLoading(false);
        toast.error(response?.message || "Registration failed");
      }
    } catch (error) {
      setLoading(false);
      if (error?.errors) {
        setErrors(error.errors);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-gray-300">Create Account</h2>
          <p className="text-sm text-gray-500 font-light mt-2">
            Join us to discover amazing live events
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
              placeholder="Afro"
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
              placeholder="Nation"
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
              placeholder="afro.nation@xfrizon.com"
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
            className="w-full bg-transparent hover:bg-zinc-900/40 disabled:opacity-50 text-red-500 py-2.5 rounded-lg transition-all duration-300 font-light text-sm mt-6 border border-zinc-700"
          >
            {loading ? "Creating Account..." : "Sign Up"}
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
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg transition-all duration-300 font-light text-sm border border-zinc-700"
        >
          <FcGoogle className="w-4 h-4" />
          Continue with Google
        </button>

        {/* Login Link */}
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

        {/* Organizer Link */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-600 font-light">
            Want to host events?{" "}
            <Link
              to="/auth/organizer-signup"
              className="text-gray-400 hover:text-red-500 transition-colors duration-300 font-light"
            >
              Become an Organizer
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
