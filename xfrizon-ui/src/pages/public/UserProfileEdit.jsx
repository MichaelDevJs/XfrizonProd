import { useContext, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCamera,
  FaSave,
  FaGlobe,
  FaInstagram,
  FaTwitter,
} from "react-icons/fa";
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
    if (path.startsWith("http")) return path;
    // Ensure path starts with /
    const normalized = path.startsWith("/") ? path : `/${path}`;
    // Don't add /api/v1 to paths that already start with /api or /uploads
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

  const uploadProfilePhoto = async () => {
    if (!profilePhoto) return null;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", profilePhoto);

      const response = await api.post(
        "/uploads/profile-photo",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        },
      );

      return response.data.url;
    } catch (error) {
      console.error("Photo upload failed:", error);
      throw new Error("Failed to upload profile photo");
    }
  };

  const uploadCoverPhoto = async () => {
    if (!coverPhoto) return null;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", coverPhoto);

      const response = await api.post("/uploads/cover-photo", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      return response.data.url;
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
          navigate(`/profile`);
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
      {/* Sticky Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur border-b border-zinc-800 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(`/profile`)}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft size={18} />
            <span className="hidden md:inline">Back</span>
          </button>
          <h1 className="text-lg font-light uppercase tracking-widest hidden md:block">
            Edit Profile
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="text-sm leading-relaxed">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-8 space-y-6">
              {/* Cover Photo Section */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="relative h-48 bg-zinc-900 overflow-hidden group">
                  {coverPhotoPreview ? (
                    <img
                      src={getImageUrl(coverPhotoPreview)}
                      alt="Cover preview"
                      className="w-full h-full object-cover opacity-40"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-zinc-900 via-black to-zinc-900" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
                <p className="text-xs text-gray-500 p-3">
                  Recommended size: 1200x400px.
                </p>
              </div>

              {/* Profile Photo */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-base font-light uppercase tracking-widest mb-6 text-white">
                  Profile Photo
                </h2>

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
                    className="group rounded-full"
                    title="Change photo"
                    aria-label="Change photo"
                  >
                    {photoPreview ? (
                      <img
                        src={getImageUrl(photoPreview)}
                        alt="Profile preview"
                        className="w-32 h-32 rounded-full object-cover ring-4 ring-xf-accent shadow-xl transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = "/assets/african-panther-dark.svg";
                        }}
                      />
                    ) : (
                      <img
                        src="/assets/african-panther-dark.svg"
                        alt="Profile placeholder"
                        className="w-32 h-32 rounded-full object-cover ring-4 ring-zinc-800 shadow-xl transition-transform duration-200 group-hover:scale-105"
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
                <h2 className="text-base font-light uppercase tracking-widest mb-6 text-white">
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
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-base font-light uppercase tracking-widest mb-6 text-white">
                  Social Links
                </h2>

                <div className="space-y-4">
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

            <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-24">
              {/* Music Preferences */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-base font-light uppercase tracking-widest mb-6 text-white">
                  Music Preferences
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-light uppercase tracking-wide text-gray-300 mb-2">
                      Favorite Artists
                    </label>
                    <input
                      type="text"
                      name="favoriteArtists"
                      value={formData.favoriteArtists}
                      onChange={handleChange}
                      placeholder="e.g., Burna Boy, Wizkid, Rema"
                      className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-gray-500 focus:outline-none focus:border-xf-accent transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Separate multiple artists with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-light uppercase tracking-wide text-gray-300 mb-2">
                      Music Interests
                    </label>
                    <input
                      type="text"
                      name="musicInterests"
                      value={formData.musicInterests}
                      onChange={handleChange}
                      placeholder="e.g., Afrobeats, Hip-Hop, R&B"
                      className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-gray-500 focus:outline-none focus:border-xf-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-light uppercase tracking-wide text-gray-300 mb-2">
                      Event Interests
                    </label>
                    <input
                      type="text"
                      name="partyInterests"
                      value={formData.partyInterests}
                      onChange={handleChange}
                      placeholder="e.g., Concerts, Festivals, Nightclubs"
                      className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-gray-500 focus:outline-none focus:border-xf-accent transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-11 px-6 py-2.5 bg-xf-accent hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all font-light uppercase tracking-wide text-xs inline-flex items-center justify-center gap-2"
                  >
                    <FaSave size={16} />
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/profile`)}
                    className="w-full min-h-11 px-6 py-2.5 border border-zinc-800 rounded-lg text-gray-300 hover:text-white hover:border-zinc-700 transition-colors font-light uppercase tracking-wide text-xs inline-flex items-center justify-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
