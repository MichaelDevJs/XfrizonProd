import React from "react";
import { FaStar } from "react-icons/fa";

export default function AlbumCard({ album }) {
  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      {/* Album Cover */}
      <div className="relative overflow-hidden h-40 bg-gradient-to-br from-purple-200 to-blue-200">
        <img
          src={album.cover || "https://via.placeholder.com/300x300?text=Album"}
          alt={album.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Album Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
          {album.title}
        </h3>
        <p className="text-xs text-gray-600 mb-3">{album.artist}</p>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                size={12}
                className={
                  i < Math.floor(album.rating)
                    ? "text-yellow-400"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-700">
            {album.rating.toFixed(1)}
          </span>
        </div>

        {/* Review Summary */}
        <p className="text-xs text-gray-600 mb-3 line-clamp-2 mt-auto">
          {album.reviewSummary}
        </p>

        {/* Review Date */}
        <p className="text-xs text-gray-500 mb-3">
          Reviewed on {album.reviewDate}
        </p>

        {/* Read Review Button */}
        <button className="w-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 rounded transition-colors duration-200">
          Read Full Review
        </button>
      </div>
    </div>
  );
}
