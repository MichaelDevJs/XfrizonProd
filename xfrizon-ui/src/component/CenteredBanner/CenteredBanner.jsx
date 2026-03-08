import React, { useEffect, useRef, useState } from "react";

// Minimal CenteredBanner, one text at a time, fade/slide effect
const CenteredBanner = ({
  texts = [
    "Promoting Afrocentric Events",
    "Discover Events Near You",
    "Celebrate Culture Together",
  ],
}) => {
  const items = texts.length > 0 ? texts : ["Welcome to Xfrizon"];
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const timeoutRef = useRef();

  useEffect(() => {
    setFade(true);
    timeoutRef.current = setTimeout(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length);
        setFade(true);
      }, 400); // fade out duration
    }, 3000); // visible duration
    return () => clearTimeout(timeoutRef.current);
  }, [index, items.length]);

  return (
    <div className="w-full flex justify-center items-center my-1 py-0">
      <span
        className={`text-xs md:text-base italic font-semibold uppercase tracking-normal text-center text-red-500 transition-all duration-500 ease-in-out ${
          fade ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {items[index]}
      </span>
    </div>
  );
};

export default CenteredBanner;
