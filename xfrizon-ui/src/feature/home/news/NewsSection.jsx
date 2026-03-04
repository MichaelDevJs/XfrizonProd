import React, { useState } from "react";
import NewsCard from "./NewsCard";

const mockNews = [
  {
    id: 1,
    title: "Afrobeats Wave Takes Over Global Charts",
    excerpt:
      "The biggest artists in Afrobeats are dominating streaming platforms worldwide...",
    image: "https://via.placeholder.com/300x160?text=Afrobeats",
    date: "Feb 20, 2026",
    readTime: "5 min read",
    author: "Sarah Johnson",
    tag: "Music",
  },
  {
    id: 2,
    title: "Latest Live Event Trends You Should Know",
    excerpt:
      "From intimate venues to massive festivals, discover what's trending in live events...",
    image: "https://via.placeholder.com/300x160?text=Events",
    date: "Feb 19, 2026",
    readTime: "4 min read",
    author: "Marcus Lee",
    tag: "Events",
  },
  {
    id: 3,
    title: "How Artists Are Connecting With Fans Online",
    excerpt:
      "New strategies for engagement in the digital age of entertainment...",
    image: "https://via.placeholder.com/300x160?text=Artists",
    date: "Feb 18, 2026",
    readTime: "6 min read",
    author: "Emma Chen",
    tag: "Artist Tips",
  },
  {
    id: 4,
    title: "Best Comedy Events This Month",
    excerpt:
      "Laugh out loud with the funniest comedians performing this February...",
    image: "https://via.placeholder.com/300x160?text=Comedy",
    date: "Feb 17, 2026",
    readTime: "3 min read",
    author: "David Brown",
    tag: "Comedy",
  },
];

export default function NewsSection() {
  return (
    <div className="mt-16 mb-16">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-light uppercase tracking-widest text-gray-900 mb-2">
          Latest News
        </h2>
        <p className="text-sm text-gray-600">
          Stay updated with the latest stories from the entertainment world
        </p>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockNews.map((news) => (
          <NewsCard key={news.id} news={news} />
        ))}
      </div>

      {/* View All Button */}
      <div className="flex justify-center mt-10">
        <button className="px-8 py-2 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-light uppercase tracking-widest text-xs transition-colors duration-200 rounded">
          View All News
        </button>
      </div>
    </div>
  );
}
