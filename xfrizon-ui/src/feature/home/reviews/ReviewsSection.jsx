import React, { useState } from "react";
import ReviewCard from "./ReviewCard";

const mockReviews = [
  {
    id: 1,
    name: "James Miller",
    eventName: "Afrobeats Night 2026",
    rating: 5,
    comment:
      "Amazing event! The energy was incredible and the artists performed beyond expectations. Definitely coming back next year!",
    date: "Feb 18, 2026",
    verified: true,
  },
  {
    id: 2,
    name: "Sophia Williams",
    eventName: "Electronic Vibes Festival",
    rating: 4,
    comment:
      "Great lineup and excellent organization. The only thing I would improve is the seating arrangements in VIP section.",
    date: "Feb 16, 2026",
    verified: true,
  },
  {
    id: 3,
    name: "Ahmed Hassan",
    eventName: "Jazz Night Experience",
    rating: 5,
    comment:
      "This was the best live jazz performance I've ever witnessed. Highly professional and well-coordinated event.",
    date: "Feb 14, 2026",
    verified: true,
  },
  {
    id: 4,
    name: "Maria Rodriguez",
    eventName: "Comedy Nights Stand-up",
    rating: 4,
    comment:
      "Hilarious evening with world-class comedians. Food and drinks could be better priced, but overall fantastic.",
    date: "Feb 12, 2026",
    verified: false,
  },
  {
    id: 5,
    name: "David Chen",
    eventName: "Hip-Hop Summit 2026",
    rating: 5,
    comment:
      "Exceeded all expectations! The production quality, sound system, and artist performances were phenomenal.",
    date: "Feb 10, 2026",
    verified: true,
  },
  {
    id: 6,
    name: "Emily Thompson",
    eventName: "Soul Sessions Live",
    rating: 4,
    comment:
      "Beautiful evening with soulful music. Great ambiance and friendly staff. Will definitely attend again!",
    date: "Feb 8, 2026",
    verified: true,
  },
];

export default function ReviewsSection() {
  return (
    <div className="mt-16 mb-16">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-light uppercase tracking-widest text-gray-900 mb-2">
          Event Reviews
        </h2>
        <p className="text-sm text-gray-600">
          See what attendees and fans are saying about recent events
        </p>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* View All Button */}
      <div className="flex justify-center mt-10">
        <button className="px-8 py-2 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-light uppercase tracking-widest text-xs transition-colors duration-200 rounded">
          View All Reviews
        </button>
      </div>
    </div>
  );
}
