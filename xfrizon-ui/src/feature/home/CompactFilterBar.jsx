import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FilterContext } from "../../context/FilterContext";
import {
  COUNTRIES_LIST,
  CITIES_BY_COUNTRY_CODE,
} from "../../data/countriesData";

const eventTypes = ["", "NightLife", "Comedy", "Career & Business"];
const genresList = [
  "",
  "Afrobeats",
  "Hip-Hop",
  "Rnb",
  "Soul",
  "Jazz",
  "Amapiano",
  "House",
  "Techno",
  "Dancehall",
  "Trap",
  "Gospel",
  "Electronic",
  "Pop",
  "Reggae",
  "Comedy",
];

export default function CompactFilterBar() {
  const {
    selectedGenre,
    setSelectedGenre,
    selectedEventType,
    setSelectedEventType,
    selectedCountry,
    setSelectedCountry,
    selectedState,
    setSelectedState,
    clearFilters,
  } = useContext(FilterContext);

  const countriesList = [
    { name: "All", code: "ALL", flag: "🌍" },
    { name: "Germany", code: "DE", flag: "🇩🇪" },
    { name: "Japan", code: "JP", flag: "🇯🇵" },
    { name: "Nigeria", code: "NG", flag: "🇳🇬" },
    { name: "United States", code: "US", flag: "🇺🇸" },
    { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
    { name: "France", code: "FR", flag: "🇫🇷" },
    { name: "Others", code: "OTHER", flag: "🌍" },
  ];

  // Set default country to All if not set
  useEffect(() => {
    if (!selectedCountry || !selectedCountry.code) {
      setSelectedCountry({ name: "All", code: "ALL", flag: "🌍" });
    }
  }, [selectedCountry, setSelectedCountry]);
  const citiesByCountry = CITIES_BY_COUNTRY_CODE;
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  const availableStates = useMemo(() => {
    const code = selectedCountry?.code;
    if (!code || !citiesByCountry[code]) return [];
    return citiesByCountry[code];
  }, [selectedCountry, citiesByCountry]);

  const activeCount = useMemo(() => {
    let count = 0;
    if (selectedEventType) count += 1;
    if (selectedGenre) count += 1;
    if (selectedCountry?.code && selectedCountry.code !== "ALL") count += 1;
    if (selectedState) count += 1;
    return count;
  }, [selectedEventType, selectedGenre, selectedCountry, selectedState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      className="bg-zinc-950/70 border border-zinc-800 rounded-lg px-4 py-3 relative"
      ref={panelRef}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-zinc-500">
          Events
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-xs uppercase tracking-widest text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-md hover:border-red-500/40 hover:text-white transition-colors"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          Filter
          {activeCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 rounded-full px-1.5 py-0.5">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-full md:w-130 bg-zinc-950 border border-zinc-800 rounded-lg p-4 shadow-xl z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              className="bg-zinc-900 text-zinc-200 text-xs border border-zinc-800 rounded-md px-2 py-2 focus:outline-none focus:border-red-500/60"
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              aria-label="Event type"
            >
              {eventTypes.map((type) => (
                <option key={type || "all"} value={type}>
                  {type || "All Types"}
                </option>
              ))}
            </select>

            <select
              className="bg-zinc-900 text-zinc-200 text-xs border border-zinc-800 rounded-md px-2 py-2 focus:outline-none focus:border-red-500/60"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              aria-label="Genre"
            >
              {genresList.map((genre) => (
                <option key={genre || "all"} value={genre}>
                  {genre || "All Genres"}
                </option>
              ))}
            </select>

            <select
              className="bg-zinc-900 text-zinc-200 text-xs border border-zinc-800 rounded-md px-2 py-2 focus:outline-none focus:border-red-500/60"
              value={selectedCountry?.code || "ALL"}
              onChange={(e) => {
                const next = countriesList.find(
                  (country) => country.code === e.target.value,
                );
                setSelectedCountry(
                  next || { name: "All", code: "ALL", flag: "🌍" },
                );
                setSelectedState(null);
              }}
              aria-label="Country"
            >
              {countriesList.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>

            <input
              className="bg-zinc-900 text-zinc-200 text-xs border border-zinc-800 rounded-md px-2 py-2 focus:outline-none focus:border-red-500/60"
              type="text"
              value={selectedState || ""}
              onInput={(e) =>
                setSelectedState(
                  e.target.value ? e.target.value.trimStart() : null,
                )
              }
              aria-label="City"
              placeholder="Enter city..."
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-zinc-200 border border-zinc-800 px-3 py-1.5 rounded-md hover:border-red-500/40 hover:text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
