import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import authService from "../../../api/authService";

export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errors, setErrors] = useState("");

  // Redirect if email not provided
  if (!email) {
    navigate("/register");
    return null;
  }

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);
    if (errors) setErrors("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      setErrors("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyEmail(email, parseInt(verificationCode));

      if (response?.success) {
        toast.success("Email verified successfully!");
        setTimeout(() => {
          navigate("/login", { state: { email } });
        }, 1500);
      } else {
        setErrors(response?.message || "Verification failed. Please try again.");
        toast.error(response?.message || "Verification failed");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error verifying email";
      setErrors(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const response = await authService.resendVerification(email);

      if (response?.success) {
        toast.success("Verification code sent to your email");
        setVerificationCode("");
        setErrors("");
      } else {
        toast.error(response?.message || "Failed to resend verification code");
      }
    } catch (error) {
      toast.error("Error resending verification code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-400 text-sm">
              We sent a 6-digit code to<br />
              <span className="font-semibold text-white">{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Verification Code Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={handleChange}
                placeholder="000000"
                maxLength="6"
                className={`w-full px-4 py-3 text-center text-2xl font-bold tracking-widest rounded-lg border-2 bg-gray-800 text-white placeholder-gray-600 focus:outline-none transition ${
                  errors
                    ? "border-red-500"
                    : "border-gray-700 focus:border-green-500"
                }`}
              />
              {errors && (
                <p className="text-red-400 text-sm mt-2">{errors}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                Enter the 6-digit code from your email
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition transform hover:scale-105 active:scale-95"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-green-500 hover:text-green-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {resendLoading ? "Sending..." : "Resend"}
              </button>
            </p>
          </div>

          {/* Return to Login */}
          <div className="mt-6 text-center border-t border-gray-800 pt-6">
            <p className="text-gray-400 text-sm">
              Already verified?{" "}
              <a href="/login" className="text-green-500 hover:text-green-400 font-semibold">
                Go to Login
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 Xfrizon. All rights reserved.
        </p>
      </div>
    </div>
  );
}
