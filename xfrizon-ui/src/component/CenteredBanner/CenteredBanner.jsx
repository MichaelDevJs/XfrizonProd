import React, { useEffect, useRef, useState } from "react";

// Minimal CenteredBanner, one text at a time, fade/slide effect
const CenteredBanner = () => {
  const items = [
    "Promoting Afrocentric Events",
    "Discover Events Near You",
    "Celebrate Culture Together",
  ];
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
  }, [index]);

  return (
    <div className="w-full flex justify-center items-center mb-8 py-6">
      <span
        className={`text-2xl md:text-4xl font-bold uppercase tracking-wider text-center text-red-500 transition-all duration-500 ease-in-out ${
          fade ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {items[index]}
      </span>
    </div>
  );
};

export default CenteredBanner;
