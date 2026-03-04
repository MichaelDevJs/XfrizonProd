import React from "react";
import { Link } from "react-router-dom";

export default function FeaturedBlogCard({ blog, layout = "normal" }) {
  return (
    <Link
      to={`/blog/${blog.id}`}
      className={`group cursor-pointer transition-transform duration-300 hover:scale-105 block ${
        layout === "featured" ? "col-span-2 row-span-2" : ""
      }`}
    >
      {/* Blog Image Container */}
      <div
        className={`relative bg-gradient-to-br from-gray-300 to-gray-400 overflow-hidden mb-4 ${
          layout === "featured" ? "h-96" : layout === "tall" ? "h-80" : "h-56"
        }`}
      >
        <img
          src={blog.image || "https://via.placeholder.com/400x300?text=Blog"}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Blog Content */}
      <div className="px-0">
        {/* Meta - Date and Category */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-light uppercase tracking-widest text-gray-500">
            {blog.date}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-red-500">
            {blog.category}
          </span>
        </div>

        {/* Title */}
        <h3
          className={`font-bold text-gray-900 mb-2 group-hover:text-red-500 transition-colors duration-200 ${
            layout === "featured" ? "text-2xl" : "text-lg line-clamp-2"
          }`}
        >
          {blog.title}
        </h3>

        {/* Excerpt */}
        <p
          className={`text-gray-700 mb-3 ${
            layout === "featured"
              ? "text-sm line-clamp-3"
              : "text-xs line-clamp-2"
          }`}
        >
          {blog.excerpt}
        </p>

        {/* Author */}
        <span className="text-xs text-gray-500 uppercase tracking-widest">
          {blog.author}
        </span>
      </div>
    </Link>
  );
}
