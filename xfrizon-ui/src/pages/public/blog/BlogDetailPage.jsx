import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUser,
  FaMusic,
  FaHeart,
  FaRegHeart,
  FaReply,
  FaInstagram,
  FaShareAlt,
  FaWhatsapp,
} from "react-icons/fa";
import { LuSendHorizontal } from "react-icons/lu";
import blogApi from "../../../api/blogApi";
import useSeo from "../../../hooks/useSeo";
import { getSiteBaseUrl, toAbsoluteSiteUrl } from "../../../utils/siteUrl";
import { renderRichText } from "../../admin/blog/utils/blockHelpers";

function ReplyBlock({
  commentId,
  value,
  submittingId,
  onChange,
  onSubmit,
  onClose,
}) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div ref={ref} className="mt-3">
      <div className="flex items-center gap-2 border-b border-gray-600">
        <textarea
          value={value}
          onChange={(e) => onChange(commentId, e.target.value)}
          rows={1}
          maxLength={1000}
          placeholder="Write a reply..."
          autoFocus
          className="flex-1 bg-transparent border-0 text-gray-100 px-1 pb-1.5 pt-0 text-sm focus:outline-none resize-none leading-tight"
        />
        <button
          type="button"
          onClick={() => onSubmit(commentId)}
          disabled={submittingId === commentId || !value.trim()}
          className="inline-flex items-center justify-center pb-1.5 text-red-400 hover:text-red-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submittingId === commentId ? (
            "Posting..."
          ) : (
            <LuSendHorizontal className="text-sm" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [replyInputs, setReplyInputs] = useState({});
  const [replySubmittingId, setReplySubmittingId] = useState(null);
  const [replyError, setReplyError] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [currentContentPage, setCurrentContentPage] = useState(0);
  const shareMenuRef = useRef(null);
  const videoRefs = useRef({});

  // Defensive fallback for blog fields
  const safeBlog = blog || {};
  const safeTitle = safeBlog.title || "Untitled Blog";
  const safeBlocks = Array.isArray(safeBlog.blocks) ? safeBlog.blocks : [];
  const safeImages = Array.isArray(safeBlog.images) ? safeBlog.images : [];
  const safeCoverImage = safeBlog.coverImage || safeImages[0]?.src || "";
  const safeExcerpt =
    safeBlog.excerpt || safeBlog.content || "No description available.";
  const safeCategory = safeBlog.category || "General";
  const safeAuthor = safeBlog.author || "Unknown";
  const safeAuthorProfileImage =
    safeBlog.authorProfileImage ||
    safeBlog.authorAvatar ||
    safeBlog.authorImage ||
    (typeof safeBlog.titleStyle === "string"
      ? (() => {
          try {
            return JSON.parse(safeBlog.titleStyle)?.authorProfileImage || "";
          } catch {
            return "";
          }
        })()
      : safeBlog.titleStyle?.authorProfileImage || "");
  const safePublishedAt = safeBlog.publishedAt || safeBlog.createdAt || "";
  const safeTitleStyle =
    typeof safeBlog.titleStyle === "object" && safeBlog.titleStyle !== null
      ? safeBlog.titleStyle
      : {};

  // Log blog data for debugging
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.hostname !== "localhost"
  ) {
    // Only log in production
    console.log("BlogDetailPage blog data:", safeBlog);
  }

  const getAbsoluteMediaUrl = (path) => {
    if (!path) return "";
    if (String(path).startsWith("http")) return String(path);
    const normalized = String(path).startsWith("/")
      ? String(path)
      : `/${String(path)}`;
    if (typeof window !== "undefined") {
      return `${window.location.origin}${normalized}`;
    }
    return `${getSiteBaseUrl()}${normalized}`;
  };

  const authorProfileImageUrl = safeAuthorProfileImage
    ? getAbsoluteMediaUrl(safeAuthorProfileImage)
    : "";

  useEffect(() => {
    fetchBlogDetail();
  }, [id]);

  useEffect(() => {
    setCurrentContentPage(0);
  }, [id]);

  useEffect(() => {
    fetchComments();
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return;
    fetchCommentNotifications();
  }, [id]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
        setShareMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Load embed scripts and process embeds after blog data is loaded
  useEffect(() => {
    if (!blog) return;

    // Load Instagram embed script
    const instagramScript = document.createElement("script");
    instagramScript.src = "https://www.instagram.com/embed.js";
    instagramScript.async = true;
    document.body.appendChild(instagramScript);

    // Load TikTok embed script
    const tiktokScript = document.createElement("script");
    tiktokScript.src = "https://www.tiktok.com/embed/v1/embed.js";
    tiktokScript.async = true;
    document.body.appendChild(tiktokScript);

    // Load Twitter embed script
    const twitterScript = document.createElement("script");
    twitterScript.src = "https://platform.twitter.com/widgets.js";
    twitterScript.async = true;
    document.body.appendChild(twitterScript);

    // Process embeds when scripts load
    return () => {
      // Cleanup if needed
    };
  }, [blog]);

  const fetchBlogDetail = async () => {
    try {
      setLoading(true);
      const [detailResult, allBlogsResult] = await Promise.allSettled([
        blogApi.getBlogById(id),
        blogApi.getAllBlogs(),
      ]);

      if (detailResult.status === "rejected") throw detailResult.reason;
      const response = detailResult.value;

      // Handle API response structure
      let blogData = response.data;

      // Parse JSON strings into arrays
      if (blogData) {
        // Parse top-level fields
        const parsedBlocks = blogData.blocks
          ? typeof blogData.blocks === "string"
            ? JSON.parse(blogData.blocks)
            : blogData.blocks
          : [];

        // Also parse youtubeLinks within each block if needed
        const processedBlocks = Array.isArray(parsedBlocks)
          ? parsedBlocks.map((block) => ({
              ...block,
              youtubeLinks: block.youtubeLinks
                ? typeof block.youtubeLinks === "string"
                  ? JSON.parse(block.youtubeLinks)
                  : block.youtubeLinks
                : [],
              videos: block.videos
                ? typeof block.videos === "string"
                  ? JSON.parse(block.videos)
                  : block.videos
                : [],
              images: block.images
                ? typeof block.images === "string"
                  ? JSON.parse(block.images)
                  : block.images
                : [],
              audioTracks: block.audioTracks
                ? typeof block.audioTracks === "string"
                  ? JSON.parse(block.audioTracks)
                  : block.audioTracks
                : [],
              embeds: block.embeds
                ? typeof block.embeds === "string"
                  ? JSON.parse(block.embeds)
                  : block.embeds
                : [],
            }))
          : [];

        blogData = {
          ...blogData,
          blocks: processedBlocks,
          images: blogData.images
            ? typeof blogData.images === "string"
              ? JSON.parse(blogData.images)
              : blogData.images
            : [],
          videos: blogData.videos
            ? typeof blogData.videos === "string"
              ? JSON.parse(blogData.videos)
              : blogData.videos
            : [],
          youtubeLinks: blogData.youtubeLinks
            ? typeof blogData.youtubeLinks === "string"
              ? JSON.parse(blogData.youtubeLinks)
              : blogData.youtubeLinks
            : [],
          audioTracks: blogData.audioTracks
            ? typeof blogData.audioTracks === "string"
              ? JSON.parse(blogData.audioTracks)
              : blogData.audioTracks
            : [],
          titleStyle: blogData.titleStyle
            ? typeof blogData.titleStyle === "string"
              ? JSON.parse(blogData.titleStyle)
              : blogData.titleStyle
            : {},
          tags: blogData.tags
            ? typeof blogData.tags === "string"
              ? JSON.parse(blogData.tags)
              : blogData.tags
            : [],
        };
      }

      // If this blog has no author image, look it up from other articles by the same author name
      if (allBlogsResult.status === "fulfilled" && blogData) {
        const allBlogsList = allBlogsResult.value?.data
          ? allBlogsResult.value.data.content || allBlogsResult.value.data
          : allBlogsResult.value;
        if (Array.isArray(allBlogsList)) {
          const authorImageMap = {};
          allBlogsList.forEach((b) => {
            const name = (b.author || "").toLowerCase().trim();
            const img =
              b.authorProfileImage ||
              b.authorAvatar ||
              b.authorImage ||
              (typeof b.titleStyle === "string"
                ? (() => {
                    try {
                      return JSON.parse(b.titleStyle)?.authorProfileImage || "";
                    } catch {
                      return "";
                    }
                  })()
                : b.titleStyle?.authorProfileImage || "");
            if (name && img && !authorImageMap[name]) {
              authorImageMap[name] = img;
            }
          });
          const existingImage =
            blogData.authorProfileImage ||
            blogData.authorAvatar ||
            blogData.authorImage ||
            blogData.titleStyle?.authorProfileImage ||
            "";
          if (!existingImage) {
            const authorName = (blogData.author || "").toLowerCase().trim();
            if (authorName && authorImageMap[authorName]) {
              blogData = {
                ...blogData,
                authorProfileImage: authorImageMap[authorName],
              };
            }
          }
        }
      }

      setBlog(blogData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch blog:", err);
      setError("Failed to load blog article");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await blogApi.getBlogComments(id);
      const payload = response?.data ?? response;
      setComments(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error("Failed to load comments:", err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchCommentNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await blogApi.getCommentNotifications();
      const payload = response?.data ?? response ?? {};
      setNotifications(
        Array.isArray(payload.notifications) ? payload.notifications : [],
      );
      setUnreadNotificationCount(Number(payload.unreadCount || 0));
    } catch (err) {
      console.error("Failed to load comment notifications:", err);
      setNotifications([]);
      setUnreadNotificationCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const formatCommentDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const rawHours = date.getHours();
    const period = rawHours >= 12 ? "PM" : "AM";
    const hours12 = rawHours % 12 || 12;
    const hours = String(hours12).padStart(2, "0");

    return `${day}.${month}.${year} ${hours}:${minutes} ${period}`;
  };

  const isLoggedIn = Boolean(localStorage.getItem("userToken"));
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const currentUserId = currentUser?.id || currentUser?.userId || null;

  const commentChildrenMap = comments.reduce((acc, comment) => {
    const parentId = comment.parentCommentId || null;
    if (!acc[parentId]) {
      acc[parentId] = [];
    }
    acc[parentId].push(comment);
    return acc;
  }, {});

  const topLevelComments = commentChildrenMap[null] || [];

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const content = commentInput.trim();
    if (!content) return;

    try {
      setCommentSubmitting(true);
      setCommentError("");
      await blogApi.createBlogComment(id, { content });
      await fetchComments();
      setCommentInput("");
    } catch (err) {
      console.error("Failed to add comment:", err);
      setCommentError(
        err?.message ||
          err?.error ||
          "Failed to post comment. Please try again.",
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const toggleReplyInput = (commentId) => {
    setReplyInputs((prev) => {
      if (Object.prototype.hasOwnProperty.call(prev, commentId)) {
        const next = { ...prev };
        delete next[commentId];
        return next;
      }
      return { ...prev, [commentId]: "" };
    });
    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
  };

  const closeReplyInput = (commentId) => {
    setReplyInputs((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
  };

  const handleReplyChange = (commentId, value) => {
    setReplyInputs((prev) => ({ ...prev, [commentId]: value }));
  };

  const handleSubmitReply = async (commentId) => {
    const replyContent = (replyInputs[commentId] || "").trim();
    if (!replyContent) return;

    try {
      setReplySubmittingId(commentId);
      setReplyError("");
      await blogApi.createBlogComment(id, {
        content: replyContent,
        parentCommentId: commentId,
      });
      setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
      await fetchComments();
      await fetchCommentNotifications();
    } catch (err) {
      console.error("Failed to add reply:", err);
      setReplyError(
        err?.message || err?.error || "Failed to post reply. Please try again.",
      );
    } finally {
      setReplySubmittingId(null);
    }
  };

  const handleToggleLike = async (commentId) => {
    if (!isLoggedIn) {
      setCommentError("Please log in to like comments.");
      return;
    }

    try {
      const response = await blogApi.toggleBlogCommentLike(id, commentId);
      const payload = response?.data ?? response ?? {};
      const nextLikeCount = Number(payload.likeCount || 0);
      const nextLiked = Boolean(payload.liked);

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likeCount: nextLikeCount,
                likedByCurrentUser: nextLiked,
              }
            : comment,
        ),
      );

      await fetchCommentNotifications();
    } catch (err) {
      console.error("Failed to toggle comment like:", err);
      setCommentError(
        err?.message ||
          err?.error ||
          "Failed to like comment. Please try again.",
      );
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await blogApi.markCommentNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
      setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await blogApi.markAllCommentNotificationsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadNotificationCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Extract YouTube ID from various URL formats
  const getYoutubeId = (url) => {
    if (!url) return null;
    try {
      // Handle youtube.com/watch?v=ID
      const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (watchMatch) return watchMatch[1];

      // Handle youtu.be/ID
      const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (shortMatch) return shortMatch[1];

      // Handle URL with /embed/ already
      const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch) return embedMatch[1];

      // Handle direct ID (11-16 chars typically)
      if (url.match(/^[a-zA-Z0-9_-]+$/) && url.length >= 10 && url.length <= 20)
        return url;

      // Fallback - trim and return if it looks like an ID
      const trimmed = url.trim();
      if (trimmed.length >= 10) return trimmed;

      return null;
    } catch {
      return null;
    }
  };

  const shareSnippetSource =
    (blog?.excerpt || "").trim() ||
    String(blog?.content || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const shareSnippet = shareSnippetSource
    ? shareSnippetSource.length > 150
      ? `${shareSnippetSource.slice(0, 150).trim()}...`
      : shareSnippetSource
    : "Tap to read the full story on Xfrizon.";

  const createShareCardBlob = async () => {
    const width = 1080;
    const height = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0f0f0f");
    gradient.addColorStop(0.55, "#1d1d1d");
    gradient.addColorStop(1, "#111111");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const imageUrl = heroImage || blog.coverImage || null;
    if (imageUrl) {
      try {
        const img = await new Promise((resolve, reject) => {
          const loadedImg = new Image();
          loadedImg.crossOrigin = "anonymous";
          loadedImg.onload = () => resolve(loadedImg);
          loadedImg.onerror = reject;
          loadedImg.src = imageUrl;
        });

        const topHeight = 1040;
        const scale = Math.max(width / img.width, topHeight / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const dx = (width - drawWidth) / 2;
        const dy = (topHeight - drawHeight) / 2;
        ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

        // Dark overlay for contrast
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fillRect(0, 0, width, topHeight);
      } catch {
        // Continue with gradient background if image loading fails.
      }
    }

    // Top-left brand + CTA
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 38px Arial";
    ctx.fillText("XF EVENTS", 100, 110);
    ctx.fillStyle = "#f87171";
    ctx.font = "600 34px Arial";
    ctx.fillText("Read full story on xfrizon", 100, 160);

    // Lower card area
    ctx.fillStyle = "rgba(18, 18, 18, 0.92)";
    ctx.fillRect(60, 980, 960, 830);

    // Accent line
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(60, 980, 960, 12);

    // Category
    ctx.fillStyle = "#f87171";
    ctx.font = "600 36px Arial";
    ctx.fillText((blog.category || "BLOG").toUpperCase(), 100, 1065);

    // Title text wrapping
    const title = blog.title || "Xfrizon Blog";
    ctx.fillStyle = "#f3f4f6";
    ctx.font = "700 68px Arial";
    const words = title.split(" ");
    const lines = [];
    let line = "";
    const maxWidth = 880;
    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });
    if (line) lines.push(line);

    let y = 1150;
    lines.slice(0, 4).forEach((titleLine) => {
      ctx.fillText(titleLine, 100, y);
      y += 86;
    });

    // Snippet text wrapping
    ctx.fillStyle = "#d1d5db";
    ctx.font = "500 30px Arial";
    const snippetWords = shareSnippet.split(" ");
    const snippetLines = [];
    let snippetLine = "";
    snippetWords.forEach((word) => {
      const testLine = snippetLine ? `${snippetLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && snippetLine) {
        snippetLines.push(snippetLine);
        snippetLine = word;
      } else {
        snippetLine = testLine;
      }
    });
    if (snippetLine) snippetLines.push(snippetLine);

    let snippetY = 1460;
    snippetLines.slice(0, 3).forEach((lineText) => {
      ctx.fillText(lineText, 100, snippetY);
      snippetY += 46;
    });

    // Details row
    ctx.fillStyle = "#9ca3af";
    ctx.font = "500 34px Arial";
    const dateText = formatDate(blog.publishedAt || blog.createdAt);
    const authorText = blog.author || "Unknown";
    ctx.fillText(dateText, 100, 1635);
    ctx.fillText(`by ${authorText}`, 100, 1685);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Unable to create share card"));
      }, "image/png");
    });
  };

  const handleShareToInstagramStory = async () => {
    try {
      setShareBusy(true);
      setShareStatus("");
      const blob = await createShareCardBlob();
      const file = new File([blob], `xfrizon-blog-${id}.png`, {
        type: "image/png",
      });

      const shareText = `${blog.title} - ${window.location.href}`;
      const canShareFiles =
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] });

      if (canShareFiles && navigator.share) {
        await navigator.share({
          title: blog.title,
          text: shareText,
          files: [file],
        });
        setShareStatus(
          "Opened share sheet. Choose Instagram to post your story.",
        );
        return;
      }

      // Fallback for browsers that cannot share files
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `xfrizon-blog-${id}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch {
        // Clipboard may be unavailable in some browsers.
      }

      setShareStatus(
        "Story card downloaded. Upload it in Instagram Story and paste the copied blog link.",
      );
    } catch (err) {
      setShareStatus(
        "Unable to create story card right now. Please try again.",
      );
    } finally {
      setShareBusy(false);
    }
  };

  const handleSharePost = async () => {
    const url = window.location.href;
    const text = `${blog.title}\n${shareSnippet}`;

    try {
      setShareStatus("");
      if (navigator.share) {
        await navigator.share({
          title: blog.title,
          text,
          url,
        });
        setShareStatus("Post link shared.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShareStatus("Post details copied. Paste anywhere to share.");
    } catch {
      setShareStatus("Unable to share post right now.");
    }
  };

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = `${blog.title}\n${shareSnippet}\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setShareStatus("Opened WhatsApp share.");
  };

  const renderCommentItem = (comment, depth = 0) => {
    const replies = commentChildrenMap[comment.id] || [];
    const isReplyOpen = expandedReplies[comment.id] || false;
    const replyValue = replyInputs[comment.id] || "";
    const isOwnComment = currentUserId && comment.userId === currentUserId;
    const authorAvatar =
      comment.authorAvatar ||
      comment.authorImage ||
      comment.profilePhoto ||
      comment.profileImage ||
      comment.userAvatar ||
      comment.user?.avatar ||
      comment.user?.profilePhoto ||
      "";

    return (
      <div key={comment.id} className={`px-1 py-3 ${depth > 0 ? "ml-5" : ""}`}>
        <div className="flex items-start gap-2">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={comment.authorName || "User"}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1f1f1f] text-gray-400">
              <FaUser className="text-[11px]" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight text-gray-100">
              {comment.authorName || "User"}
              {isOwnComment ? (
                <span className="ml-2 text-[10px] uppercase tracking-wide text-red-300">
                  You
                </span>
              ) : null}
            </p>
            <p className="text-[9px] uppercase tracking-wide text-gray-500">
              {formatCommentDate(comment.createdAt)}
            </p>

            <p className="mt-2 text-[13px] leading-6 text-gray-200 whitespace-pre-wrap">
              {comment.content}
            </p>

            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleToggleLike(comment.id)}
                className="inline-flex items-center gap-1.5 text-[11px] tracking-wide text-gray-300 hover:text-red-300 transition-colors"
              >
                {comment.likedByCurrentUser ? (
                  <FaHeart className="text-red-400" />
                ) : (
                  <FaRegHeart />
                )}
                <span>{Number(comment.likeCount || 0)}</span>
              </button>

              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => toggleReplyInput(comment.id)}
                  className="inline-flex items-center gap-1.5 text-[11px] tracking-wide text-gray-300 hover:text-red-300 transition-colors"
                >
                  <FaReply />
                  Reply
                </button>
              ) : null}

              {replies.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedReplies((prev) => ({
                      ...prev,
                      [comment.id]: !isReplyOpen,
                    }))
                  }
                  className="text-[11px] tracking-wide text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {isReplyOpen ? "Hide replies" : `Replies (${replies.length})`}
                </button>
              ) : null}
            </div>

            {isLoggedIn &&
            Object.prototype.hasOwnProperty.call(replyInputs, comment.id) ? (
              <ReplyBlock
                commentId={comment.id}
                value={replyValue}
                submittingId={replySubmittingId}
                onChange={handleReplyChange}
                onSubmit={handleSubmitReply}
                onClose={() => closeReplyInput(comment.id)}
              />
            ) : null}

            {isReplyOpen && replies.length > 0 ? (
              <div className="mt-4 space-y-3">
                {replies.map((reply) => renderCommentItem(reply, depth + 1))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  // Extract featured image from blocks or images array
  let featuredImage = null;
  if (safeBlocks.length > 0) {
    // Look for first image block
    const imageBlock = safeBlocks.find(
      (b) => b.type === "image" && b.images && b.images.length > 0,
    );
    if (imageBlock) {
      featuredImage = imageBlock.images[0].src;
    }
  }
  // Fallback to images array
  if (!featuredImage && safeImages.length > 0) {
    featuredImage = safeImages[0].src;
  }

  const contentPages = React.useMemo(() => {
    if (!Array.isArray(blog?.blocks) || blog.blocks.length === 0) {
      return [];
    }

    const pages = [];
    let currentPage = [];

    blog.blocks.forEach((block) => {
      if (block.type === "continue") {
        if (currentPage.length > 0) {
          pages.push(currentPage);
          currentPage = [];
        }
        return;
      }

      currentPage.push(block);
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages;
  }, [blog?.blocks]);

  // Build content from blocks
  const renderBlockContent = () => {
    if (!blog.blocks || blog.blocks.length === 0) {
      return (
        <p
          className="text-lg leading-relaxed"
          style={{
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            color: "#d1d5db",
          }}
        >
          {blog.content}
        </p>
      );
    }

    const blocksToRender =
      contentPages[currentContentPage] ||
      blog.blocks.filter((block) => block.type !== "continue");

    return blocksToRender.map((block, index) => {
      switch (block.type) {
        case "text":
          return (
            <div key={`text-${index}`} className="mb-6">
              {renderRichText(block.content, {
                paragraphClassName: "mb-4 leading-relaxed text-gray-300",
                heading1ClassName:
                  "mt-8 mb-4 text-4xl font-semibold tracking-tight text-white",
                heading2ClassName:
                  "mt-7 mb-4 text-3xl font-semibold tracking-tight text-white",
                heading3ClassName:
                  "mt-6 mb-3 text-2xl font-semibold tracking-tight text-zinc-100",
                bulletClassName: "ml-6 list-disc text-gray-300 leading-relaxed",
                linkClassName:
                  "text-red-300 hover:text-red-200 underline underline-offset-2",
                textStyle: {
                  fontFamily:
                    block.style?.fontFamily ||
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                  fontSize: block.style?.fontSize
                    ? `${block.style.fontSize}px`
                    : "1.125rem",
                  color: block.style?.color || "#d1d5db",
                  opacity:
                    block.style?.opacity !== undefined
                      ? block.style.opacity
                      : 1,
                },
              })}
            </div>
          );
        case "image":
          return (
            <div key={`image-${index}`} className="my-8">
              {block.images &&
                block.images.map((img, imgIndex) => (
                  <figure key={`img-${imgIndex}`} className="mb-6">
                    <img
                      src={img.src}
                      alt={img.name || `Blog image ${imgIndex + 1}`}
                      className="w-full max-w-md mx-auto rounded-lg shadow-md object-cover"
                      style={{ maxHeight: "320px" }}
                    />
                    {(img.caption || img.credit) && (
                      <figcaption className="text-center text-black text-[10px] mt-1">
                        {img.caption || ""}
                        {img.caption && img.credit ? " " : ""}
                        {img.credit ? `(${img.credit})` : ""}
                      </figcaption>
                    )}
                  </figure>
                ))}
            </div>
          );
        case "video":
          return (
            <div key={`video-${index}`} className="my-8">
              {block.videos &&
                block.videos.map((video, videoIndex) => {
                  const videoKey = `${index}-${videoIndex}`;
                  if (!videoRefs.current[videoKey]) {
                    videoRefs.current[videoKey] = React.createRef();
                  }
                  const videoRef = videoRefs.current[videoKey];

                  const handleMouseEnter = () => {
                    if (videoRef.current) {
                      videoRef.current.play().catch(() => {
                        // Browser may prevent autoplay, that's okay
                      });
                    }
                  };

                  const handleMouseLeave = () => {
                    if (videoRef.current) {
                      videoRef.current.pause();
                      videoRef.current.currentTime = 0; // Reset to start
                    }
                  };

                  return (
                    <div
                      key={`vid-${videoIndex}`}
                      className="max-w-md mx-auto mb-6"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <video
                        ref={videoRef}
                        controls
                        className="w-full rounded-lg shadow-md cursor-pointer"
                        controlsList="nodownload"
                      >
                        <source src={video.src || video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  );
                })}
            </div>
          );
        case "youtube":
          return (
            <div key={`youtube-${index}`} className="my-8">
              {block.youtubeLinks &&
              Array.isArray(block.youtubeLinks) &&
              block.youtubeLinks.length > 0
                ? block.youtubeLinks.map((link, linkIndex) => {
                    // Handle both string URLs and objects with url property
                    const urlString =
                      typeof link === "string"
                        ? link
                        : link.url || link.src || link;
                    const youtubeId = getYoutubeId(urlString);

                    if (!youtubeId) return null;

                    return (
                      <div
                        key={`yt-${linkIndex}`}
                        className="max-w-md mx-auto mb-6"
                      >
                        <div
                          className="relative w-full"
                          style={{
                            paddingBottom: "56.25%",
                            height: 0,
                            overflow: "hidden",
                          }}
                        >
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              borderRadius: "8px",
                            }}
                          ></iframe>
                        </div>
                      </div>
                    );
                  })
                : null}
            </div>
          );
        case "audio":
          return (
            <div key={`audio-${index}`} className="my-8">
              {block.audioTracks &&
                block.audioTracks.map((audio, audioIndex) => (
                  <div
                    key={`aud-${audioIndex}`}
                    className="max-w-md mx-auto mb-6 bg-[#2a2a2a] p-4 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <FaMusic className="text-red-500" size={20} />
                      <span className="text-gray-300 font-medium text-sm truncate">
                        {audio.name || `Audio Track ${audioIndex + 1}`}
                      </span>
                    </div>
                    <audio
                      controls
                      className="w-full"
                      controlsList="nodownload"
                    >
                      <source src={audio.src || audio} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ))}
            </div>
          );
        case "embeds":
          return (
            <div key={`embeds-${index}`} className="my-8">
              {block.embeds &&
                Array.isArray(block.embeds) &&
                block.embeds.map((embed, embedIndex) => {
                  // Render embed based on type
                  let embedElement = null;

                  if (embed.type === "soundcloud") {
                    embedElement = (
                      <div
                        key={`embed-${embedIndex}`}
                        className="max-w-md mx-auto mb-6"
                      >
                        <iframe
                          width="100%"
                          height="166"
                          scrolling="no"
                          frameBorder="no"
                          allow="autoplay"
                          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(embed.url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
                          style={{ borderRadius: "8px" }}
                        ></iframe>
                      </div>
                    );
                  } else if (embed.type === "spotify") {
                    embedElement = (
                      <div
                        key={`embed-${embedIndex}`}
                        className="max-w-md mx-auto mb-6 flex justify-center"
                      >
                        <iframe
                          src={`https://open.spotify.com/embed?utm_source=generator${embed.url.includes("track") ? "&uri=" + embed.url.match(/track\/([a-zA-Z0-9]+)/)?.[1] : ""}`}
                          width="100%"
                          height="282"
                          frameBorder="0"
                          allowFullScreen
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          style={{ borderRadius: "12px" }}
                        ></iframe>
                      </div>
                    );
                  } else if (embed.type === "instagram") {
                    embedElement = (
                      <div
                        key={`embed-${embedIndex}`}
                        className="max-w-md mx-auto mb-6 flex justify-center"
                      >
                        <blockquote
                          className="instagram-media"
                          data-instgrm-permalink={embed.url}
                          data-instgrm-version="14"
                          style={{
                            background: "#FFF",
                            borderRadius: "8px",
                            borderLeft: "4px solid #949494",
                            borderRight: "4px solid #949494",
                            boxShadow:
                              "0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)",
                            maxWidth: "540px",
                            minWidth: "326px",
                            padding: "0",
                          }}
                        ></blockquote>
                      </div>
                    );
                  } else if (embed.type === "tiktok") {
                    embedElement = (
                      <div
                        key={`embed-${embedIndex}`}
                        className="max-w-md mx-auto mb-6 flex justify-center"
                      >
                        <blockquote
                          className="tiktok-embed"
                          cite={embed.url}
                          data-unique_id={
                            embed.url.match(/(@[a-zA-Z0-9._]+)/)?.[1]
                          }
                          style={{ maxWidth: "605px", minWidth: "325px" }}
                        >
                          <section></section>
                        </blockquote>
                      </div>
                    );
                  } else if (embed.type === "twitter") {
                    embedElement = (
                      <div
                        key={`embed-${embedIndex}`}
                        className="max-w-md mx-auto mb-6"
                      >
                        <blockquote className="twitter-tweet" data-theme="dark">
                          <a href={embed.url}></a>
                        </blockquote>
                      </div>
                    );
                  } else {
                    // Generic embed/link
                    embedElement = (
                      <div
                        key={`embed-${embedIndex}`}
                        className="max-w-md mx-auto mb-6 bg-[#2a2a2a] p-4 rounded-lg border border-gray-700"
                      >
                        {embed.title && (
                          <h4 className="text-gray-100 font-semibold mb-2">
                            {embed.title}
                          </h4>
                        )}
                        <a
                          href={embed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-400 hover:text-red-300 break-all text-sm"
                        >
                          {embed.url}
                        </a>
                      </div>
                    );
                  }

                  return embedElement;
                })}
            </div>
          );
        default:
          return null;
      }
    });
  };

  const hasPreviousPage = currentContentPage > 0;
  const hasNextPage = currentContentPage < contentPages.length - 1;
  const hasPagedContent = contentPages.length > 1;
  const totalContentPages = contentPages.length;

  // Declare heroImage only once using defensive fallback
  const heroImage = safeCoverImage || featuredImage;
  const showHero = Boolean(heroImage);

  useSeo({
    title: safeTitle ? `${safeTitle} | Xfrizon Blog` : "Xfrizon Blog",
    description: (
      safeExcerpt ||
      shareSnippet ||
      "Read the latest stories on Xfrizon."
    ).slice(0, 160),
    image: getAbsoluteMediaUrl(heroImage),
    type: "article",
    url:
      typeof window !== "undefined"
        ? window.location.href
        : toAbsoluteSiteUrl(`/blog/${id}`),
    keywords: "music blog, culture blog, nightlife, events, article, Xfrizon",
    jsonLd:
      safeBlog && safeTitle
        ? {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: safeTitle,
            description: (safeExcerpt || shareSnippet || "").slice(0, 200),
            image: getAbsoluteMediaUrl(heroImage),
            datePublished: safePublishedAt,
            dateModified: safeBlog.updatedAt || safePublishedAt,
            author: {
              "@type": "Person",
              name: safeAuthor,
            },
            publisher: {
              "@type": "Organization",
              name: "Xfrizon",
            },
            mainEntityOfPage:
              typeof window !== "undefined"
                ? window.location.href
                : toAbsoluteSiteUrl(`/blog/${id}`),
          }
        : null,
  });

  if (loading) {
    return (
      <div className="bg-[#1e1e1e] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
          <p className="mt-4 text-gray-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="bg-[#1e1e1e] min-h-screen">
        <div className="bg-[#2a2a2a] border-b border-gray-700">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 font-light uppercase tracking-widest text-xs mb-6 transition-colors"
            >
              <FaArrowLeft size={16} />
              Back to Home
            </button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <p className="text-gray-400">
            {error || "Blog not found or invalid data"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1e1e1e] min-h-screen">
      {showHero && (
        <section className="relative w-full h-130 bg-black -mt-20">
          <img
            src={heroImage}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute top-24 left-6 md:top-20 z-40 pointer-events-none text-shadow"
            style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}
          >
            <span className="text-red-500 font-extrabold text-lg tracking-[0.06em]">
              XF
            </span>
            <span className="text-white font-semibold text-lg tracking-[0.06em] ml-1">
              Mag
            </span>
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/10"></div>
          <div className="absolute inset-0">
            <div className="max-w-5xl mx-auto px-6 h-full flex items-end pb-12">
              <div className="max-w-3xl">
                <span className="text-[11px] uppercase tracking-[0.3em] text-gray-200">
                  {blog.category || "General"}
                </span>
                <h1
                  className="mt-4 text-4xl md:text-6xl font-extrabold text-white leading-tight"
                  style={{
                    fontFamily:
                      blog.titleStyle?.fontFamily ||
                      "'Bebas Neue', 'Oswald', 'Arial Narrow', sans-serif",
                    fontSize: blog.titleStyle?.fontSize
                      ? `${blog.titleStyle.fontSize}px`
                      : undefined,
                    color: blog.titleStyle?.color || "#f3f4f6",
                    opacity:
                      blog.titleStyle?.opacity !== undefined
                        ? blog.titleStyle.opacity
                        : 1,
                  }}
                >
                  {blog.title}
                </h1>
                <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-gray-200 uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-2">
                    <FaCalendarAlt size={12} />
                    {formatDate(blog.publishedAt || blog.createdAt)}
                  </span>
                  <span className="flex items-center gap-2">
                    {blog.author || "Unknown"}
                    {authorProfileImageUrl && (
                      <img
                        src={authorProfileImageUrl}
                        alt={blog.author || "Unknown"}
                        className="w-5 h-5 rounded-full object-cover border border-gray-400/40"
                      />
                    )}
                  </span>
                  {blog.location && <span>{blog.location}</span>}
                  <div className="relative" ref={shareMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShareMenuOpen((prev) => !prev)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-gray-300/50 text-gray-100 hover:text-white hover:border-red-300 transition-colors"
                      aria-label="Share blog"
                    >
                      <FaShareAlt className="text-[11px]" />
                    </button>

                    {shareMenuOpen && (
                      <div className="absolute right-0 bottom-full mb-2 w-56 rounded-lg border border-gray-800 bg-[#1b1b1b] shadow-xl z-60 overflow-hidden normal-case tracking-normal">
                        <button
                          type="button"
                          onClick={handleSharePost}
                          className="w-full px-3 py-2.5 text-left text-xs text-gray-200 hover:bg-[#242424] inline-flex items-center gap-2"
                        >
                          <FaShareAlt className="text-[12px]" />
                          Share Post
                        </button>
                        <button
                          type="button"
                          onClick={handleShareToInstagramStory}
                          disabled={shareBusy}
                          className="w-full px-3 py-2.5 text-left text-xs text-gray-200 hover:bg-[#242424] disabled:opacity-60 inline-flex items-center gap-2"
                        >
                          <FaInstagram className="text-[12px]" />
                          {shareBusy ? "Preparing Story..." : "Share Story"}
                        </button>
                        <button
                          type="button"
                          onClick={handleShareWhatsApp}
                          className="w-full px-3 py-2.5 text-left text-xs text-gray-200 hover:bg-[#242424] inline-flex items-center gap-2"
                        >
                          <FaWhatsapp className="text-[12px]" />
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {shareStatus && (
                  <p className="mt-3 text-[11px] normal-case tracking-normal text-gray-300">
                    {shareStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
      {showHero &&
        (safeTitleStyle.coverImageCaption ||
          safeTitleStyle.coverImageCredit) && (
          <div className="text-center py-2 bg-[#1e1e1e]">
            <p className="text-[10px] text-black">
              {safeTitleStyle.coverImageCaption || ""}
              {safeTitleStyle.coverImageCaption &&
              safeTitleStyle.coverImageCredit
                ? " "
                : ""}
              {safeTitleStyle.coverImageCredit
                ? `(${safeTitleStyle.coverImageCredit})`
                : ""}
            </p>
          </div>
        )}

      {/* Content - Centered */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        {!showHero && (
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-700 flex-wrap text-sm">
            <div className="flex items-center gap-2 text-gray-400 uppercase tracking-wider">
              <FaCalendarAlt size={14} />
              <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {blog.category || "General"}
            </span>
            <div className="flex items-center gap-2 text-gray-400 uppercase tracking-wider">
              <span className="font-medium">{blog.author || "Unknown"}</span>
              {authorProfileImageUrl && (
                <img
                  src={authorProfileImageUrl}
                  alt={blog.author || "Unknown"}
                  className="w-5 h-5 rounded-full object-cover border border-gray-500/40"
                />
              )}
            </div>

            {blog.status && (
              <span className="ml-auto text-xs font-bold uppercase tracking-widest text-gray-400">
                {blog.status}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {blog.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-purple-600 bg-opacity-20 text-purple-300 px-3 py-1 rounded-full text-xs font-medium border border-purple-500 border-opacity-30 hover:border-opacity-50 transition"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {!showHero && (
          <h1
            className="text-4xl md:text-5xl font-bold text-gray-100 mb-8 leading-tight"
            style={{
              fontFamily:
                blog.titleStyle?.fontFamily ||
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
              fontSize: blog.titleStyle?.fontSize
                ? `${blog.titleStyle.fontSize}px`
                : undefined,
              color: blog.titleStyle?.color || "#f3f4f6",
              opacity:
                blog.titleStyle?.opacity !== undefined
                  ? blog.titleStyle.opacity
                  : 1,
            }}
          >
            {blog.title}
          </h1>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">{renderBlockContent()}</div>

        {hasPagedContent && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                setCurrentContentPage((prev) => Math.max(prev - 1, 0))
              }
              disabled={!hasPreviousPage}
              className="h-9 w-9 rounded-full border border-zinc-700 text-sm font-semibold text-zinc-200 transition hover:border-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Previous page"
            >
              &lt;
            </button>

            <div className="flex items-center gap-1 text-sm font-semibold text-zinc-300">
              {contentPages.map((_, pageIndex) => {
                const isActive = pageIndex === currentContentPage;

                return (
                  <button
                    key={`content-page-${pageIndex}`}
                    type="button"
                    onClick={() => setCurrentContentPage(pageIndex)}
                    className={`min-w-8 px-2 py-1 rounded-full transition ${
                      isActive
                        ? "bg-red-500 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                    aria-label={`Go to page ${pageIndex + 1} of ${totalContentPages}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {pageIndex + 1}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentContentPage((prev) =>
                  Math.min(prev + 1, contentPages.length - 1),
                )
              }
              disabled={!hasNextPage}
              className="h-9 w-9 rounded-full border border-red-500/60 text-sm font-semibold text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Next page"
            >
              &gt;
            </button>
          </div>
        )}

        {/* Related Articles CTA */}
        <div className="mt-10">
          <button
            onClick={() => navigate("/blogs")}
            className="w-full text-red-500 hover:text-red-400 font-light uppercase tracking-widest text-xs transition-colors"
          >
            Read More Articles
          </button>
        </div>

        {/* Comment Section */}
        <section className="mt-12 pt-8">
          <div className="mb-4 text-center">
            <h3 className="text-xs uppercase tracking-widest text-gray-400">
              Comments
            </h3>
          </div>

          {isLoggedIn ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex items-center gap-2 border-b border-gray-600">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write a comment..."
                  rows={1}
                  maxLength={1000}
                  className="flex-1 bg-transparent border-0 text-gray-100 px-1 pb-1.5 pt-0 text-sm focus:outline-none resize-none leading-tight"
                />
                <button
                  type="submit"
                  disabled={commentSubmitting || !commentInput.trim()}
                  className="inline-flex items-center justify-center pb-1.5 text-red-400 hover:text-red-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {commentSubmitting ? (
                    "Posting..."
                  ) : (
                    <LuSendHorizontal className="text-sm" />
                  )}
                </button>
              </div>
              {commentError && (
                <p className="mt-2 text-xs text-red-400">{commentError}</p>
              )}
            </form>
          ) : (
            <div className="mb-6 p-3 text-sm text-gray-300">
              Please log in to comment.
            </div>
          )}

          {commentsLoading ? (
            <p className="text-sm text-gray-400">Loading comments...</p>
          ) : topLevelComments.length === 0 ? (
            <p className="text-sm text-gray-400">
              No comments yet. Be the first to comment.
            </p>
          ) : (
            <div className="bg-[#252525] py-4 space-y-4">
              {topLevelComments.map((comment) => renderCommentItem(comment, 0))}
            </div>
          )}

          {replyError ? (
            <p className="mt-3 text-xs text-red-400">{replyError}</p>
          ) : null}
        </section>
      </article>
    </div>
  );
}
