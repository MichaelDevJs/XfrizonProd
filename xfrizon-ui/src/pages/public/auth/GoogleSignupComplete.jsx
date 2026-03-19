import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../../context/AuthContext";
import authService from "../../../api/authService";

const ACCOUNT_TYPE_OPTIONS = ["USER", "ORGANIZER"];

const normalizeAccountType = (value) => {
  const nextValue = String(value || "").toUpperCase();
  return ACCOUNT_TYPE_OPTIONS.includes(nextValue) ? nextValue : "USER";
};

const parseBoolean = (value) => {
  const normalized = String(value || "").toLowerCase();
  return ["1", "true", "yes"].includes(normalized);
};

export default function GoogleSignupComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const { applyAuthSession } = useContext(AuthContext);

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [formData, setFormData] = useState({
    firstName: query.get("firstName") || "",
    lastName: query.get("lastName") || "",
    email: query.get("email") || "",
    accountType: normalizeAccountType(query.get("accountType") || query.get("role")),
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const tokenFromQuery = query.get("token") || query.get("accessToken") || "";
  const signupToken = query.get("signupToken") || "";
  const completionRequired =
    parseBoolean(query.get("needsProfileCompletion")) ||
    parseBoolean(query.get("isNewUser")) ||
    parseBoolean(query.get("signup"));

  useEffect(() => {
    if (tokenFromQuery) {
      localStorage.setItem("userToken", tokenFromQuery);
    }
  }, [tokenFromQuery]);

  const validate = () => {
    const nextErrors = {};

    if (!formData.firstName.trim()) {
      nextErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      nextErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Invalid email format";
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "accountType" ? normalizeAccountType(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const routeToDashboard = (role) => {
    if (String(role || "").toUpperCase() === "ORGANIZER") {
      navigate("/organizer/dashboard", { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  useEffect(() => {
    // If backend already finalized account and sent profile data, we can complete sign-in immediately.
    const hasProfileData = formData.firstName && formData.lastName && formData.email;
    if (!completionRequired && hasProfileData && tokenFromQuery) {
      applyAuthSession({
        token: tokenFromQuery,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.accountType,
      });
      routeToDashboard(formData.accountType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionRequired, tokenFromQuery]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (!signupToken) {
        throw new Error("Google signup token is missing. Please try again.");
      }

      const response = await authService.completeGoogleSignup({
        signupToken,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        role: formData.accountType,
      });

      if (!response?.success) {
        throw response;
      }

      applyAuthSession(response);
      toast.success("Google sign up completed");
      routeToDashboard(response.role || formData.accountType);
    } catch (error) {
      toast.error(error?.message || "Could not complete Google sign up");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-gray-300">Complete Sign Up</h2>
          <p className="text-sm text-gray-500 font-light mt-2">
            Confirm your details to finish creating your Google account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="accountType" className="block text-xs font-light text-gray-400 mb-2">
              Account Type
            </label>
            <select
              id="accountType"
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
            >
              <option value="USER">User</option>
              <option value="ORGANIZER">Organizer</option>
            </select>
          </div>

          <div>
            <label htmlFor="firstName" className="block text-xs font-light text-gray-400 mb-2">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
            />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-xs font-light text-gray-400 mb-2">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
            />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-light text-gray-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-transparent hover:bg-zinc-900/40 disabled:opacity-50 text-red-500 py-2.5 rounded-lg transition-all duration-300 font-light text-sm mt-2 border border-zinc-700"
          >
            {submitting ? "Finishing..." : "Finish Sign Up"}
          </button>
        </form>

        <div className="text-center mt-5">
          <Link to="/auth/login" className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
