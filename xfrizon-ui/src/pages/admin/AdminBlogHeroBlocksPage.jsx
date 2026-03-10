import React, { useState, useEffect } from "react";
import HeroSlideshow from "../../component/HeroSlideshow/HeroSlideshow";
import api from "../../api/axios";
import blogApi from "../../api/blogApi";
import { toast } from "react-toastify";

export default function AdminBlogHeroBlocksPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blogHeroSlideshow, setBlogHeroSlideshow] = useState([]);
  const [newSlideType, setNewSlideType] = useState("image");
  const [newSlideUrl, setNewSlideUrl] = useState("");
  const [newSlideFile, setNewSlideFile] = useState(null);
  const [newSlideFilePreview, setNewSlideFilePreview] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [inputMethod, setInputMethod] = useState("url");
  const [newSlideDuration, setNewSlideDuration] = useState(5000);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedSlideId, setDraggedSlideId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Blog selection
  const [selectedBlogCategory, setSelectedBlogCategory] = useState("");
  const [blogsByCategory, setBlogsByCategory] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState("");
  const [loadingBlogs, setLoadingBlogs] = useState(false);

  const blogCategories = [
    "All Blogs",
    "News",
    "Fashion",
    "Reviews",
    "Diaspora",
    "Music",
    "Politics",
    "General",
  ];

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
      blogId: slide?.blogId != null ? String(slide.blogId) : "",
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

  const appendSlide = (slideConfig) => {
    setBlogHeroSlideshow((prev) => {
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

  // Fetch blogs by category
  const fetchBlogsByCategory = async (category) => {
    if (!category) {
      setBlogsByCategory([]);
      return;
    }

    try {
      setLoadingBlogs(true);
      const params =
        category !== "All Blogs"
          ? { category, status: "PUBLISHED" }
          : { status: "PUBLISHED" };
      const response = await blogApi.getAllBlogs(params);

      const allBlogs = [];
      let page = 0;
      const size = 50;
      let hasMore = true;

      while (hasMore) {
        const pageResponse = await blogApi.getAllBlogs({
          ...params,
          page,
          size,
        });

        const payload = pageResponse?.data ?? pageResponse;

        if (Array.isArray(payload)) {
          allBlogs.push(...payload);
          hasMore = false;
        } else if (Array.isArray(payload?.content)) {
          allBlogs.push(...payload.content);
          const totalPages = payload.totalPages ?? 1;
          page += 1;
          hasMore = page < totalPages;
        } else {
          hasMore = false;
        }
      }

      setBlogsByCategory(allBlogs);

      if (allBlogs.length === 0) {
        toast.info(
          `No published blogs found ${category !== "All Blogs" ? `in ${category}` : ""}`,
        );
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
        blog?.coverImage?.src ||
        blog?.coverImage ||
        blog?.image ||
        "/assets/Xfrizon-Hero-Vid.mp4";
      const summary = String(
        blog?.excerpt || blog?.content || "Tap to read the full article.",
      )
        .replace(/<[^>]*>/g, "")
        .slice(0, 140);

      appendSlide({
        type: isVideoUrl(visual) ? "video" : "image",
        url: visual,
        title: title,
        caption: summary,
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
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/blog-hero-settings");
      const settings = response.data;

      if (settings.blogHeroSlideshow) {
        try {
          const slideshow = JSON.parse(settings.blogHeroSlideshow);
          setBlogHeroSlideshow(
            Array.isArray(slideshow)
              ? slideshow.map((slide, index) => normalizeSlide(slide, index))
              : [],
          );
        } catch (e) {
          console.error("Error parsing blog hero slideshow:", e);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching blog hero settings:", error);
      // If endpoint doesn't exist yet, just set empty slideshow
      setBlogHeroSlideshow([]);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const processedSlides = blogHeroSlideshow.map((slide, index) => {
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
          blogId: normalized.blogId,
          textColor: normalized.textColor,
          textSize: normalized.textSize,
          textPosition: normalized.textPosition,
          overlayOpacity: normalized.overlayOpacity,
          ctaBgColor: normalized.ctaBgColor,
          ctaTextColor: normalized.ctaTextColor,
        };
      });

      const response = await api.post("/blog-hero-settings/bulk", {
        blogHeroSlideshow: JSON.stringify(processedSlides),
      });

      toast.success("Blog hero settings saved successfully!");
    } catch (error) {
      console.error("Error saving blog hero settings:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to save settings";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
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

      return {
        url: response.data.url || response.data.filePath,
        type: String(response.data.type || "").toLowerCase(),
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
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

      const uploadResult = await uploadSlideFile(newSlideFile);
      if (!uploadResult?.url) return;
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
      order: blogHeroSlideshow.length,
      title: "",
      caption: "",
      ctaLabel: "",
      ctaLink: "",
      sourceType: "manual",
    };

    setBlogHeroSlideshow([...blogHeroSlideshow, newSlide]);

    setNewSlideUrl("");
    setNewSlideFile(null);
    setNewSlideFilePreview(null);
    setNewSlideDuration(5000);
    toast.success("Slide added successfully!");
  };

  const handleRemoveSlide = (id) => {
    setBlogHeroSlideshow(blogHeroSlideshow.filter((slide) => slide.id !== id));
  };

  const handleMoveSlide = (index, direction) => {
    const newSlides = [...blogHeroSlideshow];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < blogHeroSlideshow.length) {
      [newSlides[index], newSlides[newIndex]] = [
        newSlides[newIndex],
        newSlides[index],
      ];
      newSlides.forEach((slide, idx) => {
        slide.order = idx;
      });
      setBlogHeroSlideshow(newSlides);
    }
  };

  const handleDragStart = (e, slideId) => {
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

    const draggedIndex = blogHeroSlideshow.findIndex(
      (slide) => slide.id === draggedSlideId,
    );

    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedSlideId(null);
      setDragOverIndex(null);
      return;
    }

    const newSlides = [...blogHeroSlideshow];
    const draggedSlide = newSlides[draggedIndex];

    newSlides.splice(draggedIndex, 1);
    newSlides.splice(dropIndex, 0, draggedSlide);

    newSlides.forEach((slide, idx) => {
      slide.order = idx;
    });

    setBlogHeroSlideshow(newSlides);
    setDraggedSlideId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedSlideId(null);
    setDragOverIndex(null);
  };

  const handleUpdateSlideDuration = (id, duration) => {
    setBlogHeroSlideshow(
      blogHeroSlideshow.map((slide) =>
        slide.id === id
          ? { ...slide, duration: parseInt(duration) || 5000 }
          : slide,
      ),
    );
  };

  const handleUpdateSlideField = (id, field, value) => {
    setBlogHeroSlideshow((prev) =>
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
        <div className="text-white">Loading blog hero settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Hero Slideshow</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage the slideshow that appears at the top of the blogs page
          </p>
        </div>
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
                This is how your carousel will appear on the blogs page
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
          <div className="border-2 border-dashed border-zinc-700 rounded-lg overflow-hidden max-w-4xl mx-auto">
            <HeroSlideshow items={blogHeroSlideshow} />
          </div>
          <div className="mt-3 text-xs text-gray-500 text-center">
            💡 Make changes to slides, styling, or content above and see updates
            here instantly
          </div>
        </div>
      )}

      {/* Blog Hero Slideshow Manager */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-semibold text-white mb-4">
          Blog Hero Slideshow
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Add multiple images or videos that will rotate automatically
        </p>

        {/* Blog Selection Section */}
        <div className="mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700 space-y-4">
          <h3 className="text-sm font-medium text-white">Add Blog Highlight</h3>
          <p className="text-xs text-gray-400">
            Select a published blog to create a hero slide automatically
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={selectedBlogCategory}
              onChange={(e) => handleBlogCategoryChange(e.target.value)}
              className="bg-zinc-900 text-white text-sm border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-red-500/60"
            >
              <option value="">Select Category</option>
              {blogCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedBlog}
              onChange={(e) => setSelectedBlog(e.target.value)}
              disabled={!selectedBlogCategory || loadingBlogs}
              className="bg-zinc-900 text-white text-sm border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-red-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingBlogs
                  ? "Loading blogs..."
                  : blogsByCategory.length === 0
                    ? "No blogs available"
                    : "Select Blog"}
              </option>
              {blogsByCategory.map((blog) => (
                <option key={blog.id} value={blog.id}>
                  {blog.title}
                </option>
              ))}
            </select>

            <button
              onClick={addBlogHighlightFromSelectedBlog}
              disabled={!selectedBlog}
              className="px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Blog Slide
            </button>
          </div>
        </div>

        {/* Manual Add Section */}
        <div className="mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700 space-y-4">
          <h3 className="text-sm font-medium text-white">Add Slide Manually</h3>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setInputMethod("url")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                inputMethod === "url"
                  ? "bg-red-500 text-white"
                  : "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
              }`}
            >
              URL
            </button>
            <button
              onClick={() => setInputMethod("file")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                inputMethod === "file"
                  ? "bg-red-500 text-white"
                  : "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
              }`}
            >
              Upload File
            </button>
          </div>

          {inputMethod === "url" ? (
            <div className="space-y-3">
              <select
                value={newSlideType}
                onChange={(e) => setNewSlideType(e.target.value)}
                className="w-full bg-zinc-900 text-white text-sm border border-zinc-700 rounded-md px-3 py-2"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>

              <input
                type="text"
                value={newSlideUrl}
                onChange={(e) => setNewSlideUrl(e.target.value)}
                placeholder="Enter image or video URL"
                className="w-full bg-zinc-900 text-white text-sm border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-red-500/60"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={newSlideType}
                onChange={(e) => setNewSlideType(e.target.value)}
                className="w-full bg-zinc-900 text-white text-sm border border-zinc-700 rounded-md px-3 py-2"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>

              <input
                type="file"
                accept={newSlideType === "video" ? "video/*" : "image/*"}
                onChange={handleFileSelect}
                className="w-full bg-zinc-900 text-white text-sm border border-zinc-700 rounded-md px-3 py-2 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-red-500 file:text-white hover:file:bg-red-600 file:cursor-pointer"
              />

              {newSlideFilePreview && (
                <div className="mt-3">
                  {newSlideType === "video" ? (
                    <video
                      src={newSlideFilePreview}
                      className="w-full h-48 object-cover rounded-md"
                      controls
                    />
                  ) : (
                    <img
                      src={newSlideFilePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 items-center">
            <label className="text-sm text-gray-300">Duration (ms):</label>
            <input
              type="number"
              value={newSlideDuration}
              onChange={(e) =>
                setNewSlideDuration(parseInt(e.target.value) || 5000)
              }
              min="1000"
              step="1000"
              className="flex-1 bg-zinc-900 text-white text-sm border border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:border-red-500/60"
            />
          </div>

          <button
            onClick={handleAddSlide}
            disabled={uploadingFile}
            className="w-full px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadingFile ? "Uploading..." : "Add Slide"}
          </button>
        </div>

        {/* Existing Slides */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">
            Current Slides ({blogHeroSlideshow.length})
          </h3>

          {blogHeroSlideshow.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No slides added yet. Add your first slide above.
            </div>
          ) : (
            blogHeroSlideshow.map((slide, index) => (
              <div
                key={slide.id}
                draggable
                onDragStart={(e) => handleDragStart(e, slide.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`p-4 bg-zinc-800 rounded-lg border transition-all cursor-move ${
                  dragOverIndex === index
                    ? "border-red-500 border-2"
                    : "border-zinc-700"
                } ${draggedSlideId === slide.id ? "opacity-50" : ""}`}
              >
                <div className="flex gap-4">
                  <div className="w-32 h-20 shrink-0 bg-zinc-900 rounded overflow-hidden">
                    {slide.type === "video" || isVideoUrl(slide.url) ? (
                      <video
                        src={resolveMediaUrl(slide.url)}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={resolveMediaUrl(slide.url)}
                        alt={slide.title || "Slide"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23333' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='18' fill='%23666' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">
                          {slide.type.toUpperCase()} • {slide.duration}ms
                          {slide.sourceType && (
                            <span className="ml-2 text-blue-400">
                              ({slide.sourceType})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMoveSlide(index, "up")}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveSlide(index, "down")}
                          disabled={index === blogHeroSlideshow.length - 1}
                          className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveSlide(slide.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) =>
                        handleUpdateSlideField(
                          slide.id,
                          "title",
                          e.target.value,
                        )
                      }
                      placeholder="Slide title..."
                      className="w-full bg-zinc-900 text-white text-sm border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:border-red-500/60"
                    />

                    <textarea
                      value={slide.caption}
                      onChange={(e) =>
                        handleUpdateSlideField(
                          slide.id,
                          "caption",
                          e.target.value,
                        )
                      }
                      placeholder="Slide caption..."
                      rows="2"
                      className="w-full bg-zinc-900 text-white text-sm border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:border-red-500/60 resize-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={slide.ctaLabel}
                        onChange={(e) =>
                          handleUpdateSlideField(
                            slide.id,
                            "ctaLabel",
                            e.target.value,
                          )
                        }
                        placeholder="CTA button text..."
                        className="bg-zinc-900 text-white text-sm border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:border-red-500/60"
                      />
                      <input
                        type="text"
                        value={slide.ctaLink}
                        onChange={(e) =>
                          handleUpdateSlideField(
                            slide.id,
                            "ctaLink",
                            e.target.value,
                          )
                        }
                        placeholder="CTA link..."
                        className="bg-zinc-900 text-white text-sm border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:border-red-500/60"
                      />
                    </div>

                    {/* Text Styling Controls */}
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-white">
                        🎨 Text Styling & Colors
                      </summary>
                      <div className="mt-3 space-y-3 p-3 bg-zinc-900 rounded border border-zinc-700">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              Text Color
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={slide.textColor}
                                onChange={(e) =>
                                  handleUpdateSlideField(
                                    slide.id,
                                    "textColor",
                                    e.target.value,
                                  )
                                }
                                className="w-10 h-8 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={slide.textColor}
                                onChange={(e) =>
                                  handleUpdateSlideField(
                                    slide.id,
                                    "textColor",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 bg-zinc-800 text-white text-xs border border-zinc-700 rounded px-2 py-1"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              Text Size
                            </label>
                            <select
                              value={slide.textSize}
                              onChange={(e) =>
                                handleUpdateSlideField(
                                  slide.id,
                                  "textSize",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-zinc-800 text-white text-xs border border-zinc-700 rounded px-2 py-1"
                            >
                              <option value="small">Small</option>
                              <option value="normal">Normal</option>
                              <option value="large">Large</option>
                              <option value="xl">Extra Large</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              Text Position
                            </label>
                            <select
                              value={slide.textPosition}
                              onChange={(e) =>
                                handleUpdateSlideField(
                                  slide.id,
                                  "textPosition",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-zinc-800 text-white text-xs border border-zinc-700 rounded px-2 py-1"
                            >
                              <option value="top-left">Top Left</option>
                              <option value="top-center">Top Center</option>
                              <option value="top-right">Top Right</option>
                              <option value="middle-left">Middle Left</option>
                              <option value="middle-center">
                                Middle Center
                              </option>
                              <option value="middle-right">Middle Right</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="bottom-center">
                                Bottom Center
                              </option>
                              <option value="bottom-right">Bottom Right</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              Overlay Opacity: {slide.overlayOpacity}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="80"
                              value={slide.overlayOpacity}
                              onChange={(e) =>
                                handleUpdateSlideField(
                                  slide.id,
                                  "overlayOpacity",
                                  e.target.value,
                                )
                              }
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              CTA Bg Color
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={slide.ctaBgColor}
                                onChange={(e) =>
                                  handleUpdateSlideField(
                                    slide.id,
                                    "ctaBgColor",
                                    e.target.value,
                                  )
                                }
                                className="w-10 h-8 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={slide.ctaBgColor}
                                onChange={(e) =>
                                  handleUpdateSlideField(
                                    slide.id,
                                    "ctaBgColor",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 bg-zinc-800 text-white text-xs border border-zinc-700 rounded px-2 py-1"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              CTA Text Color
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={slide.ctaTextColor}
                                onChange={(e) =>
                                  handleUpdateSlideField(
                                    slide.id,
                                    "ctaTextColor",
                                    e.target.value,
                                  )
                                }
                                className="w-10 h-8 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={slide.ctaTextColor}
                                onChange={(e) =>
                                  handleUpdateSlideField(
                                    slide.id,
                                    "ctaTextColor",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 bg-zinc-800 text-white text-xs border border-zinc-700 rounded px-2 py-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
