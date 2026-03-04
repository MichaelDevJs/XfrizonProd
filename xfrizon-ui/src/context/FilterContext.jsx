import { createContext, useState } from "react";
import React from "react";

export const FilterContext = createContext();

const FilterProvider = ({ children }) => {
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("");
  const [selectedCountry, setSelectedCountry] = useState({
    name: "All",
    code: "ALL",
    flag: "🌍",
  });
  const [selectedState, setSelectedState] = useState(null);

  const clearFilters = () => {
    setSelectedGenre("");
    setSelectedEventType("");
    setSelectedCountry({ name: "All", code: "ALL", flag: "🌍" });
    setSelectedState(null);
  };

  return (
    <FilterContext.Provider
      value={{
        selectedGenre,
        setSelectedGenre,
        selectedEventType,
        setSelectedEventType,
        selectedCountry,
        setSelectedCountry,
        selectedState,
        setSelectedState,
        clearFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export default FilterProvider;
