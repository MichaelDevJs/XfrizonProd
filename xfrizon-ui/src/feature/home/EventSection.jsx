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
          events: category.events.filter((event) => {
            // Note: Past events are shown but greyed out in EventCard component
            // Filter by event type if selected
            if (selectedEventType) {
              if (!event.eventType || event.eventType !== selectedEventType) {
                return false;
              }
            }
            // Filter by genre if selected
            if (selectedGenre) {
              if (!event.genres || !event.genres.includes(selectedGenre)) {
                return false;
              }
            }
            // Always filter by country: default is Germany
            if (
              selectedCountry &&
              selectedCountry.code &&
              selectedCountry.code !== "ALL"
            ) {
              if (event.country !== selectedCountry.name) {
                console.log(
                  `Filtering out event ${event.id} - event.country: ${event.country}, selectedCountry.name: ${selectedCountry.name}`,
                );
                return false;
              }
            }
            // Filter by state if selected
            if (selectedState) {
              if (
                !event.city ||
                !event.city.toLowerCase().includes(selectedState.toLowerCase())
              ) {
                return false;
              }
            }
            return true;
          }),
        }))
        // Remove categories with no events
        .filter((category) => category.events.length > 0),
    };
  };

  const filteredData = getFilteredData();

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

  const recentlyUploadedEvents = (filteredData?.categories || [])
    .flatMap((category) => category.events || [])
    .sort((a, b) => getRecentTimestamp(b) - getRecentTimestamp(a));

  const displayCategories = recentlyUploadedEvents.length
    ? [
        {
          id: "recently-uploaded",
          name: "Recently Uploaded",
          events: recentlyUploadedEvents,
        },
        ...filteredData.categories,
      ]
    : filteredData.categories;

  if (loading)
    return (
      <div className="text-white text-center py-10 bg-black">Loading...</div>
    );

  const noEventTypes = filteredData?.categories?.length === 0;

  return (
    <div className="w-full">
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

      {displayCategories?.map((category) => (
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
