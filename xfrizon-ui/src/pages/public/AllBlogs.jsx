import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import blogApi from "../../api/blogApi";
import BlogCard from "../../feature/blog/BlogCard";
import { FaSearch, FaFilter, FaTimes } from "react-icons/fa";

export default function AllBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    genre: searchParams.get("genre") || "",
    tags: searchParams.get("tags") || "",
    sortBy: searchParams.get("sortBy") || "newest",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Unique values for filters
  const categories = [
    "News",
    "Fashion",
    "Reviews",
    "Diaspora",
    "Music",
    "Politics",
    "General",
  ];
  const genres = [
    "Hip-Hop",
    "Pop",
    "Rock",
    "Jazz",
    "Electronic",
    "Classical",
    "Other",
  ];

  useEffect(() => {
    fetchBlogs();
  }, []);

  const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string") {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
    }
    return [];
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const allBlogs = [];
      let page = 0;
      const size = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await blogApi.getAllBlogs({
          status: "PUBLISHED",
          page,
          size,
        });

        const payload = response?.data ?? response;

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

      const blogList = allBlogs
        .map((blog) => ({
          ...blog,
          tags: parseTags(blog.tags),
        }))
        .sort(
          (a, b) =>
            new Date(b.publishedAt || b.createdAt || 0) -
            new Date(a.publishedAt || a.createdAt || 0),
        );

      setBlogs(blogList);
      applyFilters(blogList, filters);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (blogList, filterObj) => {
    let result = blogList;

    // Search filter
    if (filterObj.search) {
      const searchLower = filterObj.search.toLowerCase();
      result = result.filter(
        (blog) =>
          (blog.title || "").toLowerCase().includes(searchLower) ||
          (blog.excerpt || blog.content || "")
            .toLowerCase()
            .includes(searchLower) ||
          (blog.author || "").toLowerCase().includes(searchLower),
      );
    }

    // Category filter
    if (filterObj.category) {
      const selectedCategory = filterObj.category.trim().toLowerCase();
      result = result.filter(
        (blog) =>
          (blog.category || "General").trim().toLowerCase() ===
          selectedCategory,
      );
    }

    // Location filter
    if (filterObj.location) {
      result = result.filter(
        (blog) =>
          blog.location &&
          blog.location
            .toLowerCase()
            .includes(filterObj.location.toLowerCase()),
      );
    }

    // Genre filter
    if (filterObj.genre) {
      result = result.filter((blog) => blog.genre === filterObj.genre);
    }

    // Tags filter
    if (filterObj.tags) {
      result = result.filter((blog) =>
        blog.tags && Array.isArray(blog.tags)
          ? blog.tags.some((tag) =>
              tag.toLowerCase().includes(filterObj.tags.toLowerCase()),
            )
          : false,
      );
    }

    // Sorting
    if (filterObj.sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt || 0) -
          new Date(a.publishedAt || a.createdAt || 0),
      );
    } else if (filterObj.sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.publishedAt || a.createdAt || 0) -
          new Date(b.publishedAt || b.createdAt || 0),
      );
    } else if (filterObj.sortBy === "title") {
      result.sort((a, b) =>
        (a.title || "").localeCompare(b.title || ""),
      );
    }

    setFilteredBlogs(result);
    updateSearchParams(filterObj);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(blogs, newFilters);
  };

  const updateSearchParams = (filterObj) => {
    const params = new URLSearchParams();
    if (filterObj.search) params.set("search", filterObj.search);
    if (filterObj.category) params.set("category", filterObj.category);
    if (filterObj.location) params.set("location", filterObj.location);
    if (filterObj.genre) params.set("genre", filterObj.genre);
    if (filterObj.tags) params.set("tags", filterObj.tags);
    if (filterObj.sortBy !== "newest") params.set("sortBy", filterObj.sortBy);
    setSearchParams(params);
  };

  const clearFilters = () => {
    const newFilters = {
      search: "",
      category: "",
      location: "",
      genre: "",
      tags: "",
      sortBy: "newest",
    };
    setFilters(newFilters);
    applyFilters(blogs, newFilters);
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.location ||
    filters.genre ||
    filters.tags ||
    filters.sortBy !== "newest";

  return (
    <div className="min-h-screen bg-[#1e1e1e] py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[0.12em] uppercase text-zinc-100 mb-2">
            All Blogs
          </h1>
          <p className="text-zinc-500 text-sm md:text-base font-light">
            Discover stories, insights, and experiences from our community
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-3.5 text-zinc-500 text-sm" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#403838]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 bg-[#403838] hover:bg-[#4f4545] text-white rounded-lg flex items-center justify-center gap-2 transition text-sm uppercase tracking-wider"
          >
            <FaFilter size={16} />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-zinc-950 border border-zinc-800 rounded-lg p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-[#403838]"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Search location..."
                  value={filters.location}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#403838]"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                  Genre
                </label>
                <select
                  value={filters.genre}
                  onChange={(e) => handleFilterChange("genre", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-[#403838]"
                >
                  <option value="">All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={filters.tags}
                  onChange={(e) => handleFilterChange("tags", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#403838]"
                />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-[#403838]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded flex items-center gap-2 transition text-xs uppercase tracking-wider"
              >
                <FaTimes size={14} />
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 text-zinc-500 text-xs md:text-sm uppercase tracking-wider">
          Showing {filteredBlogs.length} of {blogs.length} blogs
        </div>

        {/* Blogs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-zinc-400">Loading blogs...</div>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-zinc-400 mb-4">No blogs found</div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-[#403838] hover:bg-[#4f4545] text-white rounded transition text-xs uppercase tracking-wider"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                onClick={() => navigate(`/blog/${blog.id}`)}
                className="cursor-pointer"
              >
                <BlogCard blog={blog} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
