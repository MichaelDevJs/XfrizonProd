import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import blogApi from "../../../api/blogApi";
import BlogCard from "../../blog/BlogCard";
import HeroSlideshow from "../../../component/HeroSlideshow/HeroSlideshow";
import api from "../../../api/axios";

export default function BlogsSection() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blogHeroSlideshow, setBlogHeroSlideshow] = useState([]);

  useEffect(() => {
    fetchBlogs();
    fetchBlogHeroSettings();
  }, []);

  const fetchBlogHeroSettings = async () => {
    try {
      const response = await api.get("/blog-hero-settings");
      const settings = response.data;
      if (settings.blogHeroSlideshow) {
        const slideshow = JSON.parse(settings.blogHeroSlideshow);
        setBlogHeroSlideshow(Array.isArray(slideshow) ? slideshow : []);
      }
    } catch (err) {
      console.error("Failed to load blog hero slideshow:", err);
      setBlogHeroSlideshow([]);
    }
  };

  const resolveImage = (path) => {
    if (!path || typeof path !== "string") return "";
    if (
      path.startsWith("data:") ||
      path.startsWith("http://") ||
      path.startsWith("https://")
    ) {
      return path;
    }

    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
      return `http://localhost:8081${normalized}`;
    }

    return `http://localhost:8081/api/v1${normalized}`;
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await blogApi.getAllBlogs();

      let blogList = response.data
        ? response.data.content || response.data
        : response;

      if (Array.isArray(blogList)) {
        blogList = blogList.map((blog) => {
          const coverImageValue =
            typeof blog.coverImage === "string"
              ? blog.coverImage
              : blog.coverImage?.src || "";

          const firstImage =
            Array.isArray(blog.images) && blog.images.length > 0
              ? blog.images[0]?.src || ""
              : "";

          return {
            ...blog,
            excerpt: blog.excerpt || blog.content?.substring(0, 140) || "",
            coverImage: resolveImage(coverImageValue || firstImage),
          };
        });
      }

      const publishedBlogs = Array.isArray(blogList)
        ? blogList
            .filter((blog) => blog.status === "PUBLISHED")
            .sort(
              (a, b) =>
                new Date(b.publishedAt || b.createdAt || 0) -
                new Date(a.publishedAt || a.createdAt || 0),
            )
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

  const headlineBlog = blogs[0] || null;
  const latestBlogs = useMemo(() => blogs.slice(1, 4), [blogs]);

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

  if (!headlineBlog) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No blog articles available yet</p>
      </div>
    );
  }

  return (
    <section className="mt-0 mb-0 bg-[#1e1e1e] px-6 py-12">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <article className="xl:col-span-8">
          <h3 className="text-2xl md:text-3xl font-semibold tracking-[0.12em] uppercase text-zinc-100 mb-6 text-center">
            Headline
          </h3>

          <div className="max-w-4xl mx-auto">
            {blogHeroSlideshow.length > 0 ? (
              <HeroSlideshow items={blogHeroSlideshow} showXfMag />
            ) : (
              <Link
                to={`/blog/${headlineBlog.id}`}
                className="group block relative overflow-hidden"
              >
                <div className="relative w-full aspect-video sm:aspect-2/1 lg:aspect-3/1 overflow-hidden">
                  <div className="absolute left-5 sm:left-6 top-3 z-20 pointer-events-none">
                    <span className="text-red-500 font-extrabold text-base sm:text-lg tracking-wide pr-1">
                      XF
                    </span>
                    <span className="text-white font-semibold text-sm sm:text-lg tracking-wide ml-2">
                      Mag
                    </span>
                  </div>
                  {headlineBlog.coverImage ? (
                    <img
                      src={headlineBlog.coverImage}
                      alt={headlineBlog.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900" />
                  )}

                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest text-zinc-300 mb-2">
                      {headlineBlog.category || "General"}
                    </p>
                    <h4 className="text-xl sm:text-3xl font-semibold text-white line-clamp-2 mb-2">
                      {headlineBlog.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2">
                      {headlineBlog.excerpt}
                    </p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </article>

        <aside className="xl:col-span-4 w-full">
          <h3 className="text-2xl md:text-3xl font-semibold tracking-[0.12em] uppercase text-zinc-100 mb-6 text-center md:text-left">
            Latest
          </h3>

          <div className="max-w-4xl mx-auto xl:max-w-none xl:mx-0">
            <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory md:block md:space-y-4 md:overflow-visible">
              {latestBlogs.length > 0 ? (
                latestBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="min-w-full max-w-full shrink-0 snap-start md:min-w-0"
                  >
                    <Link
                      to={`/blog/${blog.id}`}
                      className="block cursor-pointer"
                    >
                      <BlogCard blog={blog} />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-zinc-500 text-sm border border-zinc-800">
                  No more blogs yet
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center md:text-left">
            <Link
              to="/blogs"
              className="text-red-500 hover:text-red-400 font-light uppercase tracking-widest text-sm transition-colors duration-200"
            >
              Read More Articles
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
