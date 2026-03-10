import React, { useState, useEffect } from "react";
import HomePageBlockManager from "../../component/admin/HomePageBlockManager";
import HeroSlideshow from "../../component/HeroSlideshow/HeroSlideshow";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { COUNTRIES_DATA } from "../../data/countriesData";

export default function AdminHomeBlocksPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroSlideshow, setHeroSlideshow] = useState([
    {
      id: "1",
      type: "video",
      url: "/assets/Xfrizon-Hero-Vid.mp4",
      duration: 10000,
      order: 0,
    },
  ]);
  const [newSlideType, setNewSlideType] = useState("video");
  const [newSlideUrl, setNewSlideUrl] = useState("");
  const [newSlideFile, setNewSlideFile] = useState(null);
  const [newSlideFilePreview, setNewSlideFilePreview] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [inputMethod, setInputMethod] = useState("url"); // "url" or "file"
  const [newSlideDuration, setNewSlideDuration] = useState(5000);
  const [bannerTexts, setBannerTexts] = useState([
    "Promoting Afrocentric Events",
    "Discover Events Near You",
    "Celebrate Culture Together",
  ]);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [blockOrder, setBlockOrder] = useState([
    { id: "centeredBanner", label: "Centered Banner" },
    { id: "heroSection", label: "Hero Section" },
    { id: "blogsSection", label: "Blogs Section" },
    { id: "eventSection", label: "Event Section" },
  ]);
  const [newBannerText, setNewBannerText] = useState("");
  const [featureOrganizerId, setFeatureOrganizerId] = useState("");
  const [featureBlogId, setFeatureBlogId] = useState("");
  const [addingFeatureSlide, setAddingFeatureSlide] = useState(false);

  // Drag and drop state
  const [draggedSlideId, setDraggedSlideId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Country-based organizer selection
  const [selectedCountry, setSelectedCountry] = useState("");
  const [organizersByCountry, setOrganizersByCountry] = useState([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState("");
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);

  // Category-based blog selection
  const [selectedBlogCategory, setSelectedBlogCategory] = useState("");
  const [blogsByCategory, setBlogsByCategory] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState("");
  const [loadingBlogs, setLoadingBlogs] = useState(false);

  const blogCategories = [
    "News",
    "Fashion",
    "Reviews",
    "Diaspora",
    "Music",
    "Politics",
    "General",
  ];

  // Xfrizon allowed countries
  const allowedCountries = [
    "Germany",
    "United Kingdom",
    "United States",
    "Nigeria",
    "Japan",
    "Ghana",
    "South Africa",
    "Kenya",
    "France",
    "Canada",
    "Australia",
  ];

  // Preview toggle
  const [showPreview, setShowPreview] = useState(false);

  const isVideoUrl = (url = "") => {
    const value = String(url).toLowerCase();
    return /(\.mp4|\.mov|\.webm|\.m4v|\.ogg)(\?|$)/.test(value);
  };

  const apiBaseUrl =
    import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8081/api/v1";
  const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, "");

  const resolveMediaUrl = (path) => {
    if (!path) return "";
    const value = String(path).trim();
    if (!value) return "";
    if (
      /^https?:\/\//i.test(value) ||
      value.startsWith("data:") ||
      value.startsWith("blob:")
    ) {
      return value;
    }
    if (value.startsWith("/assets/")) return value;
    const normalizedPath = value.startsWith("/") ? value : `/${value}`;
    if (
      normalizedPath.startsWith("/uploads/") ||
      normalizedPath.startsWith("/api/v1/uploads/")
    ) {
      return `${apiOrigin}${normalizedPath}`;
    }
    return normalizedPath;
  };

  const isVideoSlide = (slide) => {
    const type = String(slide?.type || "").toLowerCase();
    return type.includes("video") || isVideoUrl(slide?.url);
  };

  const normalizeSlide = (slide, index = 0) => {
    const url = typeof slide?.url === "string" ? slide.url : "";
    const rawType = String(slide?.type || "").toLowerCase();
    const inferredType =
      rawType.includes("video") || isVideoUrl(url) ? "video" : "image";

    return {
      id: slide?.id ? String(slide.id) : `${Date.now()}-${index}`,
      type: inferredType,
      url,
      duration: Number(slide?.duration) > 0 ? Number(slide.duration) : 5000,
      order: Number.isFinite(Number(slide?.order))
        ? Number(slide.order)
        : index,
      title: typeof slide?.title === "string" ? slide.title : "",
      caption: typeof slide?.caption === "string" ? slide.caption : "",
      ctaLabel: typeof slide?.ctaLabel === "string" ? slide.ctaLabel : "",
      ctaLink: typeof slide?.ctaLink === "string" ? slide.ctaLink : "",
      sourceType: typeof slide?.sourceType === "string" ? slide.sourceType : "",
      organizerId: slide?.organizerId != null ? String(slide.organizerId) : "",
      blogId: slide?.blogId != null ? String(slide.blogId) : "",
      // Text styling properties
      textColor:
        typeof slide?.textColor === "string" ? slide.textColor : "#ffffff",
      textSize: typeof slide?.textSize === "string" ? slide.textSize : "normal",
      textPosition:
        typeof slide?.textPosition === "string"
          ? slide.textPosition
          : "bottom-left",
      overlayOpacity:
        typeof slide?.overlayOpacity === "string" ? slide.overlayOpacity : "30",
      ctaBgColor:
        typeof slide?.ctaBgColor === "string" ? slide.ctaBgColor : "#ef4444",
      ctaTextColor:
        typeof slide?.ctaTextColor === "string"
          ? slide.ctaTextColor
          : "#ffffff",
    };
  };

  const parseOrganizerMedia = (organizer) => {
    const raw =
      organizer?.media || organizer?.mediaGallery || organizer?.gallery;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const mediaItemUrl = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.url || item.src || item.path || item.mediaUrl || "";
  };

  const mediaItemType = (item) => {
    if (!item || typeof item === "string") return "";
    return String(item.type || item.mediaType || "").toLowerCase();
  };

  const appendSlide = (slideConfig) => {
    setHeroSlideshow((prev) => {
      const normalized = normalizeSlide(
        {
          id: Date.now().toString(),
          order: prev.length,
          duration: 7000,
          ...slideConfig,
        },
        prev.length,
      );
      return [...prev, normalized];
    });
  };

  // Fetch organizers by country with videos
  const fetchOrganizersByCountry = async (country) => {
    if (!country) {
      setOrganizersByCountry([]);
      return;
    }

    try {
      setLoadingOrganizers(true);
      // Fetch all organizers filtered by country
      const response = await api.get(`/organizers`, {
        params: { country },
      });

      const allOrganizers = response?.data?.data || response?.data || [];

      // Filter organizers who have videos in their media
      const organizersWithVideos = [];
      for (const org of allOrganizers) {
        const media = parseOrganizerMedia(org);
        const hasVideo = media.some((item) => {
          const type = mediaItemType(item);
          const url = mediaItemUrl(item);
          return type.includes("video") || isVideoUrl(url);
        });

        if (hasVideo) {
          organizersWithVideos.push(org);
        }
      }

      setOrganizersByCountry(organizersWithVideos);

      if (organizersWithVideos.length === 0) {
        toast.info(`No organizers with videos found in ${country}`);
      }
    } catch (error) {
      console.error("Failed to fetch organizers by country", error);
      toast.error("Could not load organizers");
      setOrganizersByCountry([]);
    } finally {
      setLoadingOrganizers(false);
    }
  };

  // Handle country selection
  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setSelectedOrganizer("");
    setOrganizersByCountry([]);
    if (country) {
      fetchOrganizersByCountry(country);
    }
  };

  // Add night with us from selected organizer
  const addNightWithUsFromSelectedOrganizer = async () => {
    if (!selectedOrganizer) {
      toast.error("Please select an organizer");
      return;
    }

    try {
      setAddingFeatureSlide(true);
      const organizer = organizersByCountry.find(
        (org) => String(org.id) === String(selectedOrganizer),
      );

      if (!organizer) {
        toast.error("Organizer not found");
        return;
      }

      const organizerId = String(organizer.id);
      const organizerName =
        organizer?.businessName ||
        organizer?.name ||
        organizer?.displayName ||
        `Organizer ${organizerId}`;
      const media = parseOrganizerMedia(organizer);
      const videoItem = media.find((item) => {
        const type = mediaItemType(item);
        const url = mediaItemUrl(item);
        return type.includes("video") || isVideoUrl(url);
      });

      const videoUrl = mediaItemUrl(videoItem);
      if (!videoUrl) {
        toast.error("No video found in this organizer's media");
        return;
      }

      appendSlide({
        type: "video",
        url: videoUrl,
        title: `Night with ${organizerName}`,
        caption: "Watch the vibe and book your spot.",
        ctaLabel: "Buy Tickets",
        ctaLink: `/organizer/${organizerId}/store`,
        sourceType: "organizer-night-video",
        organizerId,
      });

      toast.success("Night with Us slide added");
      setSelectedOrganizer("");
    } catch (error) {
      console.error("Failed to add organizer night slide", error);
      toast.error("Could not add slide");
    } finally {
      setAddingFeatureSlide(false);
    }
  };

  // Fetch blogs by category
  const fetchBlogsByCategory = async (category) => {
    if (!category) {
      setBlogsByCategory([]);
      return;
    }

    try {
      setLoadingBlogs(true);
      const response = await api.get(`/blogs`, {
        params: category !== "All" ? { category } : {},
      });

      // Extract blogs from paginated response
      const blogList =
        response?.data?.data?.content ||
        response?.data?.content ||
        response?.data ||
        [];

      // Filter published blogs only
      const publishedBlogs = blogList.filter(
        (blog) => blog.status === "PUBLISHED" || blog.status === "published",
      );

      setBlogsByCategory(publishedBlogs);

      if (publishedBlogs.length === 0) {
        toast.info(`No published blogs found in ${category}`);
      }
    } catch (error) {
      console.error("Failed to fetch blogs by category", error);
      toast.error("Could not load blogs");
      setBlogsByCategory([]);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Handle blog category selection
  const handleBlogCategoryChange = (category) => {
    setSelectedBlogCategory(category);
    setSelectedBlog("");
    setBlogsByCategory([]);
    if (category) {
      fetchBlogsByCategory(category);
    }
  };

  // Add blog highlight from selected blog
  const addBlogHighlightFromSelectedBlog = async () => {
    if (!selectedBlog) {
      toast.error("Please select a blog");
      return;
    }

    try {
      setAddingFeatureSlide(true);
      const blog = blogsByCategory.find(
        (b) => String(b.id) === String(selectedBlog),
      );

      if (!blog) {
        toast.error("Blog not found");
        return;
      }

      const blogId = String(blog.id);
      const title = blog?.title || `Blog ${blogId}`;
      const visual =
        blog?.coverImage ||
        blog?.featuredImage ||
        blog?.thumbnailUrl ||
        "/assets/Xfrizon-Hero-Vid.mp4";
      const summary = String(
        blog?.excerpt || blog?.summary || "Tap to read the full article.",
      )
        .replace(/<[^>]*>/g, "")
        .slice(0, 140);

      appendSlide({
        type: isVideoUrl(visual) ? "video" : "image",
        url: visual,
        title: "Blog Highlight",
        caption: `${title}${summary ? ` - ${summary}` : ""}`,
        ctaLabel: "Read Article",
        ctaLink: `/blog/${blogId}`,
        sourceType: "blog-highlight",
        blogId,
      });

      toast.success("Blog highlight slide added");
      setSelectedBlog("");
    } catch (error) {
      console.error("Failed to add blog highlight slide", error);
      toast.error("Could not add slide");
    } finally {
      setAddingFeatureSlide(false);
    }
  };

  const addNightWithUsFromOrganizer = async () => {
    if (!featureOrganizerId.trim()) {
      toast.error("Enter organizer ID first");
      return;
    }

    try {
      setAddingFeatureSlide(true);
      const organizerId = featureOrganizerId.trim();
      const response = await api.get(`/organizers/${organizerId}`);
      const organizer = response?.data?.data || response?.data || {};
      const organizerName =
        organizer?.businessName ||
        organizer?.name ||
        organizer?.displayName ||
        `Organizer ${organizerId}`;
      const media = parseOrganizerMedia(organizer);
      const videoItem = media.find((item) => {
        const type = mediaItemType(item);
        const url = mediaItemUrl(item);
        return type.includes("video") || isVideoUrl(url);
      });

      const videoUrl = mediaItemUrl(videoItem);
      if (!videoUrl) {
        toast.error("No video found in this organizer's media");
        return;
      }

      appendSlide({
        type: "video",
        url: videoUrl,
        title: `Night with ${organizerName}`,
        caption: "Watch the vibe and book your spot.",
        ctaLabel: "Buy Tickets",
        ctaLink: `/organizer/${organizerId}/store`,
        sourceType: "organizer-night-video",
        organizerId,
      });

      toast.success("Night with Us slide added");
    } catch (error) {
      console.error("Failed to add organizer night slide", error);
      toast.error("Could not load organizer media");
    } finally {
      setAddingFeatureSlide(false);
    }
  };

  const addBuyTicketsFromOrganizer = async () => {
    if (!featureOrganizerId.trim()) {
      toast.error("Enter organizer ID first");
      return;
    }

    try {
      setAddingFeatureSlide(true);
      const organizerId = featureOrganizerId.trim();
      const response = await api.get(`/organizers/${organizerId}`);
      const organizer = response?.data?.data || response?.data || {};
      const organizerName =
        organizer?.businessName ||
        organizer?.name ||
        organizer?.displayName ||
        `Organizer ${organizerId}`;
      const fallbackVisual =
        organizer?.coverPhoto ||
        organizer?.coverPhotoUrl ||
        organizer?.profilePicture ||
        organizer?.logo ||
        "/assets/Xfrizon-Hero-Vid.mp4";
      const type = isVideoUrl(fallbackVisual) ? "video" : "image";

      appendSlide({
        type,
        url: fallbackVisual,
        title: `${organizerName} Store`,
        caption: "New drops, hot events, and live tickets available.",
        ctaLabel: "Buy Tickets",
        ctaLink: `/organizer/${organizerId}/store`,
        sourceType: "organizer-store-cta",
        organizerId,
      });

      toast.success("Buy Tickets slide added");
    } catch (error) {
      console.error("Failed to add organizer store slide", error);
      toast.error("Could not load organizer profile");
    } finally {
      setAddingFeatureSlide(false);
    }
  };

  const addBlogHighlightSlide = async () => {
    if (!featureBlogId.trim()) {
      toast.error("Enter blog ID first");
      return;
    }

    try {
      setAddingFeatureSlide(true);
      const blogId = featureBlogId.trim();
      const response = await api.get(`/blogs/${blogId}`);
      const blog = response?.data?.data || response?.data || {};
      const title = blog?.title || `Blog ${blogId}`;
      const visual =
        blog?.coverImage ||
        blog?.featuredImage ||
        blog?.thumbnailUrl ||
        "/assets/Xfrizon-Hero-Vid.mp4";
      const summary = String(
        blog?.excerpt || blog?.summary || "Tap to read the full article.",
      )
        .replace(/<[^>]*>/g, "")
        .slice(0, 140);

      appendSlide({
        type: isVideoUrl(visual) ? "video" : "image",
        url: visual,
        title: "Blog Highlight",
        caption: `${title}${summary ? ` - ${summary}` : ""}`,
        ctaLabel: "Read Article",
        ctaLink: `/blog/${blogId}`,
        sourceType: "blog-highlight",
        blogId,
      });

      toast.success("Blog highlight slide added");
    } catch (error) {
      console.error("Failed to add blog highlight slide", error);
      toast.error("Could not load blog post");
    } finally {
      setAddingFeatureSlide(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/homepage-settings");
      const settings = response.data;

      if (settings.heroSlideshow) {
        try {
          const slideshow = JSON.parse(settings.heroSlideshow);
          setHeroSlideshow(
            Array.isArray(slideshow)
              ? slideshow.map((slide, index) => normalizeSlide(slide, index))
              : [],
          );
        } catch (e) {
          console.error("Error parsing hero slideshow:", e);
        }
      }

      if (settings.bannerTexts) {
        try {
          const texts = JSON.parse(settings.bannerTexts);
          setBannerTexts(Array.isArray(texts) ? texts : []);
        } catch (e) {
          console.error("Error parsing banner texts:", e);
        }
      }

      if (typeof settings.heroTitle === "string") {
        setHeroTitle(settings.heroTitle);
      }

      if (typeof settings.heroSubtitle === "string") {
        setHeroSubtitle(settings.heroSubtitle);
      }

      if (settings.blockOrder) {
        try {
          const order = JSON.parse(settings.blockOrder);
          const blockMap = {
            centeredBanner: "Centered Banner",
            heroSection: "Hero Section",
            blogsSection: "Blogs Section",
            eventSection: "Event Section",
          };
          setBlockOrder(order.map((id) => ({ id, label: blockMap[id] || id })));
        } catch (e) {
          console.error("Error parsing block order:", e);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching homepage settings:", error);
      toast.error("Failed to load settings");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // All slides should have real URLs now (either from upload or manual entry)
      const processedSlides = heroSlideshow.map((slide, index) => {
        const normalized = normalizeSlide(slide, index);
        return {
          id: normalized.id,
          type: normalized.type,
          url: normalized.url,
          duration: normalized.duration,
          order: normalized.order,
          title: normalized.title,
          caption: normalized.caption,
          ctaLabel: normalized.ctaLabel,
          ctaLink: normalized.ctaLink,
          sourceType: normalized.sourceType,
          organizerId: normalized.organizerId,
          blogId: normalized.blogId,
        };
      });

      const response = await api.post("/homepage-settings/bulk", {
        heroSlideshow: JSON.stringify(processedSlides),
        bannerTexts: JSON.stringify(bannerTexts),
        blockOrder: JSON.stringify(blockOrder.map((block) => block.id)),
      });

      toast.success("Homepage settings saved successfully!");
    } catch (error) {
      console.error("Error saving homepage settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBannerText = () => {
    if (newBannerText.trim()) {
      setBannerTexts([...bannerTexts, newBannerText.trim()]);
      setNewBannerText("");
    }
  };

  const handleRemoveBannerText = (index) => {
    setBannerTexts(bannerTexts.filter((_, i) => i !== index));
  };

  const handleMoveBannerText = (index, direction) => {
    const newTexts = [...bannerTexts];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < bannerTexts.length) {
      [newTexts[index], newTexts[newIndex]] = [
        newTexts[newIndex],
        newTexts[index],
      ];
      setBannerTexts(newTexts);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewSlideFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewSlideFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadSlideFile = async (file) => {
    if (!file) return null;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", newSlideType);

      const response = await api.post("/admin/upload/hero-slide", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      });

      console.log("Upload response:", response.data);
      return {
        url: response.data.url || response.data.filePath,
        type: String(response.data.type || "").toLowerCase(),
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(
        "Failed to upload file. Make sure backend upload endpoint is available.",
      );
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddSlide = async () => {
    let slideUrl = "";
    let slideType = newSlideType;

    if (inputMethod === "file") {
      if (!newSlideFile) {
        toast.error("Please select a file");
        return;
      }

      // Upload file to backend
      const uploadResult = await uploadSlideFile(newSlideFile);
      if (!uploadResult?.url) return; // Upload failed
      slideUrl = uploadResult.url;
      if (uploadResult.type === "video" || uploadResult.type === "image") {
        slideType = uploadResult.type;
      }
    } else {
      if (!newSlideUrl.trim()) {
        toast.error("Please enter a URL");
        return;
      }
      slideUrl = newSlideUrl.trim();
      if (isVideoUrl(slideUrl)) {
        slideType = "video";
      }
    }

    const newSlide = {
      id: Date.now().toString(),
      type: slideType,
      url: slideUrl,
      duration: newSlideDuration,
      order: heroSlideshow.length,
      title: "",
      caption: "",
      ctaLabel: "",
      ctaLink: "",
      sourceType: "manual",
    };

    setHeroSlideshow([...heroSlideshow, newSlide]);

    // Reset form
    setNewSlideUrl("");
    setNewSlideFile(null);
    setNewSlideFilePreview(null);
    setNewSlideDuration(5000);
    toast.success("Slide added successfully!");
  };

  const handleRemoveSlide = (id) => {
    setHeroSlideshow(heroSlideshow.filter((slide) => slide.id !== id));
  };

  const handleMoveSlide = (index, direction) => {
    const newSlides = [...heroSlideshow];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < heroSlideshow.length) {
      [newSlides[index], newSlides[newIndex]] = [
        newSlides[newIndex],
        newSlides[index],
      ];
      // Update order values
      newSlides.forEach((slide, idx) => {
        slide.order = idx;
      });
      setHeroSlideshow(newSlides);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, slideId, index) => {
    setDraggedSlideId(slideId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", slideId);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedSlideId === null) return;

    const draggedIndex = heroSlideshow.findIndex(
      (slide) => slide.id === draggedSlideId,
    );

    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedSlideId(null);
      setDragOverIndex(null);
      return;
    }

    const newSlides = [...heroSlideshow];
    const draggedSlide = newSlides[draggedIndex];

    // Remove slide from current position
    newSlides.splice(draggedIndex, 1);
    // Insert at new position
    newSlides.splice(dropIndex, 0, draggedSlide);

    // Update order values
    newSlides.forEach((slide, idx) => {
      slide.order = idx;
    });

    setHeroSlideshow(newSlides);
    setDraggedSlideId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedSlideId(null);
    setDragOverIndex(null);
  };

  const handleUpdateSlideDuration = (id, duration) => {
    setHeroSlideshow(
      heroSlideshow.map((slide) =>
        slide.id === id
          ? { ...slide, duration: parseInt(duration) || 5000 }
          : slide,
      ),
    );
  };

  const handleUpdateSlideField = (id, field, value) => {
    setHeroSlideshow((prev) =>
      prev.map((slide) =>
        slide.id === id
          ? {
              ...slide,
              [field]: value,
            }
          : slide,
      ),
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white">Loading homepage settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          HomePage Configuration
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>

      {/* Live Preview Section */}
      {showPreview && (
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Live Preview</h2>
              <p className="text-sm text-gray-400 mt-1">
                This is how your carousel will appear on the homepage
              </p>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close preview"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="border-2 border-dashed border-zinc-700 rounded-lg overflow-hidden">
            <HeroSlideshow
              items={heroSlideshow}
              title={heroTitle}
              subtitle={heroSubtitle}
            />
          </div>
          <div className="mt-3 text-xs text-gray-500 text-center">
            💡 Make changes to slides, styling, or content above and see updates
            here instantly
          </div>
        </div>
      )}

      {/* Hero Slideshow Manager */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-semibold text-white mb-4">
          Hero Slideshow (Billboard)
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Add multiple images or videos that will rotate automatically with
          custom durations
        </p>

        <div className="mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700 space-y-4">
          <h3 className="text-sm font-medium text-white">
            Carousel Quick Actions
          </h3>
          <p className="text-xs text-gray-400">
            Build homepage carousel slides from existing organizer media and
            blog content.
          </p>

          {/* Organizer Section with Country Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-300">
              Add Organizer Video Slide
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Select Country
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  disabled={loadingOrganizers}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:border-red-500 disabled:opacity-50"
                >
                  <option value="">Choose a country...</option>
                  {allowedCountries
                    .filter((country) => COUNTRIES_DATA[country])
                    .map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Select Organizer {loadingOrganizers && "(Loading...)"}
                </label>
                <select
                  value={selectedOrganizer}
                  onChange={(e) => setSelectedOrganizer(e.target.value)}
                  disabled={
                    !selectedCountry ||
                    loadingOrganizers ||
                    organizersByCountry.length === 0
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:border-red-500 disabled:opacity-50"
                >
                  <option value="">
                    {!selectedCountry
                      ? "Select country first..."
                      : organizersByCountry.length === 0 && !loadingOrganizers
                        ? "No organizers with videos"
                        : "Choose organizer..."}
                  </option>
                  {organizersByCountry.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.businessName ||
                        org.name ||
                        org.displayName ||
                        `Organizer ${org.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addNightWithUsFromSelectedOrganizer}
                disabled={!selectedOrganizer || addingFeatureSlide}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add "Night with Us" Video
              </button>
            </div>

            {/* Fallback: Manual Organizer ID Entry */}
            <details className="mt-3">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                Or enter Organizer ID manually
              </summary>
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={featureOrganizerId}
                  onChange={(e) => setFeatureOrganizerId(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:border-red-500"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addNightWithUsFromOrganizer}
                    disabled={addingFeatureSlide}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded disabled:opacity-50"
                  >
                    Add Night with Us Video
                  </button>
                  <button
                    type="button"
                    onClick={addBuyTicketsFromOrganizer}
                    disabled={addingFeatureSlide}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded disabled:opacity-50"
                  >
                    Add Buy Tickets Slide
                  </button>
                </div>
              </div>
            </details>
          </div>

          {/* Blog Section */}
          <div className="border-t border-zinc-700 pt-3 space-y-3">
            <h4 className="text-xs font-medium text-gray-300">
              Add Blog Highlight Slide
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Select Category
                </label>
                <select
                  value={selectedBlogCategory}
                  onChange={(e) => handleBlogCategoryChange(e.target.value)}
                  disabled={loadingBlogs}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:border-red-500 disabled:opacity-50"
                >
                  <option value="">Choose a category...</option>
                  <option value="All">All Blogs</option>
                  {blogCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Select Blog {loadingBlogs && "(Loading...)"}
                </label>
                <select
                  value={selectedBlog}
                  onChange={(e) => setSelectedBlog(e.target.value)}
                  disabled={
                    !selectedBlogCategory ||
                    loadingBlogs ||
                    blogsByCategory.length === 0
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:border-red-500 disabled:opacity-50"
                >
                  <option value="">
                    {!selectedBlogCategory
                      ? "Select category first..."
                      : blogsByCategory.length === 0 && !loadingBlogs
                        ? "No published blogs"
                        : "Choose blog..."}
                  </option>
                  {blogsByCategory.map((blog) => (
                    <option key={blog.id} value={blog.id}>
                      {blog.title || `Blog ${blog.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addBlogHighlightFromSelectedBlog}
                disabled={!selectedBlog || addingFeatureSlide}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Blog Highlight
              </button>
            </div>

            {/* Fallback: Manual Blog ID Entry */}
            <details className="mt-3">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                Or enter Blog ID manually
              </summary>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Blog ID
                    </label>
                    <input
                      type="text"
                      value={featureBlogId}
                      onChange={(e) => setFeatureBlogId(e.target.value)}
                      placeholder="e.g. 105"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addBlogHighlightSlide}
                      disabled={addingFeatureSlide}
                      className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded disabled:opacity-50"
                    >
                      Add Blog Highlight
                    </button>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Add New Slide Form */}
        <div className="space-y-3 mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <h3 className="text-sm font-medium text-white">Add New Slide</h3>

          {/* Input Method Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => {
                setInputMethod("url");
                setNewSlideFile(null);
                setNewSlideFilePreview(null);
              }}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                inputMethod === "url"
                  ? "bg-red-500 text-white"
                  : "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
              }`}
            >
              Enter URL
            </button>
            <button
              onClick={() => {
                setInputMethod("file");
                setNewSlideUrl("");
              }}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                inputMethod === "file"
                  ? "bg-red-500 text-white"
                  : "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
              }`}
            >
              Upload File
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select
                value={newSlideType}
                onChange={(e) => setNewSlideType(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:border-red-500"
              >
                <option value="video">Video</option>
                <option value="image">Image</option>
              </select>
            </div>

            {inputMethod === "url" ? (
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">
                  {newSlideType === "video" ? "Video URL" : "Image URL"}
                </label>
                <input
                  type="text"
                  value={newSlideUrl}
                  onChange={(e) => setNewSlideUrl(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddSlide()}
                  placeholder={
                    newSlideType === "video"
                      ? "/assets/video.mp4 or https://..."
                      : "/assets/image.jpg or https://..."
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">
                  {newSlideType === "video"
                    ? "Select Video File"
                    : "Select Image File"}
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept={newSlideType === "video" ? "video/*" : "image/*"}
                    onChange={handleFileSelect}
                    disabled={uploadingFile}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:border-red-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-red-500 file:text-white hover:file:bg-red-600 file:cursor-pointer disabled:opacity-50"
                  />
                  <div className="bg-blue-950 border border-blue-800 rounded p-2 text-xs text-blue-200">
                    <strong>ℹ️ Upload to local storage:</strong> Select a{" "}
                    {newSlideType === "video" ? "video" : "image"} file and
                    click "Upload & Add" to upload it to your server and add it
                    as a slide.
                  </div>
                  {newSlideFilePreview && (
                    <div className="relative inline-block">
                      {newSlideType === "video" ? (
                        <video
                          src={newSlideFilePreview}
                          className="w-32 h-20 object-cover rounded border border-zinc-600"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={newSlideFilePreview}
                          alt="Preview"
                          className="w-32 h-20 object-cover rounded border border-zinc-600"
                        />
                      )}
                      <button
                        onClick={() => {
                          setNewSlideFile(null);
                          setNewSlideFilePreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">
                  Duration (ms)
                </label>
                <input
                  type="number"
                  value={newSlideDuration}
                  onChange={(e) =>
                    setNewSlideDuration(parseInt(e.target.value) || 5000)
                  }
                  min="1000"
                  step="1000"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="flex items-end">
                {inputMethod === "file" ? (
                  <button
                    onClick={handleAddSlide}
                    disabled={!newSlideFilePreview || uploadingFile}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingFile ? "Uploading..." : "Upload & Add"}
                  </button>
                ) : (
                  <button
                    onClick={handleAddSlide}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm whitespace-nowrap"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {inputMethod === "url"
              ? "Enter file path (e.g., /assets/video.mp4) or external URL (https://...). Duration in milliseconds (1000ms = 1 second)"
              : "Select a file to upload to local storage. Click 'Upload & Add' to upload and add it as a slide. Max file size: 100MB"}
          </p>
        </div>

        {/* Slideshow Items List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-950 border border-blue-800 rounded p-2">
            <svg
              className="w-4 h-4 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1h2v2H7V4zm2 4H7v2h2V8zm2-4h2v2h-2V4zm2 4h-2v2h2V8z"
              />
            </svg>
            <span>
              <strong>💡 Drag & Drop:</strong> Click and drag slides by the
              handle icon (⋮⋮) to reorder them, or use the up/down arrows.
            </span>
          </div>
          {heroSlideshow.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No slides added yet. Add your first slide above.
            </div>
          ) : (
            heroSlideshow.map((slide, index) => (
              <div
                key={slide.id}
                draggable
                onDragStart={(e) => handleDragStart(e, slide.id, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-move ${
                  draggedSlideId === slide.id
                    ? "opacity-50 bg-zinc-700 border-red-500"
                    : dragOverIndex === index
                      ? "bg-zinc-700 border-red-400 transform scale-y-110"
                      : "bg-zinc-800 border-zinc-700 hover:border-zinc-600"
                }`}
              >
                {/* Drag Handle */}
                <div className="shrink-0 flex items-center justify-center w-6 text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8 5a2 2 0 11-4 0 2 2 0 014 0zm3 0a2 2 0 11-4 0 2 2 0 014 0zm3 0a2 2 0 11-4 0 2 2 0 014 0zM8 15a2 2 0 11-4 0 2 2 0 014 0zm3 0a2 2 0 11-4 0 2 2 0 014 0zm3 0a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>

                {/* Preview */}
                <div className="shrink-0">
                  {isVideoSlide(slide) ? (
                    <video
                      src={resolveMediaUrl(slide.url)}
                      className="w-32 h-20 object-cover rounded border border-zinc-600"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={resolveMediaUrl(slide.url)}
                      alt={`Slide ${index + 1}`}
                      className="w-32 h-20 object-cover rounded border border-zinc-600"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-zinc-900 text-xs text-gray-400 rounded">
                      {slide.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      Slide {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-white truncate mb-2">
                    {slide.url}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={slide.title || ""}
                      onChange={(e) =>
                        handleUpdateSlideField(
                          slide.id,
                          "title",
                          e.target.value,
                        )
                      }
                      placeholder="Slide title (optional)"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                    />
                    <input
                      type="text"
                      value={slide.caption || ""}
                      onChange={(e) =>
                        handleUpdateSlideField(
                          slide.id,
                          "caption",
                          e.target.value,
                        )
                      }
                      placeholder="Slide caption (optional)"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={slide.ctaLabel || ""}
                      onChange={(e) =>
                        handleUpdateSlideField(
                          slide.id,
                          "ctaLabel",
                          e.target.value,
                        )
                      }
                      placeholder="CTA label (e.g. Buy Tickets)"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                    />
                    <input
                      type="text"
                      value={slide.ctaLink || ""}
                      onChange={(e) =>
                        handleUpdateSlideField(
                          slide.id,
                          "ctaLink",
                          e.target.value,
                        )
                      }
                      placeholder="CTA link (e.g. /blog/12)"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Text Styling Options */}
                  <details className="mb-2 border border-zinc-700 rounded p-2">
                    <summary className="text-xs text-gray-300 cursor-pointer hover:text-white mb-2 font-medium">
                      🎨 Text & CTA Styling
                    </summary>
                    <div className="space-y-2 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Text Color
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="color"
                              value={slide.textColor || "#ffffff"}
                              onChange={(e) =>
                                handleUpdateSlideField(
                                  slide.id,
                                  "textColor",
                                  e.target.value,
                                )
                              }
                              className="w-10 h-8 bg-zinc-900 border border-zinc-600 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={slide.textColor || "#ffffff"}
                              onChange={(e) =>
                                handleUpdateSlideField(
                                  slide.id,
                                  "textColor",
                                  e.target.value,
                                )
                              }
                              placeholder="#ffffff"
                              className="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Text Size
                          </label>
                          <select
                            value={slide.textSize || "normal"}
                            onChange={(e) =>
                              handleUpdateSlideField(
                                slide.id,
                                "textSize",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                          >
                            <option value="small">Small</option>
                            <option value="normal">Normal</option>
                            <option value="large">Large</option>
                            <option value="xl">Extra Large</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Text Position
                          </label>
                          <select
                            value={slide.textPosition || "bottom-left"}
                            onChange={(e) =>
                              handleUpdateSlideField(
                                slide.id,
                                "textPosition",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                          >
                            <option value="top-left">Top Left</option>
                            <option value="top-center">Top Center</option>
                            <option value="top-right">Top Right</option>
                            <option value="center-left">Center Left</option>
                            <option value="center">Center</option>
                            <option value="center-right">Center Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-center">Bottom Center</option>
                            <option value="bottom-right">Bottom Right</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Dark Overlay %
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="80"
                            step="5"
                            value={slide.overlayOpacity || "30"}
                            onChange={(e) =>
                              handleUpdateSlideField(
                                slide.id,
                                "overlayOpacity",
                                e.target.value,
                              )
                            }
                            className="w-full"
                          />
                          <span className="text-xs text-gray-500">
                            {slide.overlayOpacity || "30"}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            CTA Button BG
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="color"
                              value={slide.ctaBgColor || "#ef4444"}
                              onChange={(e) =>
                                handleUpdateSlideField(
                                  slide.id,
                                  "ctaBgColor",
                                  e.target.value,
                                )
                              }
                              className="w-10 h-8 bg-zinc-900 border border-zinc-600 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={slide.ctaBgColor || "#ef4444"}
                              onChange={(e) =>
                                handleUpdateSlideField(
                                  slide.id,
                                  "ctaBgColor",
                                  e.target.value,
                                )
                              }
                              placeholder="#ef4444"
                              className="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            CTA Text Color
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="color"
                              value={slide.ctaTextColor || "#ffffff"}
                              onChange={(e) =>
                                handleUpdateSlideField(
                                  slide.id,
                                  "ctaTextColor",
                                  e.target.value,
                                )
                              }
                              className="w-10 h-8 bg-zinc-900 border border-zinc-600 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={slide.ctaTextColor || "#ffffff"}
                              onChange={(e) =>
                                handleUpdateSlideField(
                                  slide.id,
                                  "ctaTextColor",
                                  e.target.value,
                                )
                              }
                              placeholder="#ffffff"
                              className="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Duration:</label>
                    <input
                      type="number"
                      value={slide.duration}
                      onChange={(e) =>
                        handleUpdateSlideDuration(slide.id, e.target.value)
                      }
                      min="1000"
                      step="1000"
                      className="w-24 px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                    />
                    <span className="text-xs text-gray-500">
                      ms ({(slide.duration / 1000).toFixed(1)}s)
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMoveSlide(index, "up")}
                      disabled={index === 0}
                      className="px-2 py-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveSlide(index, "down")}
                      disabled={index === heroSlideshow.length - 1}
                      className="px-2 py-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveSlide(slide.id)}
                    className="px-3 py-1 text-red-400 hover:text-red-300 text-xs whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hero Overlay Text */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-semibold text-white mb-4">
          Hero Overlay Text
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          This text appears on top of the hero slideshow.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Enter hero title"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Subtitle</label>
            <input
              type="text"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="Enter hero subtitle"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Centered Banner Texts */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-semibold text-white mb-4">
          Centered Banner Texts
        </h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newBannerText}
              onChange={(e) => setNewBannerText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddBannerText()}
              placeholder="Add new banner text"
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
            <button
              onClick={handleAddBannerText}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Add
            </button>
          </div>

          <div className="space-y-2 mt-4">
            {bannerTexts.map((text, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg border border-zinc-700"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveBannerText(index, "up")}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveBannerText(index, "down")}
                    disabled={index === bannerTexts.length - 1}
                    className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▼
                  </button>
                </div>
                <span className="flex-1 text-white italic text-sm">{text}</span>
                <button
                  onClick={() => handleRemoveBannerText(index)}
                  className="px-3 py-1 text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Block Order */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-semibold text-white mb-4">
          HomePage Block Order
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Drag and drop to reorder homepage sections
        </p>
        <HomePageBlockManager
          blocks={blockOrder}
          onChange={(newOrder) => setBlockOrder(newOrder)}
        />
      </div>

      {/* Save Button at Bottom */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}
