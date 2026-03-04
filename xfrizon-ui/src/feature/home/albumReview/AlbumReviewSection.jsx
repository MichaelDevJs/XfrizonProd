import React from "react";
import AlbumCard from "./AlbumCard";

const mockAlbumReviews = [
  {
    id: 1,
    title: "African Nights",
    artist: "The Groove Collective",
    cover: "https://via.placeholder.com/300x300?text=Album+1",
    rating: 4.8,
    reviewSummary:
      "A groundbreaking album that blends traditional and modern sounds seamlessly...",
    reviewDate: "Feb 15, 2026",
  },
  {
    id: 2,
    title: "Urban Pulse",
    artist: "City Sounds",
    cover: "https://via.placeholder.com/300x300?text=Album+2",
    rating: 4.5,
    reviewSummary:
      "Fresh beats and innovative production make this a must-listen album of the season...",
    reviewDate: "Feb 12, 2026",
  },
  {
    id: 3,
    title: "Sunset Dreams",
    artist: "Luna Project",
    cover: "https://via.placeholder.com/300x300?text=Album+3",
    rating: 4.7,
    reviewSummary:
      "An emotional journey through soul-stirring melodies and powerful vocals...",
    reviewDate: "Feb 10, 2026",
  },
  {
    id: 4,
    title: "Electric Era",
    artist: "Neon Vibes",
    cover: "https://via.placeholder.com/300x300?text=Album+4",
    rating: 4.3,
    reviewSummary:
      "High-energy tracks that will get you moving and keep you engaged throughout...",
    reviewDate: "Feb 8, 2026",
  },
];

export default function AlbumReviewSection() {
  return (
    <div className="mt-16 mb-16">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-light uppercase tracking-widest text-gray-900 mb-2">
          Album Reviews
        </h2>
        <p className="text-sm text-gray-600">
          Expert reviews of the latest musical releases
        </p>
      </div>

      {/* Album Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockAlbumReviews.map((album) => (
          <AlbumCard key={album.id} album={album} />
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
