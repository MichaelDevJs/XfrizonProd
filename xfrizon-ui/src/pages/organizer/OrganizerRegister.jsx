import { useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";
import { FaUpload, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios";

const OrganizerRegister = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file");
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;

    try {
      const formData = new FormData();
      formData.append("file", logoFile);

      const response = await api.post("/uploads/organizer-logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.url;
    } catch (err) {
      console.error("Error uploading logo:", err);
      toast.error("Failed to upload logo");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload logo first if provided
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await uploadLogo();
        if (!logoUrl) {
          setError("Failed to upload logo");
          setLoading(false);
          return;
        }
      }

      // Create organizer account
      const registerData = {
        firstName: form.name.split(" ")[0] || form.name,
        lastName: form.name.split(" ").slice(1).join(" ") || "",
        email: form.email,
        password: form.password,
        profilePicture: logoUrl || null,
        role: "ORGANIZER",
      };

      const res = await api.post("/auth/register", registerData);

      toast.success("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/organizer/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data || "Registration failed");
      toast.error(err.response?.data || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black text-white p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-6 w-full max-w-md"
      >
        <div className="text-center">
          <h2 className="text-3xl font-light mb-2">Create Organizer Account</h2>
          <p className="text-gray-400 text-sm font-light">
            Set up your organizer profile to start creating events
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-sm font-light">
            {error}
          </div>
        )}

        {/* Logo Upload Section */}
        <div className="space-y-3">
          <label className="block text-sm font-light text-gray-300">
            Organizer Logo (Optional)
          </label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-red-500"
                />
                <FaCheckCircle className="absolute -top-2 -right-2 w-5 h-5 text-green-500 bg-black rounded-full" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-dashed border-gray-700 flex items-center justify-center">
                <FaUpload className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
              <div className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded transition-colors text-center text-sm font-light">
                {logoPreview ? "Change Logo" : "Upload Logo"}
              </div>
            </label>
          </div>
          <p className="text-xs text-gray-500 font-light">
            PNG, JPG or GIF (max 5MB). Square format recommended.
          </p>
        </div>

        <input
          type="text"
          placeholder="Organization Name"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none transition-colors font-light"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none transition-colors font-light"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none transition-colors font-light"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white p-3 rounded-lg font-light transition-colors duration-300"
        >
          {loading ? "Registering..." : "Create Account"}
        </button>

        <p className="text-center text-gray-400 text-sm font-light">
          Already have an account?{" "}
          <a
            href="/organizer/login"
            className="text-red-500 hover:text-red-400"
          >
            Login here
          </a>
        </p>
      </form>
    </div>
  );
};

export default OrganizerRegister;
