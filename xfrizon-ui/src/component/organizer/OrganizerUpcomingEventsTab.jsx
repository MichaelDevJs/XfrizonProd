import React from "react";
import EventCard from "../../feature/events/EventCard";

// Group events by month extracted from event.date (e.g. "MAR 15, 2026" → "MAR 2026")
const groupByMonth = (events) => {
  const map = {};
  events.forEach((event) => {
    // Use eventDateTime if available, otherwise fallback to date
    const dateField = event.eventDateTime || event.date;
    if (!dateField) return;

    const date = new Date(dateField);
    const monthKey = date
      .toLocaleString("en-US", { month: "short", year: "numeric" })
      .toUpperCase();
    if (!map[monthKey]) map[monthKey] = [];
    map[monthKey].push(event);
  });
  return map;
};

const OrganizerUpcomingEventsTab = ({ events, onEventSave }) => {
  const handleSaveChange = () => {
    // Trigger refetch if parent provides callback
    if (onEventSave) {
      onEventSave();
    }
  };

  if (events.length === 0) {
    return (
      <div>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-8">
          Upcoming Events
        </h2>
        <div className="bg-[#111] border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-gray-600 text-sm">No upcoming events yet</p>
        </div>
      </div>
    );
  }

  const grouped = groupByMonth(events);

  return (
    <div className="space-y-10">
      {Object.entries(grouped).map(([month, monthEvents]) => (
        <div key={month}>
          {/* Month header */}
          <div className="flex items-center gap-4 mb-5">
            <span className="text-sm font-light text-red-500 uppercase tracking-widest">
              {month}
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600 font-light">
              {monthEvents.length} event{monthEvents.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Grid - using EventCard from homepage with fixed sizing */}
          <div className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar">
            {monthEvents.map((event) => (
              <div key={event.id} className="shrink-0 w-68 sm:w-72">
                <EventCard event={event} onSaveChange={handleSaveChange} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrganizerUpcomingEventsTab;
