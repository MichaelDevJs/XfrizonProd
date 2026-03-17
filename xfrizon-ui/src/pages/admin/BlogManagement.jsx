import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import blogApi from "../../api/blogApi";
import api from "../../api/axios";
import BlogEditor from "./blog/BlogEditor";
import BlogList from "./blog/BlogList";

const isDataUrl = (value) =>
  typeof value === "string" && value.startsWith("data:");

const isBlobUrl = (value) =>
  typeof value === "string" && value.startsWith("blob:");

const isLocalUploadUrl = (value) => {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("/uploads/") ||
    normalized.includes("/api/v1/uploads/") ||
    normalized.includes("/uploads/")
  );
};

const createUploadCandidates = (endpoints) => {
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
    originCandidates.forEach((candidateOrigin) => {
      if (candidateOrigin) {
        candidates.push(`${candidateOrigin}${endpoint}`);
      }
    });
  });

  return [...new Set(candidates)];
};

const uploadFileWithFallback = async (endpoints, file) => {
  const uploadCandidates = createUploadCandidates(endpoints);
  const token =
    localStorage.getItem("adminToken") || localStorage.getItem("userToken");
  let lastError = null;

  for (const url of uploadCandidates) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const headers = { "Content-Type": "multipart/form-data" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(url, formData, {
        headers,
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

const dataUrlToFile = async (dataUrl, filename) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, {
    type: blob.type || "application/octet-stream",
  });
};

const mediaSourceToFile = async (source, fallbackName) => {
  if (source instanceof File) {
    return source;
  }

  const sourceValue = String(source || "").trim();
  if (!sourceValue) {
    throw new Error("Invalid media source");
  }

  const baseUrl = String(api?.defaults?.baseURL || "");
  const origin = baseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
  const fetchableUrl = /^https?:\/\//i.test(sourceValue)
    ? sourceValue
    : sourceValue.startsWith("/")
      ? `${origin}${sourceValue}`
      : `${origin}/${sourceValue}`;

  const response = await fetch(fetchableUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch media source: ${response.status}`);
  }

  const blob = await response.blob();
  const extensionFromType = blob?.type?.split("/")?.[1] || "bin";
  const safeName = String(fallbackName || "media-file").replace(/\s+/g, "-");
  const filename = safeName.includes(".")
    ? safeName
    : `${safeName}.${extensionFromType}`;

  return new File([blob], filename, {
    type: blob.type || "application/octet-stream",
  });
};

const sanitizeUploadedImage = (image, src) => ({
  ...image,
  src,
  url: src,
  file: undefined,
  preview: undefined,
});

const sanitizeUploadedVideo = (video, src) => ({
  ...video,
  src,
  url: src,
  file: undefined,
  preview: undefined,
});

const sanitizeUploadedAudioTrack = (track, src) => ({
  ...track,
  src,
  url: src,
  file: undefined,
  preview: undefined,
});

const containsDataUrl = (value) => {
  if (typeof value === "string") {
    return isDataUrl(value);
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsDataUrl(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => containsDataUrl(entry));
  }

  return false;
};

const containsUnsafeMediaValue = (value) => {
  if (typeof value === "string") {
    return isDataUrl(value) || isBlobUrl(value) || isLocalUploadUrl(value);
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsUnsafeMediaValue(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => containsUnsafeMediaValue(entry));
  }

  return false;
};

export default function BlogManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [blogs, setBlogs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  // Fetch blogs on component mount
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Fetch all blogs from API
  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const response = await blogApi.getAllBlogs();
      // Extract the content array from the Page object returned by the API
      let blogList = response.data
        ? response.data.content || response.data
        : response;

      // Parse JSON strings into arrays for media fields
      if (Array.isArray(blogList)) {
        blogList = blogList.map((blog) => ({
          ...blog,
          blocks: blog.blocks
            ? typeof blog.blocks === "string"
              ? JSON.parse(blog.blocks)
              : blog.blocks
            : [],
          images: blog.images
            ? typeof blog.images === "string"
              ? JSON.parse(blog.images)
              : blog.images
            : [],
          videos: blog.videos
            ? typeof blog.videos === "string"
              ? JSON.parse(blog.videos)
              : blog.videos
            : [],
          youtubeLinks: blog.youtubeLinks
            ? typeof blog.youtubeLinks === "string"
              ? JSON.parse(blog.youtubeLinks)
              : blog.youtubeLinks
            : [],
          audioTracks: blog.audioTracks
            ? typeof blog.audioTracks === "string"
              ? JSON.parse(blog.audioTracks)
              : blog.audioTracks
            : [],
          titleStyle: blog.titleStyle
            ? typeof blog.titleStyle === "string"
              ? JSON.parse(blog.titleStyle)
              : blog.titleStyle
            : {},
          tags: blog.tags
            ? typeof blog.tags === "string"
              ? JSON.parse(blog.tags)
              : blog.tags
            : [],
        }));
      }

      setBlogs(Array.isArray(blogList) ? blogList : []);
      console.log("Blogs fetched:", blogList);
      toast.success("Blogs loaded");
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      toast.error("Failed to load blogs");
      // Fallback to empty array if API fails
      setBlogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Save blog (create or update)
  const handleSaveBlog = async (formData) => {
    const uploadCoverImage = async (coverImage) => {
      if (!coverImage) return null;
      if (
        typeof coverImage === "string" &&
        !isDataUrl(coverImage) &&
        !isBlobUrl(coverImage) &&
        !isLocalUploadUrl(coverImage)
      ) {
        return coverImage;
      }

      const fileToUpload =
        coverImage instanceof File
          ? coverImage
          : await mediaSourceToFile(coverImage, "blog-cover-image");

      return uploadFileWithFallback(["/uploads/cover-photo"], fileToUpload);
    };

    const uploadBlockImages = async (blocks) => {
      return Promise.all(
        blocks.map(async (block) => {
          if (block.type !== "image" || !Array.isArray(block.images)) {
            return block;
          }

          const uploadedImages = await Promise.all(
            block.images.map(async (image, index) => {
              const currentSrc = image?.src || image?.url;
              if (
                typeof currentSrc === "string" &&
                !isDataUrl(currentSrc) &&
                !isBlobUrl(currentSrc) &&
                !isLocalUploadUrl(currentSrc)
              ) {
                return sanitizeUploadedImage(image, currentSrc);
              }

              const fileToUpload =
                image?.file instanceof File
                  ? image.file
                  : await mediaSourceToFile(
                      currentSrc,
                      image?.name || `blog-block-image-${index + 1}`,
                    );

              const uploadedUrl = await uploadFileWithFallback(
                ["/uploads/cover-photo", "/uploads/media"],
                fileToUpload,
              );

              return sanitizeUploadedImage(image, uploadedUrl);
            }),
          );

          return {
            ...block,
            images: uploadedImages,
          };
        }),
      );
    };

    const uploadBlockVideos = async (blocks) => {
      return Promise.all(
        blocks.map(async (block) => {
          if (block.type !== "video" || !Array.isArray(block.videos)) {
            return block;
          }

          const uploadedVideos = await Promise.all(
            block.videos.map(async (video, index) => {
              const currentSrc = video?.src || video?.url;
              if (
                typeof currentSrc === "string" &&
                !isDataUrl(currentSrc) &&
                !isBlobUrl(currentSrc) &&
                !isLocalUploadUrl(currentSrc)
              ) {
                return sanitizeUploadedVideo(video, currentSrc);
              }

              if (
                !(video?.file instanceof File) &&
                !isDataUrl(currentSrc) &&
                !isBlobUrl(currentSrc) &&
                !isLocalUploadUrl(currentSrc)
              ) {
                return video;
              }

              const fileToUpload =
                video?.file instanceof File
                  ? video.file
                  : await mediaSourceToFile(
                      currentSrc,
                      video?.name || `blog-block-video-${index + 1}`,
                    );

              const uploadedUrl = await uploadFileWithFallback(
                ["/uploads/upload", "/uploads/media"],
                fileToUpload,
              );

              return sanitizeUploadedVideo(video, uploadedUrl);
            }),
          );

          return {
            ...block,
            videos: uploadedVideos,
          };
        }),
      );
    };

    const uploadAudioTracks = async (blocks) => {
      return Promise.all(
        blocks.map(async (block) => {
          if (block.type !== "audio" || !Array.isArray(block.audioTracks)) {
            return block;
          }

          const uploadedTracks = await Promise.all(
            block.audioTracks.map(async (track, index) => {
              if (track?.type !== "local") {
                return track;
              }

              const currentSrc = track?.src || track?.url;
              if (
                typeof currentSrc === "string" &&
                !isDataUrl(currentSrc) &&
                !isBlobUrl(currentSrc) &&
                !isLocalUploadUrl(currentSrc)
              ) {
                return sanitizeUploadedAudioTrack(track, currentSrc);
              }

              if (
                !(track?.file instanceof File) &&
                !isDataUrl(currentSrc) &&
                !isBlobUrl(currentSrc) &&
                !isLocalUploadUrl(currentSrc)
              ) {
                return track;
              }

              const fileToUpload =
                track?.file instanceof File
                  ? track.file
                  : await mediaSourceToFile(
                      currentSrc,
                      track?.name || `blog-audio-track-${index + 1}`,
                    );

              const uploadedUrl = await uploadFileWithFallback(
                ["/uploads/upload"],
                fileToUpload,
              );

              return sanitizeUploadedAudioTrack(track, uploadedUrl);
            }),
          );

          return {
            ...block,
            audioTracks: uploadedTracks,
          };
        }),
      );
    };

    // Extract content summary and all media from blocks
    const textContent = formData.blocks
      .filter((b) => b.type === "text")
      .map((b) => b.content)
      .join("\n\n");

    let coverImageValue = null;
    let normalizedBlocks = formData.blocks;

    try {
      coverImageValue = await uploadCoverImage(formData.coverImage);

      normalizedBlocks = await uploadBlockImages(formData.blocks);
      normalizedBlocks = await uploadBlockVideos(normalizedBlocks);
      normalizedBlocks = await uploadAudioTracks(normalizedBlocks);
    } catch (uploadError) {
      console.error("Failed to upload blog media:", uploadError);
      toast.error("Failed to upload one or more blog media files");
      return;
    }

    const allImages = normalizedBlocks
      .filter((b) => b.type === "image")
      .flatMap((b) => b.images || []);

    const allVideos = normalizedBlocks
      .filter((b) => b.type === "video")
      .flatMap((b) => b.videos || []);

    const allYoutube = normalizedBlocks
      .filter((b) => b.type === "youtube")
      .flatMap((b) => b.youtubeLinks || []);

    const allAudio = normalizedBlocks
      .filter((b) => b.type === "audio")
      .flatMap((b) => b.audioTracks || []);

    if (
      !formData.title.trim() ||
      !formData.author.trim() ||
      !textContent.trim()
    ) {
      toast.error(
        "Please fill in title, author, and at least some text content",
      );
      return;
    }

    // Prepare blog data
    const blogData = {
      title: formData.title,
      author: formData.author,
      category: formData.category,
      location: formData.location || "",
      coverImage: coverImageValue,
      excerpt: formData.excerpt,
      content: textContent,
      blocks: normalizedBlocks,
      images: allImages,
      videos: allVideos,
      youtubeLinks: allYoutube,
      audioTracks: allAudio,
      tags: formData.tags || [],
      titleStyle: formData.titleStyle || {},
    };

    if (containsUnsafeMediaValue(blogData)) {
      toast.error("Some media is still local/base64. Please retry upload.");
      return;
    }

    try {
      setIsSaving(true);
      if (editingBlog) {
        // Update existing blog
        await blogApi.updateBlog(editingBlog.id, blogData);
        setBlogs(
          blogs.map((blog) =>
            blog.id === editingBlog.id
              ? { ...blog, ...blogData, createdAt: blog.createdAt }
              : blog,
          ),
        );
        toast.success("Blog updated successfully");
      } else {
        // Create new blog
        const response = await blogApi.createBlog({
          ...blogData,
          status: "DRAFT",
        });
        const newBlog = response.data || response;
        setBlogs([newBlog, ...blogs]);
        toast.success("Blog created successfully");
      }
      handleCancel();
    } catch (error) {
      console.error("Failed to save blog:", error);
      toast.error(error.message || "Failed to save blog");
    } finally {
      setIsSaving(false);
    }
  };

  // Edit blog
  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setIsCreating(true);
  };

  // Publish blog
  const handlePublish = async (id) => {
    try {
      await blogApi.publishBlog(id);
      setBlogs(
        blogs.map((blog) =>
          blog.id === id ? { ...blog, status: "PUBLISHED" } : blog,
        ),
      );
      toast.success("Blog published successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to publish blog";
      console.error("Failed to publish blog:", message, error);
      toast.error(message);
    }
  };

  // Delete blog
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) {
      return;
    }

    try {
      setIsDeleting(id);
      await blogApi.deleteBlog(id);
      setBlogs(blogs.filter((blog) => blog.id !== id));
      toast.success("Blog deleted successfully");
    } catch (error) {
      console.error("Failed to delete blog:", error);
      toast.error("Failed to delete blog");
    } finally {
      setIsDeleting(null);
    }
  };

  // Duplicate blog
  const handleDuplicate = async (blog) => {
    try {
      const uploadCollectionWithDataUrlSupport = async (
        items,
        endpoints,
        filenamePrefix,
      ) => {
        const sourceItems = Array.isArray(items) ? items : [];
        return Promise.all(
          sourceItems.map(async (item, index) => {
            const source =
              typeof item === "string" ? item : item?.src || item?.url || null;

            if (
              typeof source === "string" &&
              !isDataUrl(source) &&
              !isBlobUrl(source) &&
              !isLocalUploadUrl(source)
            ) {
              return item;
            }

            if (!source) {
              return item;
            }

            const fileToUpload = await mediaSourceToFile(
              source,
              `${filenamePrefix}-${index + 1}`,
            );
            const uploadedUrl = await uploadFileWithFallback(
              endpoints,
              fileToUpload,
            );

            if (typeof item === "string") {
              return uploadedUrl;
            }

            return {
              ...item,
              src: uploadedUrl,
              url: uploadedUrl,
              file: undefined,
              preview: undefined,
            };
          }),
        );
      };

      const normalizeDuplicateBlocks = async (blocks) => {
        return Promise.all(
          (Array.isArray(blocks) ? blocks : []).map(async (block) => {
            if (block.type === "image" && Array.isArray(block.images)) {
              return {
                ...block,
                images: await uploadCollectionWithDataUrlSupport(
                  block.images,
                  ["/uploads/cover-photo", "/uploads/media"],
                  "blog-duplicate-image",
                ),
              };
            }

            if (block.type === "video" && Array.isArray(block.videos)) {
              return {
                ...block,
                videos: await uploadCollectionWithDataUrlSupport(
                  block.videos,
                  ["/uploads/upload", "/uploads/media"],
                  "blog-duplicate-video",
                ),
              };
            }

            if (block.type === "audio" && Array.isArray(block.audioTracks)) {
              return {
                ...block,
                audioTracks: await Promise.all(
                  block.audioTracks.map(async (track, index) => {
                    if (track?.type && track.type !== "local") {
                      return track;
                    }

                    const source = track?.src || track?.url;
                    if (
                      typeof source !== "string" ||
                      (!isDataUrl(source) &&
                        !isBlobUrl(source) &&
                        !isLocalUploadUrl(source))
                    ) {
                      return track;
                    }

                    const fileToUpload = await mediaSourceToFile(
                      source,
                      `blog-duplicate-audio-${index + 1}`,
                    );
                    const uploadedUrl = await uploadFileWithFallback(
                      ["/uploads/upload"],
                      fileToUpload,
                    );

                    return {
                      ...track,
                      src: uploadedUrl,
                      url: uploadedUrl,
                      file: undefined,
                      preview: undefined,
                    };
                  }),
                ),
              };
            }

            return block;
          }),
        );
      };

      const normalizedCoverImage =
        typeof blog.coverImage === "string" &&
        (isDataUrl(blog.coverImage) ||
          isBlobUrl(blog.coverImage) ||
          isLocalUploadUrl(blog.coverImage))
          ? await uploadFileWithFallback(
              ["/uploads/cover-photo"],
              await mediaSourceToFile(blog.coverImage, "blog-duplicate-cover"),
            )
          : blog.coverImage;

      const normalizedBlocks = await normalizeDuplicateBlocks(blog.blocks || []);

      const fallbackImages = await uploadCollectionWithDataUrlSupport(
        blog.images || [],
        ["/uploads/cover-photo", "/uploads/media"],
        "blog-duplicate-image-fallback",
      );
      const fallbackVideos = await uploadCollectionWithDataUrlSupport(
        blog.videos || [],
        ["/uploads/upload", "/uploads/media"],
        "blog-duplicate-video-fallback",
      );
      const fallbackAudio = await uploadCollectionWithDataUrlSupport(
        (blog.audioTracks || []).filter((track) => !track?.type || track.type === "local"),
        ["/uploads/upload"],
        "blog-duplicate-audio-fallback",
      );

      const blockImages = normalizedBlocks
        .filter((b) => b.type === "image")
        .flatMap((b) => b.images || []);
      const blockVideos = normalizedBlocks
        .filter((b) => b.type === "video")
        .flatMap((b) => b.videos || []);
      const blockAudio = normalizedBlocks
        .filter((b) => b.type === "audio")
        .flatMap((b) => b.audioTracks || []);

      const normalizedImages = blockImages.length > 0 ? blockImages : fallbackImages;
      const normalizedVideos = blockVideos.length > 0 ? blockVideos : fallbackVideos;
      const normalizedAudio =
        blockAudio.length > 0
          ? blockAudio
          : [
              ...fallbackAudio,
              ...(blog.audioTracks || []).filter(
                (track) => track?.type && track.type !== "local",
              ),
            ];

      // Create a copy of the blog data
      const duplicatedBlog = {
        title: `${blog.title} (Copy)`,
        author: blog.author,
        category: blog.category,
        location: blog.location || "",
        coverImage: normalizedCoverImage,
        excerpt: blog.excerpt,
        content: blog.content,
        blocks: normalizedBlocks,
        images: normalizedImages,
        videos: normalizedVideos,
        youtubeLinks: blog.youtubeLinks || [],
        audioTracks: normalizedAudio,
        tags: blog.tags || [],
        titleStyle: blog.titleStyle || {},
        status: "DRAFT",
      };

      if (containsUnsafeMediaValue(duplicatedBlog)) {
        toast.error(
          "Duplicate blocked: media still contains local/base64 sources.",
        );
        return;
      }

      const response = await blogApi.createBlog(duplicatedBlog);
      const newBlog = response.data || response;
      setBlogs([newBlog, ...blogs]);
      toast.success("Blog duplicated successfully");
    } catch (error) {
      console.error("Failed to duplicate blog:", error);
      toast.error("Failed to duplicate blog");
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsCreating(false);
    setEditingBlog(null);
  };

  if (isCreating) {
    return (
      <BlogEditor
        blog={editingBlog}
        onSave={handleSaveBlog}
        onCancel={handleCancel}
        editingId={editingBlog?.id}
        isSaving={isSaving}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation Tabs */}
      <div className="bg-zinc-950 rounded-lg p-2 flex gap-2">
        <button
          onClick={() => navigate("/admin/blogs")}
          className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
            location.pathname === "/admin/blogs"
              ? "bg-[#403838] text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          Blog Posts
        </button>
        <button
          onClick={() => navigate("/admin/blog-hero-blocks")}
          className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
            location.pathname === "/admin/blog-hero-blocks"
              ? "bg-[#403838] text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          Hero Slideshow
        </button>
      </div>

      {/* Header with New Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center bg-zinc-950 text-white p-3 sm:p-4 rounded-lg">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold">Blog Management</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Create, edit, and manage your blog posts with multimedia support
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 bg-[#403838] text-white rounded-lg hover:bg-[#4f4545] text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "+ New Blog Post"}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-400 mx-auto mb-3"></div>
            <p className="text-zinc-400 text-xs">Loading blogs...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && blogs.length === 0 && (
        <div className="text-center py-10 bg-zinc-950 rounded-lg border border-zinc-800">
          <h3 className="text-base font-semibold text-zinc-200 mb-2">
            No blogs yet
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
            Create your first blog post to get started
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-[#403838] text-white rounded-lg hover:bg-[#4f4545] text-xs font-semibold"
          >
            Create Blog Post
          </button>
        </div>
      )}

      {/* Blog List */}
      {!isLoading && blogs.length > 0 && (
        <BlogList
          blogs={blogs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPublish={handlePublish}
          onDuplicate={handleDuplicate}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
