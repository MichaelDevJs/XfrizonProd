import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import blogApi from "../../api/blogApi";
import api from "../../api/axios";
import BlogEditor from "./blog/BlogEditor";
import BlogList from "./blog/BlogList";
import BlogPlannerCalendar from "./blog/BlogPlannerCalendar";

const BLOG_PLANNER_SETTINGS_KEY = "blogPlannerSchedule";
const BLOG_PLANNER_LOCAL_KEY = "xfrizonBlogPlannerScheduleV1";
const BLOG_ACTIVE_SECTION_STORAGE_KEY = "xfrizonAdminBlogActiveSectionV1";
const BLOG_SECTIONS = new Set(["posts", "planner"]);
const BLOG_PLANNER_CHUNK_COUNT_KEY = "blogPlannerScheduleChunkCount";
const BLOG_PLANNER_CHUNK_KEY_PREFIX = "blogPlannerScheduleChunk_";
const BLOG_PLANNER_CHUNK_SIZE = 12000;
const BLOG_PLANNER_MAX_COMMENTS_PER_ENTRY = 20;
const BLOG_PLANNER_MAX_COMMENT_LENGTH = 400;

const normalizeBlogSection = (value) => {
  const section = String(value || "")
    .trim()
    .toLowerCase();
  return BLOG_SECTIONS.has(section) ? section : "";
};

const sanitizePlannerEntries = (entries) => {
  if (!Array.isArray(entries)) return [];

  return entries.map((entry, index) => {
    const rawComments = Array.isArray(entry?.comments) ? entry.comments : [];
    const comments = rawComments
      .map((comment) => String(comment || "").trim())
      .filter(Boolean)
      .slice(0, BLOG_PLANNER_MAX_COMMENTS_PER_ENTRY)
      .map((comment) => comment.slice(0, BLOG_PLANNER_MAX_COMMENT_LENGTH));

    return {
      id: String(entry?.id || `${Date.now()}-${index}`),
      date: String(entry?.date || ""),
      topic: String(entry?.topic || "").trim(),
      time: String(entry?.time || "").trim(),
      assignee: String(entry?.assignee || "").trim(),
      status: String(entry?.status || "Planned").trim() || "Planned",
      tagColor: String(entry?.tagColor || "").trim(),
      comments,
      createdAt: String(entry?.createdAt || new Date().toISOString()),
    };
  });
};

const parsePlannerRaw = (raw) => {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? sanitizePlannerEntries(parsed) : [];
};

const chunkString = (value, chunkSize) => {
  const safeValue = String(value || "");
  const size = Math.max(1, Number(chunkSize) || BLOG_PLANNER_CHUNK_SIZE);
  const chunks = [];
  for (let i = 0; i < safeValue.length; i += size) {
    chunks.push(safeValue.slice(i, i + size));
  }
  return chunks;
};

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
    return Object.values(value).some((entry) =>
      containsUnsafeMediaValue(entry),
    );
  }

  return false;
};

