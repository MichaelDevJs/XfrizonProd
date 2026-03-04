import React from "react";
import { toast } from "react-toastify";

export default function BlogList({
  blogs,
  onEdit,
  onDelete,
  onPublish,
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
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">All Blog Posts</h1>
        <p className="text-gray-600 mt-2">
          Manage and view all your blog posts
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8">
        <input
          type="text"
          placeholder="Search blogs by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-gray-600 text-sm">Total Blogs</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {blogs.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-gray-600 text-sm">Published</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {blogs.filter((b) => b.status === "PUBLISHED").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-gray-600 text-sm">Drafts</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {blogs.filter((b) => b.status === "DRAFT").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-gray-600 text-sm">Results Found</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {filteredBlogs.length}
          </p>
        </div>
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBlogs.map((blog) => (
          <div
            key={blog.id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
          >
            {/* Blog Image/Featured */}
            {blog.images && blog.images.length > 0 && (
              <div className="relative h-48 overflow-hidden bg-gray-200">
                <img
                  src={blog.images[0].src}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      blog.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {blog.status}
                  </span>
                </div>
              </div>
            )}

            {/* Blog Content */}
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                {blog.title}
              </h3>

              <p className="text-sm text-gray-600 mb-3">
                By <span className="font-semibold">{blog.author}</span>
              </p>

              {blog.excerpt && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {blog.excerpt}
                </p>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500 mb-4 mt-auto">
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {blog.category}
                </span>
                <span>{blog.createdAt}</span>
              </div>

              {/* Media Indicators */}
              <div className="flex gap-2 mb-4 text-xs">
                {blog.images && blog.images.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    📸 {blog.images.length}
                  </span>
                )}
                {blog.videos && blog.videos.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    🎬 {blog.videos.length}
                  </span>
                )}
                {blog.audioTracks && blog.audioTracks.length > 0 && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    🎵 {blog.audioTracks.length}
                  </span>
                )}
                {blog.youtubeLinks && blog.youtubeLinks.length > 0 && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                    ▶️ {blog.youtubeLinks.length}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(blog)}
                  disabled={isDeleting === blog.id}
                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✎ Edit
                </button>
                {blog.status !== "PUBLISHED" ? (
                  <button
                    onClick={() => onPublish(blog.id)}
                    disabled={isDeleting === blog.id}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📤 Publish
                  </button>
                ) : (
                  <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold cursor-default">
                    ✓ Published
                  </button>
                )}
                <button
                  onClick={() => handleDelete(blog.id)}
                  disabled={isDeleting === blog.id}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          <p className="text-gray-500 text-lg">
            {blogs.length === 0
              ? "No blogs yet. Create your first blog post!"
              : "No blogs match your search."}
          </p>
        </div>
      )}
    </div>
  );
}
