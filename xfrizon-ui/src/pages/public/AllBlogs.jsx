import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import blogApi from "../../api/blogApi";
import BlogCard from "../../feature/blog/BlogCard";
import HeroSlideshow from "../../component/HeroSlideshow/HeroSlideshow";
import api from "../../api/axios";
import { FaSearch } from "react-icons/fa";
import useSeo from "../../hooks/useSeo";
import { getSiteBaseUrl, toAbsoluteSiteUrl } from "../../utils/siteUrl";

export default function AllBlogs() {
  const BLOGS_PER_PAGE = 10;
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blogHeroSlideshow, setBlogHeroSlideshow] = useState([]);
  const [loadingHero, setLoadingHero] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    tags: searchParams.get("tags") || "",
    sortBy: searchParams.get("sortBy") || "newest",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Unique values for filters
  const categories = [
    "General",
    "News",
    "Culture",
    "Events",
    "Arts",
    "Music",
    "Fashion",
    "Reviews",
    "Food",
  ];

  useEffect(() => {
    fetchBlogs();
    fetchBlogHeroSettings();
  }, []);

  const fetchBlogHeroSettings = async () => {
    try {
      setLoadingHero(true);
      const response = await api.get("/blog-hero-settings");
      const settings = response.data;

      if (settings.blogHeroSlideshow) {
        try {
          const slideshow = JSON.parse(settings.blogHeroSlideshow);
          setBlogHeroSlideshow(Array.isArray(slideshow) ? slideshow : []);
        } catch (e) {
          console.error("Error parsing blog hero slideshow:", e);
          setBlogHeroSlideshow([]);
        }
      }
    } catch (error) {
      console.error("Error fetching blog hero settings:", error);
      // If endpoint doesn't exist yet, just set empty slideshow
      setBlogHeroSlideshow([]);
    } finally {
      setLoadingHero(false);
    }
  };

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

      let blogList = allBlogs
        .map((blog) => {
          const parsedTitleStyle =
            typeof blog.titleStyle === "string"
              ? (() => {
                  try {
                    return JSON.parse(blog.titleStyle);
                  } catch {
                    return {};
                  }
                })()
              : blog.titleStyle || {};
          return {
            ...blog,
            tags: parseTags(blog.tags),
            titleStyle: parsedTitleStyle,
            authorProfileImage:
              blog.authorProfileImage ||
              blog.authorAvatar ||
              blog.authorImage ||
              parsedTitleStyle?.authorProfileImage ||
              "",
          };
        })
        .sort(
          (a, b) =>
            new Date(b.publishedAt || b.createdAt || 0) -
            new Date(a.publishedAt || a.createdAt || 0),
        );

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
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    setFilteredBlogs(result);
    updateSearchParams(filterObj);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    applyFilters(blogs, newFilters);
  };

  const updateSearchParams = (filterObj) => {
    const params = new URLSearchParams();
    if (filterObj.search) params.set("search", filterObj.search);
    if (filterObj.category) params.set("category", filterObj.category);
    if (filterObj.location) params.set("location", filterObj.location);
    if (filterObj.tags) params.set("tags", filterObj.tags);
    if (filterObj.sortBy !== "newest") params.set("sortBy", filterObj.sortBy);
    setSearchParams(params);
  };

  const clearFilters = () => {
    const newFilters = {
      search: "",
      category: "",
      location: "",
      tags: "",
      sortBy: "newest",
    };
    setFilters(newFilters);
    setCurrentPage(1);
    applyFilters(blogs, newFilters);
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.location ||
    filters.tags ||
    filters.sortBy !== "newest";

  // Helper functions
  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700'%3E%3Crect fill='%23272727' width='1200' height='700'/%3E%3Ctext x='50%25' y='50%25' font-size='28' fill='%23717171' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

  const resolveImage = (path) => {
    if (!path) return PLACEHOLDER_IMAGE;
    if (typeof path !== "string") return PLACEHOLDER_IMAGE;
    if (path.startsWith("data:")) return path;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
      return `http://localhost:8081${normalized}`;
    }
    return `http://localhost:8081/api/v1${normalized}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBlogs.length / BLOGS_PER_PAGE),
  );
  const paginatedBlogs = useMemo(() => {
    const startIndex = (currentPage - 1) * BLOGS_PER_PAGE;
    return filteredBlogs.slice(startIndex, startIndex + BLOGS_PER_PAGE);
  }, [filteredBlogs, currentPage]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  // Count active filters
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.search) count += 1;
    if (filters.category) count += 1;
    if (filters.location) count += 1;
    if (filters.tags) count += 1;
    if (filters.sortBy !== "newest") count += 1;
    return count;
  }, [filters]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: paginatedBlogs.map((blog, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url:
        typeof window !== "undefined"
          ? `${window.location.origin}/blog/${blog.id}`
          : toAbsoluteSiteUrl(`/blog/${blog.id}`),
      name: blog.title,
    })),
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Xfrizon",
    url:
      typeof window !== "undefined" ? window.location.origin : getSiteBaseUrl(),
  };

  useSeo({
    title: "Xfrizon Blogs | Music, Events and Culture",
    description: `Browse ${filteredBlogs.length || blogs.length || ""} blogs on music, events, nightlife and culture from Xfrizon.`,
    keywords: "music blog, event blog, nightlife blog, culture, Xfrizon blogs",
    url:
      typeof window !== "undefined"
        ? window.location.href
        : toAbsoluteSiteUrl("/blogs"),
    jsonLd: [organizationJsonLd, itemListJsonLd],
  });

  return (
    <div className="min-h-screen bg-[#1e1e1e] py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
          <div className="space-y-8">
            {/* Blog Hero Slideshow */}
            {!loadingHero && blogHeroSlideshow.length > 0 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-[0.12em] uppercase text-zinc-100 mb-6 text-center">
                  Headline
                </h2>
                <div className="max-w-4xl mx-auto">
                  <HeroSlideshow items={blogHeroSlideshow} />
                </div>
              </div>
            )}

            {/* Compact Filter Bar + Category Tags */}
            <div className="space-y-2">
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg px-3 sm:px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-zinc-500">
                  Blogs
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-xs uppercase tracking-widest text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-md hover:border-red-500/40 hover:text-white transition-colors"
                >
                  Filter
                  {activeCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 rounded-full px-1.5 py-0.5">
                      {activeCount}
                    </span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div className="mt-3 bg-zinc-950 border border-zinc-800 rounded-lg p-3 sm:p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Search */}
                    <div className="md:col-span-2">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-2.5 text-zinc-500 text-xs" />
                        <input
                          type="text"
                          placeholder="Search blogs..."
                          value={filters.search}
                          onChange={(e) =>
                            handleFilterChange("search", e.target.value)
                          }
                          className="w-full pl-8 pr-3 py-2 bg-zinc-900 text-zinc-200 text-xs border border-zinc-800 rounded-md placeholder-zinc-500 focus:outline-none focus:border-red-500/60"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <select
                      value={filters.category}
                      onChange={(e) =>
                        handleFilterChange("category", e.target.value)
                      }
                      className="bg-zinc-900 text-zinc-200 text-xs border border-zinc-800 rounded-md px-2 py-2 focus:outline-none focus:border-red-500/60"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    {/* Location */}
                    <input
                      type="text"
                      placeholder="Location..."
                      value={filters.location}
                      onChange={(e) =>
                        handleFilterChange("location", e.target.value)
                      }
                      className="bg-zinc-900 text-zinc-200 text-xs border border-zinc-800 rounded-md px-2 py-2 placeholder-zinc-500 focus:outline-none focus:border-red-500/60"
                    />

                    {/* Tags */}
                    <input
                      type="text"
                      placeholder="Tags..."
                      value={filters.tags}
                      onChange={(e) =>
                        handleFilterChange("tags", e.target.value)
                      }
                      className="bg-zinc-900 text-zinc-200 text-xs border border-zinc-800 rounded-md px-2 py-2 placeholder-zinc-500 focus:outline-none focus:border-red-500/60"
                    />

                    {/* Sort */}
                    <select
                      value={filters.sortBy}
                      onChange={(e) =>
                        handleFilterChange("sortBy", e.target.value)
                      }
                      className="bg-zinc-900 text-zinc-200 text-xs border border-zinc-800 rounded-md px-2 py-2 focus:outline-none focus:border-red-500/60"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="title">Title (A-Z)</option>
                    </select>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-zinc-400 hover:text-red-400 transition-colors text-left"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-xs text-zinc-200 border border-zinc-800 px-3 py-1.5 rounded-md hover:border-red-500/40 hover:text-white transition-colors w-full sm:w-auto"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Category Quick-Filter Tags */}
            {(() => {
              const categoryColors = {
                General:  { active: "bg-zinc-700 text-zinc-100 border-zinc-500",         inactive: "bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200 hover:border-zinc-500" },
                Music:    { active: "bg-purple-900/60 text-purple-300 border-purple-600", inactive: "bg-zinc-900 text-purple-400/70 border-zinc-700 hover:text-purple-300 hover:border-purple-600/50" },
                News:     { active: "bg-blue-900/60 text-blue-300 border-blue-600",       inactive: "bg-zinc-900 text-blue-400/70 border-zinc-700 hover:text-blue-300 hover:border-blue-600/50" },
                Culture:  { active: "bg-cyan-900/60 text-cyan-300 border-cyan-600",       inactive: "bg-zinc-900 text-cyan-400/70 border-zinc-700 hover:text-cyan-300 hover:border-cyan-600/50" },
                Events:   { active: "bg-violet-900/60 text-violet-300 border-violet-600", inactive: "bg-zinc-900 text-violet-400/70 border-zinc-700 hover:text-violet-300 hover:border-violet-600/50" },
                Arts:     { active: "bg-fuchsia-900/60 text-fuchsia-300 border-fuchsia-600", inactive: "bg-zinc-900 text-fuchsia-400/70 border-zinc-700 hover:text-fuchsia-300 hover:border-fuchsia-600/50" },
                Fashion:  { active: "bg-pink-900/60 text-pink-300 border-pink-600",       inactive: "bg-zinc-900 text-pink-400/70 border-zinc-700 hover:text-pink-300 hover:border-pink-600/50" },
                Reviews:  { active: "bg-amber-900/60 text-amber-300 border-amber-600",    inactive: "bg-zinc-900 text-amber-400/70 border-zinc-700 hover:text-amber-300 hover:border-amber-600/50" },
                Food:     { active: "bg-lime-900/60 text-lime-300 border-lime-600",       inactive: "bg-zinc-900 text-lime-400/70 border-zinc-700 hover:text-lime-300 hover:border-lime-600/50" },
              };
              return (
                <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {categories.map((cat) => {
                    const isActive = filters.category === cat;
                    const colors = categoryColors[cat] || categoryColors.General;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleFilterChange("category", isActive ? "" : cat)}
                        className={`shrink-0 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border transition-colors ${isActive ? colors.active : colors.inactive}`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
            </div>

            {/* Results Count */}
            <div className="text-zinc-500 text-xs uppercase tracking-wider">
              {filteredBlogs.length} of {blogs.length} blogs
            </div>

            {/* Mixed Blog Feed (date sorted) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {paginatedBlogs.length > 0 ? (
                paginatedBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    onClick={() => navigate(`/blog/${blog.id}`)}
                    className="cursor-pointer"
                  >
                    <BlogCard blog={blog} />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center">
                  <p className="text-zinc-500 text-sm">No blog posts yet</p>
                </div>
              )}
            </div>

            {filteredBlogs.length > BLOGS_PER_PAGE && (
              <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    key={`blog-page-${pageNumber}`}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`min-w-8 px-2 py-1 text-xs rounded border transition-colors ${
                      pageNumber === currentPage
                        ? "bg-red-500/20 border-red-500/50 text-red-300"
                        : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
