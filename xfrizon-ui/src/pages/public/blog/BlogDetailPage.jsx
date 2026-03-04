import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCalendarAlt, FaUser, FaMusic } from "react-icons/fa";
import blogApi from "../../../api/blogApi";

export default function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBlogDetail();
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
        <div className="mt-12 pt-8">
          <button
            onClick={() => navigate("/")}
            className="w-full text-red-500 hover:text-red-400 font-light uppercase tracking-widest text-xs transition-colors"
          >
            Read More Articles
          </button>
        </div>
      </article>
    </div>
  );
}
