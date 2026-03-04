import React from "react";
import { FaStar, FaCheckCircle } from "react-icons/fa";

export default function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-lg p-5 hover:shadow-lg transition-shadow duration-300 border border-gray-200">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-sm text-gray-900">{review.name}</h4>
            {review.verified && (
              <FaCheckCircle size={14} className="text-green-500" />
            )}
          </div>
          <p className="text-xs text-gray-600">{review.eventName}</p>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              size={12}
              className={
                i < review.rating ? "text-yellow-400" : "text-gray-300"
              }
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-gray-700">
          {review.rating}.0
        </span>
      </div>

      {/* Review Text */}
      <p className="text-xs text-gray-700 mb-3 line-clamp-3">
        {review.comment}
      </p>

      {/* Review Date */}
      <p className="text-xs text-gray-500">{review.date}</p>
    </div>
  );
}
