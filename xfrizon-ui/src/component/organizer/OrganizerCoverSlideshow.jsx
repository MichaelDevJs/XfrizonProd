import { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

/**
 * Hero-style slideshow for organizer cover media.
 * Props:
 *   slides   – [{ id, url, type: 'image'|'video' }]
 */
const OrganizerCoverSlideshow = ({ slides = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Reset to 0 when slide list changes (e.g. config preview update)
  useEffect(() => {
    setCurrentIndex(0);
    setIsTransitioning(false);
  }, [slides.length]);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
      }, 400);
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, slides.length]);

  const goToSlide = (index) => {
    if (index === currentIndex || slides.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  const goToPrev = () =>
    goToSlide(currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
  const goToNext = () => goToSlide((currentIndex + 1) % slides.length);

  const onTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchMove = (e) => {
    touchEndX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      slides.length <= 1
    )
      return;
    const dist = touchStartX.current - touchEndX.current;
    if (dist > 40) goToNext();
    else if (dist < -40) goToPrev();
  };

  if (slides.length === 0) {
    return (
      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-600">
        No cover media
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentIndex && !isTransitioning
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          {slide.type === "video" ? (
            <video
              src={slide.url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              onError={(e) => (e.target.style.display = "none")}
            />
          ) : (
            <img
              src={slide.url}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => (e.target.style.display = "none")}
            />
          )}
        </div>
      ))}

      {/* Prev / Next arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 flex items-center justify-center text-white transition"
          >
            <FaChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 flex items-center justify-center text-white transition"
          >
            <FaChevronRight size={13} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex ? "bg-white w-4" : "bg-white/60 w-1.5"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizerCoverSlideshow;
