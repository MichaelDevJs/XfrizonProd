import React, { useState, useEffect } from "react";
import HomePageBlockManager from "../../component/admin/HomePageBlockManager";
import api from "../../api/axios";
import { toast } from "react-toastify";

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
          setHeroSlideshow(Array.isArray(slideshow) ? slideshow : []);
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
      const processedSlides = heroSlideshow.map((slide) => ({
        id: slide.id,
        type: slide.type,
        url: slide.url,
        duration: slide.duration,
        order: slide.order,
      }));

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
      return response.data.url || response.data.filePath;
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

    if (inputMethod === "file") {
      if (!newSlideFile) {
        toast.error("Please select a file");
        return;
      }

      // Upload file to backend
      slideUrl = await uploadSlideFile(newSlideFile);
      if (!slideUrl) return; // Upload failed
    } else {
      if (!newSlideUrl.trim()) {
        toast.error("Please enter a URL");
        return;
      }
      slideUrl = newSlideUrl.trim();
    }

    const newSlide = {
      id: Date.now().toString(),
      type: newSlideType,
      url: slideUrl,
      duration: newSlideDuration,
      order: heroSlideshow.length,
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

  const handleUpdateSlideDuration = (id, duration) => {
    setHeroSlideshow(
      heroSlideshow.map((slide) =>
        slide.id === id
          ? { ...slide, duration: parseInt(duration) || 5000 }
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
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {/* Hero Slideshow Manager */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-semibold text-white mb-4">
          Hero Slideshow (Billboard)
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Add multiple images or videos that will rotate automatically with
          custom durations
        </p>

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
          {heroSlideshow.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No slides added yet. Add your first slide above.
            </div>
          ) : (
            heroSlideshow.map((slide, index) => (
              <div
                key={slide.id}
                className="flex items-start gap-3 p-4 bg-zinc-800 rounded-lg border border-zinc-700"
              >
                {/* Preview */}
                <div className="shrink-0">
                  {slide.type === "video" ? (
                    <video
                      src={slide.url}
                      className="w-32 h-20 object-cover rounded border border-zinc-600"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={slide.url}
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
