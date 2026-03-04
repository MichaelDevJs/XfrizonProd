import React from "react";
import { useRef } from "react";
const SectionBlock = ({ title, children }) => {
  const scrollRef = useRef(null);
  const scrollBy = (offset) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };
  return (
    <section className="py-12">
      <h2
        className="text-2xl font-light uppercase tracking-widest mb-6"
        style={{ color: "#ff0000", fontFamily: "'Rajdhani', sans-serif" }}
      >
        {title}
      </h2>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2 bg-black/90 rounded-none px-6 py-8 hide-scrollbar"
          style={{ scrollBehavior: "smooth" }}
        >
          {React.Children.map(children, (child) => (
            <div className="shrink-0 w-72">{child}</div>
          ))}
        </div>
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white rounded-full p-2 shadow-lg transition"
          onClick={() => scrollBy(320)}
          aria-label="Scroll right"
          style={{ boxShadow: "0 0 16px 0 #0008" }}
        >
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 4.7a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L10.58 10l-4.3-4.3a1 1 0 0 1 0-1.4z" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default SectionBlock;
