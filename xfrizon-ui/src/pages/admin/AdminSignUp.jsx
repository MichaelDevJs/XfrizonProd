import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaShieldAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios";

export default function AdminSignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminSecretKey: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
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

    if (!formData.adminSecretKey.trim()) {
      newErrors.adminSecretKey = "Admin secret key is required";
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
      const response = await api.post(
        "/auth/register-admin",
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        },
        {
          headers: {
            "X-Admin-Secret-Key": formData.adminSecretKey,
          },
        },
      );

      if (response?.data?.success) {
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem(
          "adminUser",
          JSON.stringify({
            id: response.data.userId,
            email: response.data.email,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            role: response.data.role,
          }),
        );

        toast.success("Admin account created successfully!");
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 500);
      } else {
        toast.error(response?.data?.message || "Registration failed");
        setLoading(false);
      }
    } catch (error) {
      console.error("Admin registration error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        "Registration failed. Please check your credentials.";
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
            Create Admin Account
          </h1>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Administrator Registration
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-950/70 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-zinc-900 border ${
                  errors.firstName ? "border-red-500" : "border-zinc-800"
                } rounded-lg text-white placeholder-zinc-600 font-light text-sm transition-all focus:outline-none hover:border-zinc-700 focus:border-[#403838]`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-zinc-900 border ${
                  errors.lastName ? "border-red-500" : "border-zinc-800"
                } rounded-lg text-white placeholder-zinc-600 font-light text-sm transition-all focus:outline-none hover:border-zinc-700 focus:border-[#403838]`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-zinc-900 border ${
                  errors.email ? "border-red-500" : "border-zinc-800"
                } rounded-lg text-white placeholder-zinc-600 font-light text-sm transition-all focus:outline-none hover:border-zinc-700 focus:border-[#403838]`}
                placeholder="admin@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-zinc-900 border ${
                    errors.password ? "border-red-500" : "border-zinc-800"
                  } rounded-lg text-white placeholder-zinc-600 font-light text-sm transition-all focus:outline-none hover:border-zinc-700 focus:border-[#403838] pr-10`}
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-zinc-900 border ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-zinc-800"
                  } rounded-lg text-white placeholder-zinc-600 font-light text-sm transition-all focus:outline-none hover:border-zinc-700 focus:border-[#403838] pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="w-4 h-4" />
                  ) : (
                    <FaEye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Admin Secret Key */}
            <div>
              <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                Admin Secret Key
              </label>
              <div className="relative">
                <input
                  type={showSecretKey ? "text" : "password"}
                  name="adminSecretKey"
                  value={formData.adminSecretKey}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-zinc-900 border ${
                    errors.adminSecretKey ? "border-red-500" : "border-zinc-800"
                  } rounded-lg text-white placeholder-zinc-600 font-light text-sm transition-all focus:outline-none hover:border-zinc-700 focus:border-[#403838] pr-10`}
                  placeholder="Enter admin secret key"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  {showSecretKey ? (
                    <FaEyeSlash className="w-4 h-4" />
                  ) : (
                    <FaEye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.adminSecretKey && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.adminSecretKey}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#403838] hover:bg-[#403838]/90 disabled:bg-[#403838]/50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg transition-all font-light text-sm uppercase tracking-wider mt-6"
            >
              {loading ? "Creating Account..." : "Create Admin Account"}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-500">
              Already have an account?{" "}
              <Link
                to="/admin-login"
                className="text-[#403838] hover:text-[#403838]/80 transition-colors"
              >
                Login here
              </Link>
            </p>
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
