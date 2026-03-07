import React from "react";

export default function HeroSection() {
  return (
    <section className="relative h-[450px] w-full overflow-hidden px-6 py-6 bg-black rounded-b-2xl shadow-xl">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/assets/Xfrizon-Hero-Vid.mp4"
        autoPlay
        loop
        muted
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      <div className="absolute bottom-10 left-10">
        {/* Removed duplicate text, now shown above HeroSection */}
        <p className="text-gray-300 mt-2">
          10% of amount spent goes to African kids in Nigeria, South Africa...
        </p>
      </div>
    </section>
  );
}
