import React from "react";
import { useNavigate } from "react-router-dom";

export default function BlogCard({ blog }) {
  const navigate = useNavigate();

  const handleReadMore = () => {
    navigate(`/blog/${blog.id}`);
  };

  return (
    <div
      onClick={handleReadMore}
      className="overflow-hidden cursor-pointer group h-full flex flex-col"
    >
      {/* Blog Image */}
      <div className="relative overflow-hidden bg-black rounded-lg mb-4 shrink-0 h-64">
        {blog.image || blog.coverImage ? (
          <img
            src={blog.image || blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      {/* Blog Content */}
      <div className="flex flex-col grow">
        <h3
          className="text-lg font-bold text-gray-100 mb-3 line-clamp-3 leading-tight group-hover:text-red-400 transition-colors text-center"
          style={{
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          {blog.title}
        </h3>
        <p
          className="text-sm text-gray-400 line-clamp-3 leading-relaxed"
          style={{
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          {blog.excerpt}
        </p>
      </div>
    </div>
  );
}
