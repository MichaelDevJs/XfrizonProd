import React from "react";
import { toast } from "react-toastify";

export default function BlogList({
  blogs,
  onEdit,
  onDelete,
  onPublish,
  onDuplicate,
  searchTerm,
  setSearchTerm,
  isDeleting = null,
}) {
  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      onDelete(id);
    }
  };

  return (
    <div className="bg-[#1e1e1e] text-zinc-100 rounded-lg p-3 sm:p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-xl font-semibold text-zinc-100">
          All Blog Posts
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Manage and view all your blog posts
        </p>
      </div>

      {/* Search */}
      <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3 mb-4">
        <input
          type="text"
          placeholder="Search blogs by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3">
          <p className="text-zinc-500 text-[10px] uppercase">Total Blogs</p>
          <p className="text-xl font-semibold text-zinc-100 mt-1">
            {blogs.length}
          </p>
        </div>
        <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3">
          <p className="text-zinc-500 text-[10px] uppercase">Published</p>
          <p className="text-xl font-semibold text-green-400 mt-1">
            {blogs.filter((b) => b.status === "PUBLISHED").length}
          </p>
        </div>
        <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3">
          <p className="text-zinc-500 text-[10px] uppercase">Drafts</p>
          <p className="text-xl font-semibold text-yellow-400 mt-1">
            {blogs.filter((b) => b.status === "DRAFT").length}
          </p>
        </div>
        <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3">
          <p className="text-zinc-500 text-[10px] uppercase">Results Found</p>
          <p className="text-xl font-semibold text-zinc-200 mt-1">
            {filteredBlogs.length}
          </p>
        </div>
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredBlogs.map((blog) => (
          <div
            key={blog.id}
            className="bg-zinc-950 rounded-lg border border-zinc-800 hover:border-zinc-700 transition overflow-hidden flex flex-col"
          >
            {/* Blog Image/Featured */}
            {blog.images && blog.images.length > 0 && (
              <div className="relative h-36 overflow-hidden bg-zinc-900">
                <img
                  src={blog.images[0].src}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      blog.status === "PUBLISHED"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}
                  >
                    {blog.status}
                  </span>
                </div>
              </div>
            )}

            {/* Blog Content */}
            <div className="p-3 flex flex-col flex-1">
              <h3 className="text-sm font-semibold text-zinc-100 mb-1 line-clamp-2">
                {blog.title}
              </h3>

              <p className="text-xs text-zinc-400 mb-2">
                By <span className="font-semibold">{blog.author}</span>
              </p>

              {blog.excerpt && (
                <p className="text-xs text-zinc-400 mb-3 line-clamp-2">
                  {blog.excerpt}
                </p>
              )}

              <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-3 mt-auto">
                <span className="bg-zinc-900 px-2 py-1 rounded">
                  {blog.category}
                </span>
                <span>{blog.createdAt}</span>
              </div>

              {/* Media Indicators */}
              <div className="flex gap-1.5 mb-3 text-[10px] flex-wrap">
                {blog.images && blog.images.length > 0 && (
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                    📸 {blog.images.length}
                  </span>
                )}
                {blog.videos && blog.videos.length > 0 && (
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                    🎬 {blog.videos.length}
                  </span>
                )}
                {blog.audioTracks && blog.audioTracks.length > 0 && (
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                    🎵 {blog.audioTracks.length}
                  </span>
                )}
                {blog.youtubeLinks && blog.youtubeLinks.length > 0 && (
                  <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded">
                    ▶️ {blog.youtubeLinks.length}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => onEdit(blog)}
                  disabled={isDeleting === blog.id}
                  className="flex-1 px-2.5 py-1.5 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✎ Edit
                </button>
                <button
                  onClick={() => onDuplicate(blog)}
                  disabled={isDeleting === blog.id}
                  title="Duplicate blog"
                  className="px-2.5 py-1.5 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📋
                </button>
                {blog.status !== "PUBLISHED" ? (
                  <button
                    onClick={() => onPublish(blog.id)}
                    disabled={isDeleting === blog.id}
                    className="flex-1 px-2.5 py-1.5 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📤 Publish
                  </button>
                ) : (
                  <button className="flex-1 px-2.5 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs font-semibold cursor-default">
                    ✓ Published
                  </button>
                )}
                <button
                  onClick={() => handleDelete(blog.id)}
                  disabled={isDeleting === blog.id}
                  className="px-2.5 py-1.5 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting === blog.id ? "⏳" : "🗑"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBlogs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-sm">
            {blogs.length === 0
              ? "No blogs yet. Create your first blog post!"
              : "No blogs match your search."}
          </p>
        </div>
      )}
    </div>
  );
}
