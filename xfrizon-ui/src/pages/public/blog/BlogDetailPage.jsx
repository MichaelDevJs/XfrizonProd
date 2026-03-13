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
} from "react-icons/fa";
import { LuSendHorizontal } from "react-icons/lu";
import blogApi from "../../../api/blogApi";

function ReplyBlock({ commentId, value, submittingId, onChange, onSubmit, onClose }) {
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
    <div ref={ref} className="mt-3 border border-gray-700 bg-[#1f1f1f] p-3">
      <textarea
        value={value}
        onChange={(e) => onChange(commentId, e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Write a reply..."
        autoFocus
        className="w-full bg-[#2a2a2a] border border-gray-600 text-gray-100 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => onSubmit(commentId)}
          disabled={submittingId === commentId || !value.trim()}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] uppercase tracking-wider rounded"
        >
          {submittingId === commentId ? "Posting..." : "Reply"}
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

  useEffect(() => {
    fetchBlogDetail();
  }, [id]);

  useEffect(() => {
    fetchComments();
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return;
    fetchCommentNotifications();
  }, [id]);

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
      const response = await blogApi.getBlogById(id);

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
      setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
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
        err?.message || err?.error || "Failed to post comment. Please try again.",
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
      setReplyError(err?.message || err?.error || "Failed to post reply. Please try again.");
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
      setCommentError(err?.message || err?.error || "Failed to like comment. Please try again.");
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
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
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
      <div
        key={comment.id}
        className={`px-1 py-3 ${depth > 0 ? "ml-5" : ""}`}
      >
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
                <span className="ml-2 text-[10px] uppercase tracking-wide text-red-300">You</span>
              ) : null}
            </p>
            <p className="text-[9px] uppercase tracking-wide text-gray-500">
              {formatCommentDate(comment.createdAt)}
            </p>

            <p className="mt-2 text-[13px] leading-6 text-gray-200 whitespace-pre-wrap">{comment.content}</p>

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
                    setExpandedReplies((prev) => ({ ...prev, [comment.id]: !isReplyOpen }))
                  }
                  className="text-[11px] tracking-wide text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {isReplyOpen ? "Hide replies" : `Replies (${replies.length})`}
                </button>
              ) : null}
            </div>

            {isLoggedIn && Object.prototype.hasOwnProperty.call(replyInputs, comment.id) ? (
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
          <p className="text-gray-400">{error || "Blog not found"}</p>
        </div>
      </div>
    );
  }

  // Extract featured image from blocks or images array
  let featuredImage = null;
  if (blog.blocks && blog.blocks.length > 0) {
    // Look for first image block
    const imageBlock = blog.blocks.find(
      (b) => b.type === "image" && b.images && b.images.length > 0,
    );
    if (imageBlock) {
      featuredImage = imageBlock.images[0].src;
    }
  }
  // Fallback to images array
  if (!featuredImage && blog.images && blog.images.length > 0) {
    featuredImage = blog.images[0].src;
  }

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

    return blog.blocks.map((block, index) => {
      switch (block.type) {
        case "text":
          return (
            <div key={`text-${index}`} className="mb-6">
              <p
                className="text-gray-300 leading-relaxed whitespace-pre-wrap"
                style={{
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
                }}
              >
                {block.content}
              </p>
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
                    {img.name && (
                      <figcaption className="text-center text-gray-500 text-sm mt-2">
                        {img.name}
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
                  const videoRef = useRef(null);

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

  const heroImage = blog.coverImage || featuredImage;
  const showHero = Boolean(heroImage);

  return (
    <div className="bg-[#1e1e1e] min-h-screen">
      {showHero && (
        <section className="relative w-full h-130 bg-black overflow-hidden -mt-20">
          <img
            src={heroImage}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
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
                    <FaUser size={12} />
                    {blog.author || "Unknown"}
                  </span>
                  {blog.location && <span>{blog.location}</span>}
                  {blog.genre && <span>{blog.genre}</span>}
                </div>
              </div>
            </div>
          </div>
        </section>
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
              <FaUser size={14} />
              <span className="font-medium">{blog.author || "Unknown"}</span>
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

        {/* Related Articles CTA */}
        <div className="mt-10">
          <button
            onClick={() => navigate("/")}
            className="w-full text-red-500 hover:text-red-400 font-light uppercase tracking-widest text-xs transition-colors"
          >
            Read More Articles
          </button>
        </div>

        {/* Comment Section */}
        <section className="mt-12 pt-8">
          <div className="mb-4 text-center">
            <h3 className="text-xs uppercase tracking-widest text-gray-400">Comments</h3>
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
                  {commentSubmitting ? "Posting..." : <LuSendHorizontal className="text-sm" />}
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
            <p className="text-sm text-gray-400">No comments yet. Be the first to comment.</p>
          ) : (
            <div className="bg-[#252525] py-4 space-y-4">
              {topLevelComments.map((comment) => renderCommentItem(comment, 0))}
            </div>
          )}

          {replyError ? <p className="mt-3 text-xs text-red-400">{replyError}</p> : null}
        </section>
      </article>
    </div>
  );
}
