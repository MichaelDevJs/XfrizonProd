import { useContext, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCamera,
  FaSave,
  FaGlobe,
  FaInstagram,
  FaTwitter,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/axios";

export default function UserProfileEdit() {
  const navigate = useNavigate();
  const { organizer: currentUser, updateUser } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);

  // Helper function to construct image URLs
  const getImageUrl = (path) => {
    if (!path) return null;
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:") ||
      path.startsWith("blob:")
    )
      return path;
    // Ensure path starts with /
    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (import.meta.env.PROD) {
      return normalized;
    }
    if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
      return `http://localhost:8081${normalized}`;
    }
    return `http://localhost:8081/api/v1${normalized}`;
  };

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(currentUser?.profilePicture);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(
    currentUser?.coverPhoto || null,
  );
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    email: currentUser?.email || "",
    bio: currentUser?.bio || "",
    location: currentUser?.location || "",
    phone: currentUser?.phone || "",
    website: currentUser?.website || "",
    instagram: currentUser?.instagram || "",
    twitter: currentUser?.twitter || "",
    favoriteArtists: currentUser?.favoriteArtists?.join(", ") || "",
    musicInterests: currentUser?.musicInterests?.join(", ") || "",
    partyInterests: currentUser?.partyInterests?.join(", ") || "",
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setCoverPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const postUploadWithFallback = async (endpoint, file) => {
    const baseUrl = String(api?.defaults?.baseURL || "");
    const origin = baseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

    const originCandidates = [];
    if (origin && !origin.startsWith("/")) originCandidates.push(origin);
    if (typeof window !== "undefined" && window.location?.origin) {
      originCandidates.push(window.location.origin.replace(/\/$/, ""));
    }
    if (import.meta.env.DEV) originCandidates.push("http://localhost:8081");

    const candidates = [
      ...new Set(originCandidates.map((o) => `${o}${endpoint}`)),
    ];
    const token =
      localStorage.getItem("userToken") || localStorage.getItem("adminToken");
    let lastError = null;

    for (const url of candidates) {
      try {
        const formDataToSend = new FormData();
        formDataToSend.append("file", file);
        const headers = { "Content-Type": "multipart/form-data" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await axios.post(url, formDataToSend, {
          headers,
          timeout: 30000,
        });
        if (response?.data?.url) return response.data.url;
      } catch (error) {
        lastError = error;
        const status = error?.response?.status;
        if (
          status === 400 ||
          status === 404 ||
          status === 405 ||
          (typeof status === "number" && status >= 500)
        )
          continue;
        throw error;
      }
    }
    throw lastError || new Error("Upload failed");
  };

  const uploadProfilePhoto = async () => {
    if (!profilePhoto) return null;
    try {
      return await postUploadWithFallback(
        "/uploads/profile-photo",
        profilePhoto,
      );
    } catch (error) {
      console.error("Photo upload failed:", error);
      throw new Error("Failed to upload profile photo");
    }
  };

  const uploadCoverPhoto = async () => {
    if (!coverPhoto) return null;
    try {
      return await postUploadWithFallback("/uploads/cover-photo", coverPhoto);
    } catch (error) {
      console.error("Cover photo upload failed:", error);
      throw new Error("Failed to upload cover photo");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload photos if provided
      let uploadedPhotoUrl = null;
      let uploadedCoverUrl = null;

      if (profilePhoto) {
        uploadedPhotoUrl = await uploadProfilePhoto();
      }

      if (coverPhoto) {
        uploadedCoverUrl = await uploadCoverPhoto();
      }

      // Update user profile
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        website: formData.website,
        instagram: formData.instagram,
        twitter: formData.twitter,
        favoriteArtists: formData.favoriteArtists
          .split(",")
          .map((artist) => artist.trim())
          .filter((artist) => artist),
        musicInterests: formData.musicInterests
          .split(",")
          .map((interest) => interest.trim())
          .filter((interest) => interest),
        partyInterests: formData.partyInterests
          .split(",")
          .map((interest) => interest.trim())
          .filter((interest) => interest),
      };

      if (uploadedPhotoUrl) {
        updateData.profilePicture = uploadedPhotoUrl;
      }

      if (uploadedCoverUrl) {
        updateData.coverPhoto = uploadedCoverUrl;
      }

      const response = await api.put(`/auth/user`, updateData);

      if (response.data) {
        // Update context with new user data
        if (updateUser) {
          updateUser({
            ...currentUser,
            ...response.data,
            profilePicture: uploadedPhotoUrl || currentUser.profilePicture,
            coverPhoto: uploadedCoverUrl || currentUser.coverPhoto,
          });
        }

        toast.success("Profile updated successfully!");
        setTimeout(() => {
          const updatedUserId = response.data?.id || currentUser?.id;
          if (updatedUserId) {
            navigate(`/user/${updatedUserId}`);
            return;
          }
          navigate(-1);
        }, 500);
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Please log in to edit your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-light">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="text-sm leading-relaxed">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-8 space-y-6">
              {/* Profile Photo */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-base font-light uppercase tracking-widest mb-6 text-white text-center">
                  Profile
                </h2>

                <div className="overflow-hidden mb-6 border border-zinc-800">
                  <div className="relative h-48 bg-black overflow-hidden group">
                    {coverPhotoPreview && (
                      <img
                        src={getImageUrl(coverPhotoPreview)}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-opacity ${coverPhotoPreview ? "bg-black/40 opacity-0 group-hover:opacity-100" : "opacity-100"}`}
                    >
                      <button
                        type="button"
                        onClick={() => coverPhotoInputRef.current?.click()}
                        className="flex items-center gap-2 bg-xf-accent hover:brightness-110 text-white px-5 py-2.5 rounded-lg transition-all font-light uppercase tracking-wide text-xs"
                      >
                        <FaCamera size={16} />
                        {coverPhotoPreview ? "Change Cover" : "Upload Cover"}
                      </button>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={coverPhotoInputRef}
                    onChange={handleCoverPhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="flex justify-center mb-8">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group rounded-2xl"
                    title="Change photo"
                    aria-label="Change photo"
                  >
                    {photoPreview ? (
                      <img
                        src={getImageUrl(photoPreview)}
                        alt="Profile preview"
                        className="w-32 h-32 rounded-2xl object-cover shadow-xl transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src =
                            "/assets/african-panther-dark.svg";
                        }}
                      />
                    ) : (
                      <img
                        src="/assets/african-panther-dark.svg"
                        alt="Profile placeholder"
                        className="w-32 h-32 rounded-2xl object-cover shadow-xl transition-transform duration-200 group-hover:scale-105"
                      />
                    )}
                  </button>
                </div>

                <div className="space-y-4 border-t border-zinc-800 pt-6">
                  <h3 className="text-xs font-light uppercase tracking-widest text-gray-300">
                    Basic Info
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-light uppercase tracking-wide text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-gray-500 focus:outline-none focus:border-xf-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-light uppercase tracking-wide text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-gray-500 focus:outline-none focus:border-xf-accent transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-light uppercase tracking-wide text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-light text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Email cannot be changed
                    </p>
                  </div>
                </div>
              </div>

              {/* About & Location */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-sm font-light uppercase tracking-widest mb-6 text-white">
                  About & Location
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-light uppercase tracking-wide text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell people about yourself..."
                      maxLength={300}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-gray-500 focus:outline-none focus:border-xf-accent transition-colors resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      {formData.bio.length}/300 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-light uppercase tracking-wide text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Lagos, Nigeria"
                        className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-gray-500 focus:outline-none focus:border-xf-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-light uppercase tracking-wide text-gray-300 mb-2">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+234 123 456 7890"
                        className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-gray-500 focus:outline-none focus:border-xf-accent transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-zinc-800 space-y-4">
                    <h3 className="text-xs font-light uppercase tracking-widest text-gray-300">
                      Social Links
                    </h3>
                    <div>
                      <label className="text-xs font-light uppercase tracking-wide text-gray-300 mb-2 flex items-center gap-2">
                        <FaGlobe className="text-xf-accent" />
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://yourwebsite.com"
                        className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-gray-500 focus:outline-none focus:border-xf-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-light uppercase tracking-wide text-gray-300 mb-2 flex items-center gap-2">
                        <FaInstagram className="text-xf-accent" />
                        Instagram
                      </label>
                      <input
                        type="text"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        placeholder="@yourusername or full URL"
                        className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-gray-500 focus:outline-none focus:border-xf-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-light uppercase tracking-wide text-gray-300 mb-2 flex items-center gap-2">
                        <FaTwitter className="text-xf-accent" />
                        Twitter / X
                      </label>
                      <input
                        type="text"
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleChange}
                        placeholder="@yourusername or full URL"
                        className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-gray-500 focus:outline-none focus:border-xf-accent transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 xl:sticky xl:top-24">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-11 px-6 py-2.5 bg-xf-accent border border-zinc-700 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all font-light uppercase tracking-wide text-xs inline-flex items-center justify-center gap-2"
              >
                <FaSave size={16} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
