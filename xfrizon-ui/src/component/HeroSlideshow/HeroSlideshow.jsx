import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HeroSlideshow = ({
  items = [],
  title = "",
  subtitle = "",
  showXfMag = false,
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

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
  const currentSlideTitle = String(currentItem?.title || "").trim();
  const currentSlideCaption = String(currentItem?.caption || "").trim();
  const currentSlideCtaLabel = String(currentItem?.ctaLabel || "").trim();
  const currentSlideCtaLink = String(currentItem?.ctaLink || "").trim();

  // Custom styling from slide
  const textColor = currentItem?.textColor || "#ffffff";
  const textSize = currentItem?.textSize || "normal";
  const textPosition = currentItem?.textPosition || "bottom-left";
  const overlayOpacity = currentItem?.overlayOpacity || "30";
  const ctaBgColor = currentItem?.ctaBgColor || "#ef4444";
  const ctaTextColor = currentItem?.ctaTextColor || "#ffffff";

  // Map text size to Tailwind classes
  const getTextSizeClasses = () => {
    switch (textSize) {
      case "small":
        return { title: "text-sm sm:text-xl", caption: "text-xs sm:text-sm" };
      case "large":
        return {
          title: "text-2xl sm:text-4xl",
          caption: "text-base sm:text-lg",
        };
      case "xl":
        return { title: "text-3xl sm:text-5xl", caption: "text-lg sm:text-xl" };
      default:
        return {
          title: "text-lg sm:text-3xl",
          caption: "text-sm sm:text-base",
        };
    }
  };

  // Map text position to flex alignment classes
  const getPositionClasses = () => {
    const positions = {
      "top-left": "items-start justify-start pt-6 sm:pt-8",
      "top-center": "items-start justify-center pt-6 sm:pt-8",
      "top-right": "items-start justify-end pt-6 sm:pt-8",
      "center-left": "items-center justify-start",
      center: "items-center justify-center",
      "center-right": "items-center justify-end",
      "bottom-left": "items-end justify-start pb-6 sm:pb-8",
      "bottom-center": "items-end justify-center pb-6 sm:pb-8",
      "bottom-right": "items-end justify-end pb-6 sm:pb-8",
    };
    return positions[textPosition] || positions["bottom-left"];
  };

  const sizeClasses = getTextSizeClasses();
  const positionClasses = getPositionClasses();

  const apiBaseUrl =
    import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8081/api/v1";
  const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, "");

  const resolveMediaUrl = (path) => {
    if (!path) return "";
    const value = String(path).trim();
    if (!value) return "";
    if (
      /^https?:\/\//i.test(value) ||
      value.startsWith("data:") ||
      value.startsWith("blob:")
    ) {
      return value;
    }
    if (value.startsWith("/assets/")) return value;
    const normalizedPath = value.startsWith("/") ? value : `/${value}`;
    if (
      normalizedPath.startsWith("/uploads/") ||
      normalizedPath.startsWith("/api/v1/uploads/")
    ) {
      return `${apiOrigin}${normalizedPath}`;
    }
    return normalizedPath;
  };

  const isVideoItem = (item) => {
    const type = String(item?.type || "").toLowerCase();
    const url = String(item?.url || "").toLowerCase();
    return (
      type.includes("video") ||
      /(\.mp4|\.mov|\.webm|\.m4v|\.ogg)(\?|$)/.test(url)
    );
  };

  const handleSlideCtaClick = () => {
    if (!currentSlideCtaLink) return;
    if (/^https?:\/\//i.test(currentSlideCtaLink)) {
      window.open(currentSlideCtaLink, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(currentSlideCtaLink);
  };

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

  const onTouchStart = (e) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches?.[0]?.clientX ?? null);
  };

  const onTouchMove = (e) => {
    setTouchEndX(e.targetTouches?.[0]?.clientX ?? null);
  };

  const onTouchEnd = () => {
    if (touchStartX === null || touchEndX === null || slideItems.length <= 1) {
      return;
    }

    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrevious();
    }
  };

  return (
    <section
      className="relative w-full aspect-video sm:aspect-2/1 lg:aspect-3/1 xl:aspect-10/3 overflow-hidden bg-black"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {showXfMag && (
        <div className="absolute left-4 sm:left-6 top-4 z-20 pointer-events-none">
          <span className="text-red-500 font-extrabold text-base tracking-wide">
            XF
          </span>
          <span className="text-white font-semibold text-sm tracking-wide ml-1">
            Mag
          </span>
        </div>
      )}

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
            {isVideoItem(item) ? (
              <video
                src={resolveMediaUrl(item.url)}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={resolveMediaUrl(item.url)}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {/* Overlay Content */}
      {(title ||
        subtitle ||
        currentSlideTitle ||
        currentSlideCaption ||
        currentSlideCtaLabel) && (
        <div
          className={`absolute inset-0 flex ${positionClasses}`}
          style={{
            backgroundColor: `rgba(0, 0, 0, ${parseInt(overlayOpacity) / 100})`,
          }}
        >
          <div className="w-full px-4 sm:px-6">
            <div className="max-w-3xl">
              {currentSlideTitle ? (
                <h2
                  className={`${sizeClasses.title} font-semibold tracking-tight mb-2`}
                  style={{ color: textColor }}
                >
                  {currentSlideTitle}
                </h2>
              ) : (
                title && (
                  <h1
                    className={`${sizeClasses.title} font-semibold tracking-tight mb-2`}
                    style={{ color: textColor }}
                  >
                    {title}
                  </h1>
                )
              )}

              {currentSlideCaption ? (
                <p
                  className={`${sizeClasses.caption} mb-3 sm:mb-4 opacity-90`}
                  style={{ color: textColor }}
                >
                  {currentSlideCaption}
                </p>
              ) : (
                subtitle && (
                  <p
                    className={`${sizeClasses.caption} mb-3 sm:mb-4 opacity-90`}
                    style={{ color: textColor }}
                  >
                    {subtitle}
                  </p>
                )
              )}

              {currentSlideCtaLabel && currentSlideCtaLink && (
                <button
                  type="button"
                  onClick={handleSlideCtaClick}
                  className="inline-flex items-center rounded-md text-xs sm:text-sm font-semibold px-3.5 py-2 transition-all hover:opacity-90"
                  style={{
                    backgroundColor: ctaBgColor,
                    color: ctaTextColor,
                  }}
                >
                  {currentSlideCtaLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dots Indicator (show only if multiple items) */}
      {slideItems.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slideItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex ? "bg-white w-4" : "bg-white/60 w-1.5"
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
