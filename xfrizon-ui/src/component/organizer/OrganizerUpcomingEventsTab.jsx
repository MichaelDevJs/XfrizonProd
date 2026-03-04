import React from "react";
import {
  FaMapMarkerAlt,
  FaUsers,
  FaTicketAlt,
  FaCalendarAlt,
} from "react-icons/fa";

const tagColors = {
  "SOLD OUT": "bg-red-500/10 text-red-400 border-red-500/30",
  "FEW LEFT": "bg-orange-500/10 text-orange-400 border-orange-500/30",
  "ON SALE": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  FREE: "bg-red-500/10 text-red-400 border-red-500/30",
};

// Group events by month extracted from event.date (e.g. "MAR 15, 2026" → "MAR 2026")
const groupByMonth = (events) => {
  const map = {};
  events.forEach((event) => {
    const parts = event.date.split(" ");
    const key = parts.length >= 3 ? `${parts[0]} ${parts[2]}` : parts[0];
    if (!map[key]) map[key] = [];
    map[key].push(event);
  });
  return map;
};

const EventCard = ({ event }) => (
  <div className="bg-zinc-900 border border-zinc-800 hover:border-red-500 hover:shadow-lg transition-all duration-300 flex flex-col justify-between rounded-xl group h-full cursor-pointer">
    {/* Image */}
    <div className="relative overflow-hidden rounded-t-xl h-48">
      <img
        src={event.image}
        alt={event.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
      {/* Save-style tag badge */}
      {event.tag && (
        <div className="absolute top-3 right-3">
          <span
            className={`text-[10px] font-light px-2 py-0.5 rounded border tracking-widest ${
              tagColors[event.tag] ||
              "bg-zinc-800/80 text-zinc-400 border-zinc-700"
            }`}
          >
            {event.tag}
          </span>
        </div>
      )}
    </div>

    {/* Content */}
    <div className="p-4 flex flex-col gap-2 flex-1">
      {/* Title */}
      <h3 className="text-base font-light text-gray-300 group-hover:text-red-500 transition-colors duration-300 truncate">
        {event.title}
      </h3>

      {/* Artists as genre-style badges */}
      {event.artists && (
        <div className="flex flex-wrap gap-1">
          {event.artists
            .split(",")
            .slice(0, 2)
            .map((artist, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/30 font-light"
              >
                {artist.trim()}
              </span>
            ))}
        </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-2 text-xs text-gray-400 font-light">
        <FaCalendarAlt className="shrink-0" />
        <span>{event.date}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-xs text-gray-500 font-light">
        <FaMapMarkerAlt />
        <span>{event.location}</span>
      </div>

      {/* Attendees */}
      <div className="flex items-center gap-2 text-xs text-gray-500 font-light pt-1 mt-auto">
        <FaUsers className="shrink-0" />
        <span>{event.attendees} interested</span>
      </div>
    </div>

    {/* Footer — price + CTA */}
    <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <FaTicketAlt className="text-gray-500 w-3 h-3" />
        <span className="text-white text-sm font-light">{event.price}</span>
      </div>
      <button className="text-xs font-light text-red-500 hover:text-red-400 transition">
        Get Ticket →
      </button>
    </div>
  </div>
);

const OrganizerUpcomingEventsTab = ({ events }) => {
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

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {monthEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrganizerUpcomingEventsTab;
