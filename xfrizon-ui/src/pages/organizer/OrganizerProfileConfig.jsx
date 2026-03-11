import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaCamera,
  FaSave,
  FaStore,
  FaMapMarkerAlt,
  FaPhone,
  FaGlobe,
  FaInstagram,
  FaTwitter,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import OrganizerCoverSlideshow from "../../component/organizer/OrganizerCoverSlideshow";

const VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".m4v",
  ".avi",
  ".mkv",
];

const getMediaUrl = (path) => {
  if (!path) return null;
  if (String(path).startsWith("http") || String(path).startsWith("data:")) {
    return path;
  }

  const normalized = String(path).startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
    return `http://localhost:8081${normalized}`;
  }

  return `http://localhost:8081/api/v1${normalized}`;
};

const isVideoMedia = (value) => {
  if (!value) return false;
  const normalized = String(value).toLowerCase();
  if (normalized.startsWith("data:video/")) return true;
  return VIDEO_EXTENSIONS.some((ext) => normalized.includes(ext));
};

const OrganizerProfileConfig = () => {
  const { organizer: currentOrganizer, updateUser } = useContext(AuthContext);
  const logoInputRef = useRef(null);
  const coverSlideInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(currentOrganizer?.logo || "");

  // Cover slides: [{ id, url, type, file|null, isNew }]
  const [coverSlides, setCoverSlides] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);

  const [formData, setFormData] = useState({
    name: currentOrganizer?.name || currentOrganizer?.firstName || "",
    description: currentOrganizer?.bio || currentOrganizer?.description || "",
    email: currentOrganizer?.email || "",
    phone: currentOrganizer?.phoneNumber || currentOrganizer?.phone || "",
    location: currentOrganizer?.location || "",
    address: currentOrganizer?.address || "",
    website: currentOrganizer?.website || currentOrganizer?.url || "",
    instagram: currentOrganizer?.instagram || "",
    twitter: currentOrganizer?.twitter || currentOrganizer?.x || "",
  });

  useEffect(() => {
    if (!currentOrganizer) return;
    setLogoPreview(
      currentOrganizer?.logo || currentOrganizer?.profilePicture || "",
    );
    const coverMediaStorageKey = currentOrganizer?.id
      ? `organizerCoverMedia:${currentOrganizer.id}`
      : null;

    // Initialise cover slides from coverMedia JSON, then fall back to coverPhoto
    const initSlides = [];
    const rawCoverMedia =
      currentOrganizer?.coverMedia ||
      (coverMediaStorageKey
        ? localStorage.getItem(coverMediaStorageKey)
        : null);

    if (rawCoverMedia) {
      try {
        const parsed =
          typeof rawCoverMedia === "string"
            ? JSON.parse(rawCoverMedia)
            : rawCoverMedia;
        if (Array.isArray(parsed)) {
          parsed.forEach((item, i) => {
            const url = typeof item === "string" ? item : item.url;
            const type =
              typeof item === "string"
                ? isVideoMedia(item)
                  ? "video"
                  : "image"
                : item.type || (isVideoMedia(item.url) ? "video" : "image");
            initSlides.push({
              id: `existing-${i}`,
              url,
              type,
              file: null,
              isNew: false,
            });
          });
        }
      } catch (_) {}
    }
    if (initSlides.length === 0 && currentOrganizer?.coverPhoto) {
      const url = currentOrganizer.coverPhoto;
      initSlides.push({
        id: "existing-cp",
        url,
        type: isVideoMedia(url) ? "video" : "image",
        file: null,
        isNew: false,
      });
    }
    setCoverSlides(initSlides);

    const rawGallery = currentOrganizer?.media;
    let parsedGallery = [];

    try {
      if (Array.isArray(rawGallery)) {
        parsedGallery = rawGallery;
      } else if (typeof rawGallery === "string" && rawGallery.trim()) {
        parsedGallery = JSON.parse(rawGallery);
      }
    } catch (_) {
      parsedGallery = [];
    }

    setGalleryItems(
      (Array.isArray(parsedGallery) ? parsedGallery : [])
        .filter((item) => item && item.url)
        .map((item, i) => ({
          id: `existing-media-${i}`,
          url: item.url,
          type: item.type || (isVideoMedia(item.url) ? "video" : "image"),
          caption: item.caption || "",
          file: null,
          isNew: false,
        })),
    );

    setFormData({
      name: currentOrganizer?.name || currentOrganizer?.firstName || "",
      description: currentOrganizer?.bio || currentOrganizer?.description || "",
      email: currentOrganizer?.email || "",
      phone: currentOrganizer?.phoneNumber || currentOrganizer?.phone || "",
      location: currentOrganizer?.location || "",
      address: currentOrganizer?.address || "",
      website: currentOrganizer?.website || currentOrganizer?.url || "",
      instagram: currentOrganizer?.instagram || "",
      twitter: currentOrganizer?.twitter || currentOrganizer?.x || "",
    });
  }, [currentOrganizer]);

  const organizerId = currentOrganizer?.id;

  const profilePath = useMemo(() => {
    return organizerId
      ? `/organizer/profile/${organizerId}`
      : "/organizer/profile";
  }, [organizerId]);

  const postUploadWithFallback = async (endpoints, file) => {
    const baseUrl = String(api?.defaults?.baseURL || "");
    const origin = baseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

    const originCandidates = [];
    if (origin) originCandidates.push(origin);
    if (typeof window !== "undefined" && window.location?.origin) {
      originCandidates.push(window.location.origin.replace(/\/$/, ""));
    }
    if (import.meta.env.DEV) {
      originCandidates.push("http://localhost:8081");
    }

    const candidates = [];
    endpoints.forEach((endpoint) => {
      // Add absolute URL candidates only (no relative paths)
      originCandidates.forEach((candidateOrigin) => {
        candidates.push(`${candidateOrigin}${endpoint}`);
      });
    });

    const uniqueCandidates = [...new Set(candidates)];
    let lastError = null;

    // Get auth token from localStorage
    const token =
      localStorage.getItem("userToken") || localStorage.getItem("adminToken");

    for (const url of uniqueCandidates) {
      try {
        const payload = new FormData();
        payload.append("file", file);

        // Use axios directly with auth header
        const headers = { "Content-Type": "multipart/form-data" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.post(url, payload, {
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
        ) {
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error("Upload failed");
  };

  const onTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Logo must be an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be smaller than 5MB");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onAddCoverSlides = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    files.forEach((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error(`${file.name}: must be an image or video`);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}: must be smaller than 20MB`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverSlides((prev) => [
          ...prev,
          {
            id: `new-${Date.now()}-${Math.random()}`,
            url: reader.result,
            type: file.type.startsWith("video/") ? "video" : "image",
            file,
            isNew: true,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCoverSlide = (id) =>
    setCoverSlides((prev) => prev.filter((s) => s.id !== id));

  const onAddGalleryItems = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";

    files.forEach((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error(`${file.name}: must be an image or video`);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}: must be smaller than 20MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryItems((prev) => [
          ...prev,
          {
            id: `new-media-${Date.now()}-${Math.random()}`,
            url: reader.result,
            type: file.type.startsWith("video/") ? "video" : "image",
            caption: "",
            file,
            isNew: true,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryItem = (id) =>
    setGalleryItems((prev) => prev.filter((item) => item.id !== id));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!organizerId) return;

    if (!formData.location?.trim()) {
      toast.error("Location is required");
      return;
    }

    setLoading(true);
    try {
      let logoUrl = null;

      if (logoFile) {
        logoUrl = await postUploadWithFallback(
          ["/uploads/organizer-logo"],
          logoFile,
        );
      }

      // Upload new cover slides, keep existing by URL
      const uploadedSlides = [];
      for (const slide of coverSlides) {
        if (slide.isNew && slide.file) {
          // Use different endpoints for videos vs images
          const endpoint =
            slide.type === "video" ? "/uploads/upload" : "/uploads/cover-photo";
          const url = await postUploadWithFallback([endpoint], slide.file);
          uploadedSlides.push({ url, type: slide.type });
        } else {
          uploadedSlides.push({ url: slide.url, type: slide.type });
        }
      }
      const coverMediaJson =
        uploadedSlides.length > 0 ? JSON.stringify(uploadedSlides) : null;

      // Upload new gallery items and preserve existing ones
      const uploadedGallery = [];
      for (const item of galleryItems) {
        if (item.isNew && item.file) {
          const endpoint =
            item.type === "video" ? "/uploads/upload" : "/uploads/cover-photo";
          const url = await postUploadWithFallback([endpoint], item.file);
          uploadedGallery.push({
            url,
            type: item.type,
            caption: item.caption || "",
          });
        } else if (item.url) {
          uploadedGallery.push({
            url: item.url,
            type: item.type || (isVideoMedia(item.url) ? "video" : "image"),
            caption: item.caption || "",
          });
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        address: formData.address,
        website: formData.website,
        instagram: formData.instagram,
        twitter: formData.twitter,
      };

      if (logoUrl) payload.logo = logoUrl;
      if (coverMediaJson) payload.coverMedia = coverMediaJson;
      payload.media = uploadedGallery;
      // Also keep coverPhoto as the first slide URL for backward compat
      if (uploadedSlides.length > 0) payload.coverPhoto = uploadedSlides[0].url;

      // Backend currently persists only coverPhoto in some flows; keep slideshow JSON locally.
      if (coverMediaJson && organizerId) {
        localStorage.setItem(
          `organizerCoverMedia:${organizerId}`,
          coverMediaJson,
        );
      }

      const response = await api.put(`/organizers/${organizerId}`, payload);
      const updated = response?.data || {};

      updateUser?.({
        ...currentOrganizer,
        ...updated,
        ...payload,
        firstName: payload.name,
        name: payload.name,
        phoneNumber: payload.phone,
        bio: payload.description,
        logo: logoUrl || updated.logo || currentOrganizer?.logo,
        profilePicture:
          logoUrl ||
          updated.profilePicture ||
          updated.logo ||
          currentOrganizer?.profilePicture ||
          currentOrganizer?.logo,
        coverMedia: coverMediaJson || currentOrganizer?.coverMedia,
        coverPhoto:
          uploadedSlides[0]?.url ||
          updated.coverPhoto ||
          currentOrganizer?.coverPhoto,
        media: uploadedGallery,
      });

      toast.success("Store profile updated");
    } catch (error) {
      console.error("Failed to save organizer profile config:", error);
      toast.error("Failed to save profile config");
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrganizer || currentOrganizer.role !== "ORGANIZER") {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-gray-400">
        Only organizers can access profile configuration.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-wide text-gray-100">
            Profile Config
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Configure how your organizer store appears to visitors.
          </p>
        </div>
        <Link
          to={profilePath}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-[11px] sm:text-xs uppercase tracking-[0.18em] text-red-300 hover:bg-red-500/20 transition-colors"
        >
          View Public Store
        </Link>
      </div>

      {/* ─── Live Preview ─── */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 overflow-hidden">
        <p className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-300/90 border-b border-zinc-800 bg-zinc-900/60">
          Live Preview
        </p>

        {/* scrollable preview — hero always visible, rest revealed by scroll */}
        <div className="overflow-y-auto hide-scrollbar max-h-105 sm:max-h-130 lg:max-h-145">

          {/* Cover Slideshow */}
          <div className="relative w-full h-40 sm:h-52 lg:h-60 overflow-hidden bg-black">
            <OrganizerCoverSlideshow
              slides={coverSlides.map((s) => ({
                id: s.id,
                url: getMediaUrl(s.url) || s.url,
                type: s.type,
              }))}
            />
          </div>

          {/* Tab Row */}
          <div className="flex justify-center gap-1.5 sm:gap-4 pt-3 sm:pt-5 pb-1 border-b border-zinc-800">
            <span className="pb-1 sm:pb-2 font-bold text-[9px] sm:text-xs uppercase tracking-wide text-gray-200 border-b-2 border-red-400">
              Overview
            </span>
            <span className="pb-1 sm:pb-2 font-bold text-[9px] sm:text-xs uppercase tracking-wide text-gray-500">
              Upcoming Events
            </span>
            <span className="pb-1 sm:pb-2 font-bold text-[9px] sm:text-xs uppercase tracking-wide text-gray-500">
              Past Events
            </span>
          </div>

          {/* Top About Org (no bio) */}
          <div className="px-3 sm:px-4 py-4 sm:py-6">
            <div className="w-full max-w-4xl mx-auto">
              <h3 className="text-sm font-medium tracking-wide uppercase text-gray-200 mb-3 text-center">
                About Org
              </h3>
              <div className="rounded-lg p-3 sm:p-4 text-center">
                <div className="mb-3 flex justify-center">
                  {logoPreview ? (
                    <img
                      src={getMediaUrl(logoPreview) || logoPreview}
                      alt="Organizer"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover bg-black shadow-2xl"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold tracking-tight shadow-2xl">
                      {(formData.name || "O")[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-white">{formData.name || "Organizer"}</p>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-light text-gray-200/90">
                  {formData.location && <span>{formData.location}</span>}
                  {formData.location && <span className="text-gray-500">|</span>}
                  <span>Joined {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short" })}</span>
                  {(formData.website || formData.instagram || formData.twitter) && (
                    <span className="text-gray-500">|</span>
                  )}
                  <div className="flex items-center gap-2 text-gray-200">
                    {formData.instagram && <FaInstagram size={13} />}
                    {formData.website && <FaGlobe size={13} />}
                    {formData.twitter && <FaTwitter size={13} />}
                  </div>
                  {formData.address && <span className="text-gray-500">|</span>}
                  {formData.address && <span>{formData.address}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Overview tab content */}
          <div className="px-3 sm:px-4 pb-6 space-y-8">

            {/* Featured Events placeholder */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Featured Events</h3>
              <p className="text-xs text-gray-400">No featured events yet.</p>
            </div>

            {/* Gallery */}
            <div className="w-full max-w-4xl mx-auto">
              <h3 className="text-sm font-medium tracking-wide uppercase text-gray-200 mb-3 text-center">
                Gallery
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                {galleryItems.length > 0 ? (
                  galleryItems.map((item) => (
                    <div
                      key={item.id}
                      className="shrink-0 w-36 sm:w-48 h-24 sm:h-28 rounded-lg border border-zinc-800 bg-zinc-900/70 overflow-hidden"
                    >
                      {item.type === "video" ? (
                        <video
                          src={getMediaUrl(item.url) || item.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={getMediaUrl(item.url) || item.url}
                          alt="Gallery"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No gallery media yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>{/* end scroll wrapper */}
      </section>

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-6">
          <h2 className="mb-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
            Branding Media
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-gray-400">Logo (image)</p>
              <div className="mb-3 h-32 w-32 overflow-hidden rounded-xl border border-zinc-700 bg-black">
                {logoPreview ? (
                  <img
                    src={getMediaUrl(logoPreview) || logoPreview}
                    alt="Logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-600">
                    No logo
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={onLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-red-600"
              >
                <FaCamera />
                {logoPreview ? "Change Logo" : "Upload Logo"}
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-400">
                Cover Slides (image or video)
              </p>

              {/* Slide thumbnails grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {coverSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="relative rounded-lg overflow-hidden border border-zinc-700 bg-black"
                    style={{ aspectRatio: "16/9" }}
                  >
                    {slide.type === "video" ? (
                      <video
                        src={getMediaUrl(slide.url) || slide.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={getMediaUrl(slide.url) || slide.url}
                        alt={`Slide ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* Slide number */}
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </span>
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeCoverSlide(slide.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white"
                      aria-label="Remove slide"
                    >
                      <FaTrash size={9} />
                    </button>
                  </div>
                ))}

                {/* Add slide button */}
                <button
                  type="button"
                  onClick={() => coverSlideInputRef.current?.click()}
                  style={{ aspectRatio: "16/9" }}
                  className="rounded-lg border-2 border-dashed border-zinc-600 hover:border-red-500 flex flex-col items-center justify-center text-zinc-500 hover:text-red-400 transition"
                >
                  <FaPlus size={16} />
                  <span className="text-xs mt-1">Add</span>
                </button>
              </div>

              <input
                ref={coverSlideInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={onAddCoverSlides}
                className="hidden"
              />
              <p className="text-xs text-gray-500">
                Each slide max 20MB. Slides cycle automatically like a hero
                banner.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
            <FaStore className="text-red-400" />
            Store Identity
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs text-gray-400">
              Store Name
              <input
                name="name"
                value={formData.name}
                onChange={onTextChange}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/70 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </label>
            <label className="text-xs text-gray-400">
              Email
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={onTextChange}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/70 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </label>
            <label className="text-xs text-gray-400">
              Phone
              <input
                name="phone"
                value={formData.phone}
                onChange={onTextChange}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/70 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </label>
            <label className="text-xs text-gray-400">
              Location
              <input
                name="location"
                value={formData.location}
                onChange={onTextChange}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/70 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </label>
            <label className="text-xs text-gray-400 md:col-span-2">
              Address
              <input
                name="address"
                value={formData.address}
                onChange={onTextChange}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/70 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </label>
            <label className="text-xs text-gray-400 md:col-span-2">
              Description
              <textarea
                name="description"
                value={formData.description}
                onChange={onTextChange}
                rows={4}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/70 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-6">
          <h2 className="mb-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
            Gallery Media
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
            {galleryItems.map((item, idx) => (
              <div
                key={item.id}
                className="relative rounded-lg overflow-hidden border border-zinc-700 bg-black"
                style={{ aspectRatio: "4/3" }}
              >
                {item.type === "video" ? (
                  <video
                    src={getMediaUrl(item.url) || item.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={getMediaUrl(item.url) || item.url}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeGalleryItem(item.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white"
                  aria-label="Remove gallery item"
                >
                  <FaTrash size={9} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              style={{ aspectRatio: "4/3" }}
              className="rounded-lg border-2 border-dashed border-zinc-600 hover:border-red-500 flex flex-col items-center justify-center text-zinc-500 hover:text-red-400 transition"
            >
              <FaPlus size={16} />
              <span className="text-xs mt-1">Add</span>
            </button>
          </div>

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={onAddGalleryItems}
            className="hidden"
          />

          <p className="text-xs text-gray-500">
            Add organizer gallery images/videos (max 20MB each).
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-6">
          <h2 className="mb-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
            Social Links
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-xs text-gray-400">
              Website
              <input
                name="website"
                value={formData.website}
                onChange={onTextChange}
                placeholder="https://"
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/70 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </label>
            <label className="text-xs text-gray-400">
              Instagram
              <input
                name="instagram"
                value={formData.instagram}
                onChange={onTextChange}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/70 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </label>
            <label className="text-xs text-gray-400">
              Twitter/X
              <input
                name="twitter"
                value={formData.twitter}
                onChange={onTextChange}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/70 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </label>
          </div>
        </section>

        <div className="sticky bottom-3 z-10 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSave />
            {loading ? "Saving..." : "Save Config"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizerProfileConfig;
