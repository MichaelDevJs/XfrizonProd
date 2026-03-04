import React from "react";
import { FaCalendarAlt, FaClock } from "react-icons/fa";

export default function NewsCard({ news }) {
  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      {/* News Image */}
      <div className="relative overflow-hidden h-40 bg-gradient-to-br from-gray-200 to-gray-300">
        <img
          src={news.image || "https://via.placeholder.com/300x160?text=News"}
          alt={news.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {news.tag && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {news.tag}
          </span>
        )}
      </div>

      {/* News Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2">
          {news.title}
        </h3>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {news.excerpt}
        </p>

        {/* Meta Information */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 mt-auto">
          <div className="flex items-center gap-1">
            <FaCalendarAlt size={12} />
            <span>{news.date}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaClock size={12} />
            <span>{news.readTime}</span>
          </div>
        </div>

        {/* Author */}
        <p className="text-xs text-gray-700 font-semibold mb-3">
          By {news.author}
        </p>

        {/* Read More Button */}
        <button className="w-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 rounded transition-colors duration-200">
          Read More
        </button>
      </div>
    </div>
  );
}
