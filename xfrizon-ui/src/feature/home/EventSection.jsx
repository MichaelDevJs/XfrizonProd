import { useEffect, useState, useContext, useRef } from "react";
import EventRow from "../events/EventRow";
import OrganizerRow from "../../component/organizer/OrganizerRow";
import api from "../../api/axios";
import React from "react";
import mockData from "../../data/mockData";
import { FilterContext } from "../../context/FilterContext";

export default function EventSection() {
  const [homeData, setHomeData] = useState(mockData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isFetchingPublishedEventsRef = useRef(false);
  const { selectedGenre, selectedEventType, selectedCountry, selectedState } =
    useContext(FilterContext);

  const fetchPublishedEvents = async () => {
    try {
      const response = await api.get("/events/public/all", {
        timeout: 0,
      });
      const payload = response?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    } catch (error) {
      const isTimeout =
        error?.code === "ECONNABORTED" ||
        String(error?.message || "")
          .toLowerCase()
          .includes("timeout");

      if (!isTimeout) throw error;

      const retryResponse = await api.get("/events/public/all", {
        timeout: 0,
      });
      const retryPayload = retryResponse?.data;
      if (Array.isArray(retryPayload)) return retryPayload;
      if (Array.isArray(retryPayload?.data)) return retryPayload.data;
      return [];
    }
  };

  const loadEvents = async () => {
    if (isFetchingPublishedEventsRef.current) {
      return;
    }

    try {
      isFetchingPublishedEventsRef.current = true;
      // Don't show loading on refetch (only on initial load)
      const events = await fetchPublishedEvents();
      console.log(`Loaded ${events.length} events from API`);
      const groupedByCountry = {};

      events.forEach((event) => {
        const country = event.country || "Nigeria";
        if (!groupedByCountry[country]) {
          groupedByCountry[country] = [];
        }
        // Log first event of each type to verify attendees
        if (groupedByCountry[country].length === 0) {
          console.log(
            `First event in ${country}:`,
            event.id,
            "attendees:",
            event.attendees?.length,
          );
        }
        groupedByCountry[country].push(event); // Keep full event object
      });

      const categories = Object.entries(groupedByCountry).map(
        ([country, countryEvents], index) => ({
          id: index,
          name: country,
          events: countryEvents,
        }),
      );

      console.log(
        `Updated homeData with ${Object.keys(groupedByCountry).length} categories`,
      );
      setHomeData({ categories, artists: mockData.artists });
      setError(null);
    } catch (err) {
      console.error("Error fetching published events:", err);
      setHomeData(mockData);
      setError("Backend not responding, using sample data");
    } finally {
      isFetchingPublishedEventsRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      loadEvents();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEventSave = () => {
    // Refetch events when user saves/unsaves
    console.log("handleEventSave called - refetching all events");
    loadEvents();
  };

  const getRecentTimestamp = (event) => {
    const candidate =
      event?.createdAt ||
      event?.created_at ||
      event?.publishedAt ||
      event?.published_at ||
      event?.updatedAt ||
      event?.updated_at ||
      event?.eventDateTime;
    const parsed = new Date(candidate).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizeText = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const levenshteinDistance = (source, target) => {
    const a = normalizeText(source);
    const b = normalizeText(target);
    if (!a) return b.length;
    if (!b) return a.length;

    const matrix = Array.from({ length: b.length + 1 }, (_, row) => [row]);
    for (let column = 0; column <= a.length; column += 1) {
      matrix[0][column] = column;
    }

    for (let row = 1; row <= b.length; row += 1) {
      for (let column = 1; column <= a.length; column += 1) {
        const substitutionCost = b[row - 1] === a[column - 1] ? 0 : 1;
        matrix[row][column] = Math.min(
          matrix[row][column - 1] + 1,
          matrix[row - 1][column] + 1,
          matrix[row - 1][column - 1] + substitutionCost,
        );
      }
    }

    return matrix[b.length][a.length];
  };

  const isMatchingNonLocationFilters = (event) => {
    if (selectedEventType) {
      if (!event.eventType || event.eventType !== selectedEventType) {
        return false;
      }
    }

    if (selectedGenre) {
      if (!event.genres || !event.genres.includes(selectedGenre)) {
        return false;
      }
    }

    return true;
  };

  const isMatchingLocationFilters = (event) => {
    if (selectedCountry && selectedCountry.code && selectedCountry.code !== "ALL") {
      if (event.country !== selectedCountry.name) {
        return false;
      }
    }

    if (selectedState) {
      if (!event.city || !normalizeText(event.city).includes(normalizeText(selectedState))) {
        return false;
      }
    }

    return true;
  };

  const groupEventsByCountry = (events = []) => {
    const grouped = events.reduce((acc, event) => {
      const country = event.country || "Other";
      if (!acc[country]) {
        acc[country] = [];
      }
      acc[country].push(event);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([country, countryEvents], index) => ({
        id: `${country}-${index}`,
        name: country,
        events: countryEvents.sort(
          (a, b) => getRecentTimestamp(b) - getRecentTimestamp(a),
        ),
      }))
      .filter((category) => category.events.length > 0);
  };

  const getFilteredData = () => {
    if (!homeData || !homeData.categories) {
      console.log("No homeData or categories");
      return { ...homeData, categories: [] };
    }

    console.log("homeData.categories:", homeData.categories.length);
    console.log("selectedCountry:", selectedCountry);
    console.log("selectedGenre:", selectedGenre);
    console.log("selectedEventType:", selectedEventType);
    console.log("selectedState:", selectedState);

    return {
      ...homeData,
      categories: homeData.categories
        .map((category) => ({
          ...category,
          events: category.events
            .filter(
              (event) =>
                isMatchingNonLocationFilters(event) &&
                isMatchingLocationFilters(event),
            )
            .sort((a, b) => getRecentTimestamp(b) - getRecentTimestamp(a)),
        }))
        .filter((category) => category.events.length > 0),
    };
  };

  const getNearestLocationFallback = () => {
    if (!homeData?.categories?.length) return null;
    const hasLocationFilter =
      Boolean(selectedState) ||
      Boolean(selectedCountry?.code && selectedCountry.code !== "ALL");
    if (!hasLocationFilter) return null;

    const allEvents = homeData.categories.flatMap(
      (category) => category.events || [],
    );
    const baseEvents = allEvents.filter(isMatchingNonLocationFilters);
    if (!baseEvents.length) return null;

    const countryFilteredEvents =
      selectedCountry?.code && selectedCountry.code !== "ALL"
        ? baseEvents.filter((event) => event.country === selectedCountry.name)
        : baseEvents;

    const searchPool = countryFilteredEvents.length
      ? countryFilteredEvents
      : baseEvents;
    if (!searchPool.length) return null;

    const stateQuery = normalizeText(selectedState);
    let chosenEvents = searchPool;
    let locationLabel = "";

    if (stateQuery) {
      const cityBuckets = searchPool.reduce((acc, event) => {
        const cityName = String(event.city || "").trim();
        if (!cityName) return acc;
        if (!acc[cityName]) {
          acc[cityName] = [];
        }
        acc[cityName].push(event);
        return acc;
      }, {});

      const closestCity = Object.keys(cityBuckets)
        .map((cityName) => ({
          cityName,
          distance: levenshteinDistance(stateQuery, cityName),
        }))
        .sort((left, right) => left.distance - right.distance)[0];

      if (closestCity?.cityName) {
        chosenEvents = cityBuckets[closestCity.cityName];
        const cityCountry = chosenEvents[0]?.country;
        locationLabel = cityCountry
          ? `${closestCity.cityName}, ${cityCountry}`
          : closestCity.cityName;
      }
    } else if (!countryFilteredEvents.length) {
      const targetCountry = String(selectedCountry?.name || "");
      const countryBuckets = baseEvents.reduce((acc, event) => {
        const countryName = String(event.country || "").trim();
        if (!countryName) return acc;
        if (!acc[countryName]) {
          acc[countryName] = [];
        }
        acc[countryName].push(event);
        return acc;
      }, {});

      const closestCountry = Object.keys(countryBuckets)
        .map((countryName) => ({
          countryName,
          distance: levenshteinDistance(targetCountry, countryName),
        }))
        .sort((left, right) => left.distance - right.distance)[0];

      if (closestCountry?.countryName) {
        chosenEvents = countryBuckets[closestCountry.countryName];
        locationLabel = closestCountry.countryName;
      }
    }

    const categories = groupEventsByCountry(chosenEvents);
    if (!categories.length) return null;

    return {
      data: {
        ...homeData,
        categories,
      },
      label: locationLabel,
    };
  };

  const filteredData = getFilteredData();
  const nearestLocationFallback =
    filteredData?.categories?.length === 0 ? getNearestLocationFallback() : null;
  const displayData = nearestLocationFallback?.data || filteredData;
  const noEventTypes = displayData?.categories?.length === 0;

  if (loading)
    return (
      <div className="text-white text-center py-10 bg-black">Loading...</div>
    );

  return (
    <div className="w-full">
      {nearestLocationFallback && (
        <div className="text-amber-200 text-center py-3 mb-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
          <p className="text-sm">
            No events found in your selected location.
            {nearestLocationFallback.label
              ? ` Showing nearest location: ${nearestLocationFallback.label}.`
              : " Showing nearest available location."}
          </p>
        </div>
      )}

      {noEventTypes && (
        <div className="text-gray-400 text-center py-12 bg-black rounded-lg border border-[#28203a]">
          <p>No events match your filters</p>
          {(selectedEventType || selectedGenre) && (
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your selection
            </p>
          )}
        </div>
      )}

      {displayData?.categories?.map((category) => (
        <EventRow
          key={category.id}
          category={category}
          onEventSave={handleEventSave}
        />
      ))}

      {/* <OrganizerRow organizers={filteredData?.organizers || []} /> */}
    </div>
  );
}
