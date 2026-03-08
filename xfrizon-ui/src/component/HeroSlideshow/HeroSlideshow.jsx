import { useState, useEffect } from "react";

const HeroSlideshow = ({
  items = [],
  title = "",
  subtitle = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Default to a single video if no items provided
  const defaultItems = [
    {
      id: "1",
      type: "video",
      url: "/assets/Xfrizon-Hero-Vid.mp4",
      duration: 10000,
      order: 0,
    },
  ];

  const slideItems = items.length > 0 ? items : defaultItems;
  const currentItem = slideItems[currentIndex];

  useEffect(() => {
    if (slideItems.length <= 1) return;

    const timer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % slideItems.length);
        setIsTransitioning(false);
      }, 500); // Transition duration
    }, currentItem?.duration || 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, slideItems.length, currentItem?.duration]);

  const goToSlide = (index) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 500);
  };

  const goToPrevious = () => {
    const newIndex =
      currentIndex === 0 ? slideItems.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % slideItems.length;
    goToSlide(newIndex);
  };

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* Slideshow Items */}
      <div className="relative w-full h-full">
        {slideItems.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex && !isTransitioning
                ? "opacity-100"
                : "opacity-0"
            }`}
          >
            {item.type === "video" ? (
              <video
                src={item.url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={item.url}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {/* Overlay Content */}
      {(title || subtitle) && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-center text-white px-4">
            {title && <h1 className="text-4xl md:text-6xl font-bold mb-4">{title}</h1>}
            {subtitle && <p className="text-xl md:text-2xl mb-8">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* Navigation Arrows (show only if multiple items) */}
      {slideItems.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors z-10"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors z-10"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator (show only if multiple items) */}
      {slideItems.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slideItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex ? "bg-white w-8" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSlideshow;
