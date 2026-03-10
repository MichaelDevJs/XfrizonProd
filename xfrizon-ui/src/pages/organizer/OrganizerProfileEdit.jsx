import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCamera,
  FaCheckCircle,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/axios";

export default function OrganizerProfileEdit() {
  const navigate = useNavigate();
  const { organizer: currentOrganizer, updateUser } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);
  const mediaInputRef = useRef(null);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(currentOrganizer?.logo);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(
    currentOrganizer?.coverPhoto || "",
  );
  const [mediaUpload, setMediaUpload] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: currentOrganizer?.firstName || currentOrganizer?.name || "",
    email: currentOrganizer?.email || "",
    phone: currentOrganizer?.phoneNumber || currentOrganizer?.phone || "",
    location: currentOrganizer?.location || "",
    address: currentOrganizer?.address || "",
    description: currentOrganizer?.bio || currentOrganizer?.description || "",
  });

  const persistedMediaCount = Array.isArray(currentOrganizer?.media)
    ? currentOrganizer.media.length
    : 0;
  const queuedVideoCount = mediaUpload.filter(
    (item) => item.type === "video",
  ).length;

  // Update form data when currentOrganizer changes
  useEffect(() => {
    if (currentOrganizer) {
      setFormData({
        name: currentOrganizer?.firstName || currentOrganizer?.name || "",
        email: currentOrganizer?.email || "",
        phone: currentOrganizer?.phoneNumber || currentOrganizer?.phone || "",
        location: currentOrganizer?.location || "",
        address: currentOrganizer?.address || "",
        description:
          currentOrganizer?.bio || currentOrganizer?.description || "",
      });
      setLogoPreview(
        currentOrganizer?.logo || currentOrganizer?.profilePicture,
      );
      setCoverPhotoPreview(currentOrganizer?.coverPhoto || "");
    }
  }, [
    currentOrganizer?.id,
    currentOrganizer?.email,
    currentOrganizer?.logo,
    currentOrganizer?.coverPhoto,
    currentOrganizer?.bio,
    currentOrganizer?.location,
    currentOrganizer?.address,
  ]);

  // Helper function to construct image URLs
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    // Ensure path starts with /
    const normalized = path.startsWith("/") ? path : `/${path}`;
    // Don't add /api/v1 to paths that already start with /api or /uploads
    if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
      return `http://localhost:8081${normalized}`;
    }
    return `http://localhost:8081/api/v1${normalized}`;
  };

  const postUploadWithFallback = async (endpoints, file) => {
    const baseUrl = String(api?.defaults?.baseURL || "");
    const origin = baseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

    const originCandidates = [];
    if (origin) {
      originCandidates.push(origin);
    }
    if (typeof window !== "undefined" && window.location?.origin) {
      originCandidates.push(window.location.origin.replace(/\/$/, ""));
    }
    if (import.meta.env.DEV) {
      originCandidates.push("http://localhost:8081");
    }

    const candidates = [];
    endpoints.forEach((endpoint) => {
      candidates.push(endpoint);
      if (endpoint.startsWith("/")) {
        originCandidates.forEach((candidateOrigin) => {
          if (candidateOrigin) {
            candidates.push(`${candidateOrigin}${endpoint}`);
          }
        });
      }
    });

    const uniqueCandidates = [...new Set(candidates)];
    let lastError = null;

    for (const url of uniqueCandidates) {
      try {
        const formDataToSend = new FormData();
        formDataToSend.append("file", file);

        const response = await api.post(url, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        });

        if (response?.data?.url) {
          return response.data.url;
        }
      } catch (error) {
        lastError = error;
        const status = error?.response?.status;
        if (
          status === 400 ||
          status === 404 ||
          status === 405 ||
          (typeof status === "number" && status >= 500)
        ) {
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error("Upload failed");
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo must be smaller than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
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

  // Handle cover photo upload
  const handleCoverPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Cover photo must be smaller than 10MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setCoverPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle media file uploads (multiple)
  const handleMediaUpload = (e) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast.warning(`${file.name} is too large (max 10MB)`);
          return;
        }
        if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/")
        ) {
          toast.warning(`${file.name} must be an image or video`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaUpload((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              file,
              type: file.type.startsWith("video/") ? "video" : "image",
              preview: reader.result,
              caption: "",
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeMediaFile = (id) => {
    setMediaUpload((prev) => prev.filter((item) => item.id !== id));
  };

  const updateMediaCaption = (id, caption) => {
    setMediaUpload((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption } : item)),
    );
  };

  const uploadOrganizerLogo = async () => {
    if (!logoFile) return null;

    try {
      return await postUploadWithFallback(
        ["/uploads/organizer-logo"],
        logoFile,
      );
    } catch (error) {
      console.error("Logo upload failed:", error);
      throw new Error("Failed to upload logo");
    }
  };

  // Upload cover photo
  const uploadCoverPhoto = async () => {
    if (!coverPhotoFile) return null;

    try {
      return await postUploadWithFallback(
        ["/uploads/cover-photo"],
        coverPhotoFile,
      );
    } catch (error) {
      console.error("Cover photo upload failed:", error);
      throw new Error("Failed to upload cover photo");
    }
  };

  // Upload media files
  const uploadMediaFiles = async () => {
    const uploadedMedia = [];

    for (const media of mediaUpload) {
      const mediaType =
        media.type ||
        (media.file?.type?.startsWith("video/") ? "video" : "image");

      const endpointsToTry =
        mediaType === "video"
          ? [
              `/organizers/${currentOrganizer?.id}/media`,
              "/uploads/upload",
              "/uploads/media",
            ]
          : [
              `/organizers/${currentOrganizer?.id}/media`,
              "/uploads/media",
              "/uploads/upload",
            ];

      let uploadedUrl = null;
      try {
        uploadedUrl = await postUploadWithFallback(endpointsToTry, media.file);
      } catch (error) {
        console.error("Media upload failed:", error);
        if (mediaType === "video") {
          throw new Error(
            "Failed to upload video. Ensure backend is running and supports organizer media upload.",
          );
        }
        throw new Error("Failed to upload media");
      }

      uploadedMedia.push({
        url: uploadedUrl,
        type: mediaType,
        caption: media.caption || "",
      });
    }

    return uploadedMedia;
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

    // Validate required fields
    console.log("Form submission - Location value:", formData.location);
    console.log("Location trimmed:", formData.location?.trim());
    console.log(
      "Is location empty?",
      !formData.location || formData.location.trim() === "",
    );

    if (!formData.location || formData.location.trim() === "") {
      console.error("Validation failed - Location is empty");
      toast.error(
        "Location is required. Please include your city and country (e.g., Berlin, Germany)",
      );
      setLoading(false);
      return;
    }

    try {
      let uploadedLogoUrl = null;
      let uploadedCoverUrl = null;
      let uploadedMedia = [];

      // Upload logo if provided
      if (logoFile) {
        uploadedLogoUrl = await uploadOrganizerLogo();
      }

      // Upload cover photo if provided
      if (coverPhotoFile) {
        uploadedCoverUrl = await uploadCoverPhoto();
      }

      // Upload media if provided
      if (mediaUpload.length > 0) {
        uploadedMedia = await uploadMediaFiles();
      }

      // Update organizer profile
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        address: formData.address,
        description: formData.description,
      };

      if (uploadedMedia.length > 0) {
        const existingMedia = Array.isArray(currentOrganizer?.media)
          ? currentOrganizer.media
          : [];
        updateData.media = [...existingMedia, ...uploadedMedia];
      }

      console.log("Update data being sent to API:", updateData);
      console.log("Location in update data:", updateData.location);

      if (uploadedLogoUrl) {
        updateData.logo = uploadedLogoUrl;
      }

      if (uploadedCoverUrl) {
        updateData.coverPhoto = uploadedCoverUrl;
      }

      const response = await api.put(
        `/organizers/${currentOrganizer.id}`,
        updateData,
      );

      console.log("API Response:", response.data);
      console.log("Response location:", response.data?.location);

      if (response.data) {
        // Update context with new organizer data
        if (updateUser) {
          const updatedUser = {
            ...currentOrganizer,
            ...response.data,
            // Ensure logo and profilePicture are synced
            logo:
              uploadedLogoUrl ||
              response.data.logo ||
              response.data.profilePicture ||
              currentOrganizer.logo,
            profilePicture:
              uploadedLogoUrl ||
              response.data.profilePicture ||
              response.data.logo ||
              currentOrganizer.profilePicture,
            coverPhoto:
              uploadedCoverUrl ||
              response.data.coverPhoto ||
              currentOrganizer.coverPhoto,
            media:
              response.data.media ||
              (uploadedMedia.length > 0
                ? [
                    ...(Array.isArray(currentOrganizer?.media)
                      ? currentOrganizer.media
                      : []),
                    ...uploadedMedia,
                  ]
                : currentOrganizer.media),
            // Include form data to ensure all fields are updated
            firstName: formData.name,
            name: formData.name,
            email: formData.email,
            phoneNumber: formData.phone,
            location: formData.location,
            address: formData.address,
            bio: formData.description,
          };
          console.log("Updated user object location:", updatedUser.location);
          updateUser(updatedUser);
        }

        toast.success("Profile updated successfully!");
        setTimeout(() => {
          navigate("/organizer/dashboard");
        }, 500);
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrganizer || currentOrganizer.role !== "ORGANIZER") {
    return (
      <div className="min-h-screen bg-[#1e1e1e] text-white flex items-center justify-center">
        <p className="text-gray-400">Only organizers can access this page</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-[#1e1e1e]/95 backdrop-blur border-b border-gray-700/50 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate("/organizer/dashboard")}
            className="flex items-center gap-2 text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            <FaArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-lg font-semibold">Edit Organization Profile</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Logo Section */}
          <div className="bg-[#1a1a1a] border border-gray-700/50 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-3">
              <FaCamera className="text-indigo-500" size={20} /> Organization
              Logo
            </h2>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Logo Preview */}
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <img
                    src={getImageUrl(logoPreview) || logoPreview}
                    alt="Logo preview"
                    className="w-32 h-32 rounded-lg object-cover border-2 border-indigo-600/50 shadow-lg"
                    onError={(e) => (e.target.src = "")}
                  />
                ) : currentOrganizer?.logo ||
                  currentOrganizer?.profilePicture ? (
                  <img
                    src={getImageUrl(
                      currentOrganizer?.logo ||
                        currentOrganizer?.profilePicture,
                    )}
                    alt={currentOrganizer?.name}
                    className="w-32 h-32 rounded-lg object-cover border-2 border-indigo-600/50 shadow-lg"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white text-4xl font-bold border-2 border-indigo-500/50 shadow-lg">
                    {currentOrganizer?.name?.charAt(0)?.toUpperCase() ||
                      currentOrganizer?.firstName?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Upload Section */}
              <div className="flex-1">
                <p className="text-gray-300 text-sm mb-4">
                  Click to upload your organization logo (Max 5MB. JPG, PNG, or
                  GIF)
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                >
                  <FaCamera size={16} />
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </button>
              </div>
            </div>
          </div>

          {/* Cover Photo Section */}
          <div className="bg-[#1a1a1a] border border-gray-700/50 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-3">
              <FaCamera className="text-indigo-500" size={20} /> Cover Photo
            </h2>

            <div>
              {coverPhotoPreview ? (
                <img
                  src={getImageUrl(coverPhotoPreview) || coverPhotoPreview}
                  alt="Cover preview"
                  className="w-full h-40 object-cover rounded-lg border border-indigo-600/50 mb-4"
                  onError={(e) => (e.target.src = "")}
                />
              ) : currentOrganizer?.coverPhoto ? (
                <img
                  src={getImageUrl(currentOrganizer?.coverPhoto)}
                  alt="Cover"
                  className="w-full h-40 object-cover rounded-lg border border-indigo-600/50 mb-4"
                  onError={(e) => (e.target.style.display = "none")}
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-r from-indigo-600/20 to-indigo-900/20 rounded-lg border border-indigo-600/30 mb-4 flex items-center justify-center text-gray-400">
                  No cover photo
                </div>
              )}
              <input
                type="file"
                ref={coverPhotoInputRef}
                onChange={handleCoverPhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverPhotoInputRef.current?.click()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-all text-sm"
              >
                {coverPhotoPreview
                  ? "Change Cover Photo"
                  : "Upload Cover Photo"}
              </button>
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-700/50 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="text-indigo-500">▪</span>
              Organization Information
            </h2>

            <div className="space-y-4">
              {/* Organization Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Organization Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600/50 focus:shadow-lg focus:shadow-indigo-600/10 transition-all text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600/50 focus:shadow-lg focus:shadow-indigo-600/10 transition-all text-sm"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600/50 focus:shadow-lg focus:shadow-indigo-600/10 transition-all text-sm"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Location / City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Berlin, Germany"
                  className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600/50 focus:shadow-lg focus:shadow-indigo-600/10 transition-all text-sm"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Required for payment processing. Please include your country
                  (e.g., Berlin, Germany).
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., 123 Main Street, Suite 100"
                  className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600/50 focus:shadow-lg focus:shadow-indigo-600/10 transition-all text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Organization Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell attendees about your organization..."
                  rows="4"
                  className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600/50 focus:shadow-lg focus:shadow-indigo-600/10 transition-all resize-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="bg-[#1a1a1a] border border-gray-700/50 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-3">
              <FaPlus className="text-indigo-500" /> Upload Media
            </h2>

            {import.meta.env.DEV && (
              <p className="text-xs text-amber-400 mb-4">
                DEV: Saved media = {persistedMediaCount}, queued upload ={" "}
                {mediaUpload.length}, queued videos = {queuedVideoCount}
              </p>
            )}

            {/* Upload Button */}
            <input
              type="file"
              ref={mediaInputRef}
              onChange={handleMediaUpload}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all text-sm mb-6"
            >
              <FaPlus size={14} className="inline mr-2" />
              Add Media Files (Image or Video)
            </button>

            {/* Media Preview */}
            {mediaUpload.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300">
                  Files to Upload ({mediaUpload.length})
                </h3>
                {mediaUpload.map((media) => (
                  <div
                    key={media.id}
                    className="bg-[#0f0f0f] border border-gray-700/50 rounded-lg p-4"
                  >
                    <div className="flex gap-4">
                      {media.type === "video" ? (
                        <video
                          src={media.preview}
                          className="w-20 h-20 rounded object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={media.preview}
                          alt="media"
                          className="w-20 h-20 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={media.caption}
                          onChange={(e) =>
                            updateMediaCaption(media.id, e.target.value)
                          }
                          placeholder="Add caption..."
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700/50 rounded text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600/50 mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeMediaFile(media.id)}
                          className="flex items-center gap-2 px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded text-xs"
                        >
                          <FaTrash size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-4 justify-end pt-4 border-t border-gray-700/50">
            <button
              type="button"
              onClick={() => navigate("/organizer/dashboard")}
              className="px-5 py-2 border border-gray-700/50 rounded-lg text-gray-400 hover:text-gray-200 hover:border-gray-600/50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
            >
              <FaCheckCircle size={14} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