export default function BlogManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const plannerSyncTimeoutRef = useRef(null);
  const [blogs, setBlogs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [activeSection, setActiveSection] = useState(() => {
    const fromUrl = normalizeBlogSection(
      new URLSearchParams(String(location?.search || "")).get("tab"),
    );
    if (fromUrl) return fromUrl;

    try {
      const fromStorage = normalizeBlogSection(
        localStorage.getItem(BLOG_ACTIVE_SECTION_STORAGE_KEY),
      );
      if (fromStorage) return fromStorage;
    } catch {
      // Ignore local storage access failures.
    }

    return "posts";
  });
  const [plannerEntries, setPlannerEntries] = useState([]);
  const [isPlannerSaving, setIsPlannerSaving] = useState(false);
  const [plannerChunkCount, setPlannerChunkCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  // Fetch blogs on component mount
  useEffect(() => {
    fetchBlogs();
    fetchPlannerEntries();

    return () => {
      if (plannerSyncTimeoutRef.current) {
        clearTimeout(plannerSyncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== "/admin/blogs") return;

    const fromUrl = normalizeBlogSection(
      new URLSearchParams(String(location.search || "")).get("tab"),
    );

    if (fromUrl && fromUrl !== activeSection) {
      setActiveSection(fromUrl);
      return;
    }

    if (!fromUrl) {
      navigate(`/admin/blogs?tab=${activeSection}`, { replace: true });
    }
  }, [activeSection, location.pathname, location.search, navigate]);

  useEffect(() => {
    try {
      localStorage.setItem(BLOG_ACTIVE_SECTION_STORAGE_KEY, activeSection);
    } catch {
      // Ignore local storage access failures.
    }
  }, [activeSection]);

  const setSection = (nextSection) => {
    const safeSection = normalizeBlogSection(nextSection) || "posts";
    setActiveSection(safeSection);
    navigate(`/admin/blogs?tab=${safeSection}`);
  };

  const fetchPlannerEntries = async () => {
    try {
      const response = await api.get("/homepage-settings");
      const settings = response?.data || {};
      const rawPlanner = settings[BLOG_PLANNER_SETTINGS_KEY];

      if (rawPlanner) {
        const parsed = parsePlannerRaw(rawPlanner);
        setPlannerEntries(parsed);
        setPlannerChunkCount(0);
        localStorage.setItem(BLOG_PLANNER_LOCAL_KEY, JSON.stringify(parsed));
        return;
      }

      const chunkCount = Number(settings[BLOG_PLANNER_CHUNK_COUNT_KEY] || 0);
      if (Number.isFinite(chunkCount) && chunkCount > 0) {
        const combined = Array.from({ length: chunkCount }, (_, index) => {
          const key = `${BLOG_PLANNER_CHUNK_KEY_PREFIX}${index + 1}`;
          return String(settings[key] || "");
        }).join("");

        const parsed = parsePlannerRaw(combined);
        setPlannerEntries(parsed);
        setPlannerChunkCount(chunkCount);
        localStorage.setItem(BLOG_PLANNER_LOCAL_KEY, JSON.stringify(parsed));
        return;
      }
    } catch (error) {
      console.warn(
        "Could not load planner from API, using local backup",
        error,
      );
    }

    try {
      const localRaw = localStorage.getItem(BLOG_PLANNER_LOCAL_KEY);
      if (localRaw) {
        const parsed = parsePlannerRaw(localRaw);
        setPlannerEntries(parsed);
      }
    } catch (error) {
      console.warn("Could not parse local planner backup", error);
    }
  };

  const syncPlannerEntries = async (entriesToSync) => {
    try {
      setIsPlannerSaving(true);
      const sanitizedEntries = sanitizePlannerEntries(entriesToSync);
      const serialized = JSON.stringify(sanitizedEntries);
      const chunks = chunkString(serialized, BLOG_PLANNER_CHUNK_SIZE);

      const payload = {
        [BLOG_PLANNER_SETTINGS_KEY]: chunks.length === 1 ? chunks[0] : "",
        [BLOG_PLANNER_CHUNK_COUNT_KEY]: String(chunks.length),
      };

      chunks.forEach((chunk, index) => {
        payload[`${BLOG_PLANNER_CHUNK_KEY_PREFIX}${index + 1}`] = chunk;
      });

      const staleChunkCount = Math.max(0, Number(plannerChunkCount) || 0);
      if (staleChunkCount > chunks.length) {
        for (let i = chunks.length + 1; i <= staleChunkCount; i += 1) {
          payload[`${BLOG_PLANNER_CHUNK_KEY_PREFIX}${i}`] = "";
        }
      }

      await api.post("/homepage-settings/bulk", payload);
      setPlannerChunkCount(chunks.length);
    } catch (error) {
      console.error("Failed to save planner entries:", error);
      toast.error("Planner auto-save failed. Local backup kept.");
    } finally {
      setIsPlannerSaving(false);
    }
  };

  const handlePlannerEntriesChange = (nextEntries) => {
    const safeEntries = sanitizePlannerEntries(nextEntries);
    setPlannerEntries(safeEntries);
    localStorage.setItem(BLOG_PLANNER_LOCAL_KEY, JSON.stringify(safeEntries));

    if (plannerSyncTimeoutRef.current) {
      clearTimeout(plannerSyncTimeoutRef.current);
    }

    plannerSyncTimeoutRef.current = setTimeout(() => {
      syncPlannerEntries(safeEntries);
    }, 700);
  };

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
        blogList = blogList.map((blog) => {
          const parsedTitleStyle = blog.titleStyle
            ? typeof blog.titleStyle === "string"
              ? JSON.parse(blog.titleStyle)
              : blog.titleStyle
            : {};

          return {
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
            titleStyle: parsedTitleStyle,
            authorProfileImage:
              blog.authorProfileImage ||
              blog.authorAvatar ||
              blog.authorImage ||
              parsedTitleStyle?.authorProfileImage ||
              null,
            tags: blog.tags
              ? typeof blog.tags === "string"
                ? JSON.parse(blog.tags)
                : blog.tags
              : [],
          };
        });

        // Build author name → image map and backfill blogs missing an avatar
        const authorImageMap = {};
        blogList.forEach((b) => {
          const name = (b.author || "").toLowerCase().trim();
          if (name && b.authorProfileImage && !authorImageMap[name]) {
            authorImageMap[name] = b.authorProfileImage;
          }
        });
        blogList = blogList.map((b) => {
          if (!b.authorProfileImage) {
            const name = (b.author || "").toLowerCase().trim();
            if (name && authorImageMap[name]) {
              return { ...b, authorProfileImage: authorImageMap[name] };
            }
          }
          return b;
        });
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

    const uploadAuthorProfileImage = async (authorProfileImage) => {
      if (!authorProfileImage) return null;
      if (
        typeof authorProfileImage === "string" &&
        !isDataUrl(authorProfileImage) &&
        !isBlobUrl(authorProfileImage) &&
        !isLocalUploadUrl(authorProfileImage)
      ) {
        return authorProfileImage;
      }

      const fileToUpload =
        authorProfileImage instanceof File
          ? authorProfileImage
          : await mediaSourceToFile(
              authorProfileImage,
              "blog-author-profile-image",
            );

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
    let authorProfileImageValue = null;
    let normalizedBlocks = formData.blocks;

    try {
      coverImageValue = await uploadCoverImage(formData.coverImage);
      authorProfileImageValue = await uploadAuthorProfileImage(
        formData.authorProfileImage,
      );

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

    const normalizedTitleStyle = {
      ...(formData.titleStyle || {}),
      authorProfileImage: authorProfileImageValue || "",
    };

    // Prepare blog data
    const blogData = {
      title: formData.title,
      author: formData.author,
      authorProfileImage: authorProfileImageValue,
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
      titleStyle: normalizedTitleStyle,
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

      const normalizedBlocks = await normalizeDuplicateBlocks(
        blog.blocks || [],
      );

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
        (blog.audioTracks || []).filter(
          (track) => !track?.type || track.type === "local",
        ),
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

      const normalizedImages =
        blockImages.length > 0 ? blockImages : fallbackImages;
      const normalizedVideos =
        blockVideos.length > 0 ? blockVideos : fallbackVideos;
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
        authorProfileImage:
          blog.authorProfileImage ||
          blog.authorAvatar ||
          blog.authorImage ||
          blog.titleStyle?.authorProfileImage ||
          null,
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
        titleStyle: {
          ...(blog.titleStyle || {}),
          authorProfileImage:
            blog.authorProfileImage ||
            blog.authorAvatar ||
            blog.authorImage ||
            blog.titleStyle?.authorProfileImage ||
            "",
        },
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
      <div className="bg-zinc-950 rounded-lg p-2 flex gap-2 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => {
            setSection("posts");
          }}
          className={`shrink-0 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
            location.pathname === "/admin/blogs" && activeSection === "posts"
              ? "bg-[#403838] text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          Blog Posts
        </button>
        <button
          onClick={() => {
            setSection("planner");
          }}
          className={`shrink-0 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
            location.pathname === "/admin/blogs" && activeSection === "planner"
              ? "bg-[#403838] text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          Content Planner
        </button>
        <button
          onClick={() => navigate("/admin/blog-hero-blocks")}
          className={`shrink-0 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
            location.pathname === "/admin/blog-hero-blocks"
              ? "bg-[#403838] text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          Hero Slideshow
        </button>
      </div>

      {/* Header with New Button */}
      {activeSection !== "ai" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center bg-zinc-950 text-white p-3 sm:p-4 rounded-lg">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold">
              {activeSection === "planner" ? "Blog Planner" : "Blog Management"}
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              {activeSection === "planner"
                ? "Plan topics by date/week, assign writers, and leave editorial comments"
                : "Create, edit, and manage your blog posts with multimedia support"}
            </p>
          </div>
          {activeSection === "posts" && (
            <button
              onClick={() => setIsCreating(true)}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-[#403838] text-white rounded-lg hover:bg-[#4f4545] text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "+ New Blog Post"}
            </button>
          )}
        </div>
      )}

      {activeSection === "planner" && (
        <BlogPlannerCalendar
          entries={plannerEntries}
          onChange={handlePlannerEntriesChange}
          isSaving={isPlannerSaving}
        />
      )}

      {/* Loading State */}
      {activeSection === "posts" && isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-400 mx-auto mb-3"></div>
            <p className="text-zinc-400 text-xs">Loading blogs...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeSection === "posts" && !isLoading && blogs.length === 0 && (
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
      {activeSection === "posts" && !isLoading && blogs.length > 0 && (
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
