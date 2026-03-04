import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BlogCard from "./BlogCard";
import blogApi from "../../../api/blogApi";

export default function BlogsSection() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
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
        }));
      }

      // Filter only published blogs and get latest ones
      const publishedBlogs = Array.isArray(blogList)
        ? blogList.filter((blog) => blog.status === "PUBLISHED").slice(0, 6)
        : [];

      setBlogs(publishedBlogs);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
      setError("Failed to load blog articles");
      setBlogs([]);
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
      month: "short",
      day: "numeric",
    });
  };

  // Transform blog data to match BlogCard expectations
  const transformedBlogs = blogs.map((blog) => {
    let coverImageSrc = null;

    // Check for coverImage first
    if (blog.coverImage) {
      if (typeof blog.coverImage === "string") {
        coverImageSrc = blog.coverImage;
      } else if (blog.coverImage.src) {
        coverImageSrc = blog.coverImage.src;
      }
    }

    // Fall back to images array
    if (!coverImageSrc && blog.images && blog.images.length > 0) {
      coverImageSrc = blog.images[0].src;
    }

    return {
      id: blog.id,
      title: blog.title,
      excerpt: blog.excerpt || blog.content?.substring(0, 100),
      category: blog.category || "General",
      author: blog.author || "Unknown",
      date: formatDate(blog.publishedAt || blog.createdAt),
      image: coverImageSrc,
      coverImage: coverImageSrc,
    };
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
        <p className="mt-4 text-gray-400">Loading blog articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  if (transformedBlogs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No blog articles available yet</p>
      </div>
    );
  }

  return (
    <div className="mt-0 mb-0 bg-[#1e1e1e] px-6 py-16">
      {/* Section Header */}
      <div className="mb-16 text-center">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-gray-100 mb-2">
          Articles
        </h2>
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {transformedBlogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>

      {/* View All Button */}
      {transformedBlogs.length >= 6 && (
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/AllBlogs")}
            className="text-gray-300 hover:text-red-500 font-light uppercase tracking-widest text-sm transition-colors duration-200"
          >
            Read More Articles
          </button>
        </div>
      )}
    </div>
  );
}
