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
    "General",
    "Music",
    "Sports",
    "Business",
    "Technology",
    "Entertainment",
    "Travel",
    "Food",
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

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await blogApi.getAllBlogs({ status: "PUBLISHED" });
      let blogList = response.data?.content || response.data || [];

      // Parse JSON fields
      blogList = blogList.map((blog) => ({
        ...blog,
        tags: blog.tags
          ? typeof blog.tags === "string"
            ? JSON.parse(blog.tags)
            : blog.tags
          : [],
      }));

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
          blog.title.toLowerCase().includes(searchLower) ||
          blog.excerpt.toLowerCase().includes(searchLower) ||
          blog.author.toLowerCase().includes(searchLower),
      );
    }

    // Category filter
    if (filterObj.category) {
      result = result.filter((blog) => blog.category === filterObj.category);
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
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filterObj.sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (filterObj.sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
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
    <div className="min-h-screen bg-[#1e1e1e] py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">All Blogs</h1>
          <p className="text-gray-400">
            Discover stories, insights, and experiences from our community
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-3.5 text-gray-500 text-sm" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition"
          >
            <FaFilter size={16} />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-[#2a2a2a] border border-[#444] rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Search location..."
                  value={filters.location}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Genre
                </label>
                <select
                  value={filters.genre}
                  onChange={(e) => handleFilterChange("genre", e.target.value)}
                  className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={filters.tags}
                  onChange={(e) => handleFilterChange("tags", e.target.value)}
                  className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center gap-2 transition text-sm"
              >
                <FaTimes size={14} />
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 text-gray-400 text-sm">
          Showing {filteredBlogs.length} of {blogs.length} blogs
        </div>

        {/* Blogs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading blogs...</div>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No blogs found</div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
