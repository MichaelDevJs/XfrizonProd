import React, { useEffect, useRef, useState } from "react";

const CenteredBanner = ({
  texts = [
    "Promoting Afrocentric Events",
    "Discover Events Near You",
    "Celebrate Culture Together",
  ],
  direction = "rtl",
  textColor = "#ef4444",
  fontFamily = "inherit",
  fontWeight = "600",
  fontSizePx = 16,
  scrollDuration = 10,
  animationType = "marquee",
  unlimitedLoop = false,
  pauseOnHover = false,
}) => {
  const items = texts.length > 0 ? texts : ["Welcome to Xfrizon"];
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef(null);

  const normalizedDirection = direction === "ltr" ? "ltr" : "rtl";
  const durationSeconds =
    Number(scrollDuration) > 1 ? Number(scrollDuration) : 10;
  const normalizedAnimation =
    typeof animationType === "string" ? animationType : "marquee";
  const isMarquee = normalizedAnimation === "marquee";
  const normalizedFontSize =
    Number.isFinite(Number(fontSizePx)) && Number(fontSizePx) > 8
      ? Number(fontSizePx)
      : 16;
  const shouldLoopForever = Boolean(unlimitedLoop);
  const shouldRotateTexts = items.length > 1 && !shouldLoopForever;
  const cycleDurationMs = isMarquee
    ? durationSeconds * 1000
    : Math.max(2200, durationSeconds * 700);

  const animationName = (() => {
    if (normalizedAnimation === "fade") return "xf-banner-fade";
    if (normalizedAnimation === "pulse") return "xf-banner-pulse";
    if (normalizedAnimation === "slide") return "xf-banner-slide-up";
    return normalizedDirection === "ltr" ? "xf-banner-ltr" : "xf-banner-rtl";
  })();

  useEffect(() => {
    if (!shouldRotateTexts) {
      return undefined;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, cycleDurationMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cycleDurationMs, index, items.length, shouldRotateTexts]);

  return (
    <div
      className={`w-full my-0 py-0 overflow-hidden ${
        pauseOnHover ? "xf-banner-pause " : ""
      }${
        isMarquee ? "" : "flex justify-center items-center"
      }`}
    >
      <style>{`
        .xf-banner-pause:hover .xf-banner-anim {
          animation-play-state: paused;
        }

        @keyframes xf-banner-rtl {
          0% { transform: translateX(110vw); opacity: 1; }
          100% { transform: translateX(-110vw); opacity: 1; }
        }

        @keyframes xf-banner-ltr {
          0% { transform: translateX(-110vw); opacity: 1; }
          100% { transform: translateX(110vw); opacity: 1; }
        }

        @keyframes xf-banner-fade {
          0% { opacity: 0; transform: translateY(6px); }
          18% { opacity: 1; transform: translateY(0); }
          82% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }

        @keyframes xf-banner-pulse {
          0% { opacity: 0.75; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0.75; transform: scale(0.98); }
        }

        @keyframes xf-banner-slide-up {
          0% { opacity: 0; transform: translateY(14px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-14px); }
        }
      `}</style>
      <span
        key={`text-${index}-${normalizedDirection}-${durationSeconds}-${normalizedAnimation}`}
        className={`xf-banner-anim whitespace-nowrap italic tracking-normal ${
          isMarquee ? "inline-block" : "text-center"
        }`}
        style={{
          color: textColor,
          fontFamily,
          fontWeight,
          fontSize: `${normalizedFontSize}px`,
          animationName,
          animationDuration: `${durationSeconds}s`,
          animationTimingFunction: isMarquee ? "linear" : "ease-in-out",
          animationIterationCount:
            shouldLoopForever || (isMarquee && items.length === 1)
              ? "infinite"
              : 1,
          willChange: "transform",
        }}
      >
        {items[index]}
      </span>
    </div>
  );
};

export default CenteredBanner;
