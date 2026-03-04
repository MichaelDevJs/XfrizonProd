import React from "react";
import HeroSection from "../../feature/home/HeroSection";
import CompactFilterBar from "../../feature/home/CompactFilterBar";
import EventSection from "../../feature/home/EventSection";
import CenteredBanner from "../../component/CenteredBanner/CenteredBanner";

import BlogsSection from "../../feature/home/blogs/BlogsSection";
import FilterProvider from "../../context/FilterContext";

export default function HomePage() {
  return (
    <FilterProvider>
      <div className="bg-black text-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <CenteredBanner />
          <HeroSection />

          {/* Transition spacing from Hero to Blog */}
          <div className="h-12" />

          {/* Blog Section - Dark Background */}
          <div className="bg-[#1e1e1e] text-gray-100 rounded-none px-0 py-0 mt-0 mx-0 shadow-none transition-all duration-500">
            <BlogsSection />
          </div>

          {/* Event Section */}
          <div className="mt-8">
            <CompactFilterBar />
            <div className="h-6" />
            <EventSection />
          </div>
        </div>
      </div>
    </FilterProvider>
  );
}
