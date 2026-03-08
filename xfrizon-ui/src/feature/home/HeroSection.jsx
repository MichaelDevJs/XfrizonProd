import React from "react";

export default function HeroSection({
  videoUrl = "/assets/Xfrizon-Hero-Vid.mp4",
}) {
  return (
    <section className="relative h-75 sm:h-95 lg:h-112.5 w-full overflow-hidden px-4 sm:px-6 py-4 sm:py-6 bg-black rounded-b-2xl shadow-xl">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/80" />

      <div className="absolute bottom-5 sm:bottom-10 left-4 sm:left-10 right-4 sm:right-auto max-w-full sm:max-w-2xl"></div>
    </section>
  );
}
