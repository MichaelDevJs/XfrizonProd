import React from "react";
import nightVideo from "../../asset/Azzi On The Beat _ Boiler Room Lagos_ Street Beat.mp4";

const OrganizerOverviewTab = ({ organizer, events = [], onTabChange }) => {
  const previewEvents = events.slice(0, 5);

  return (
    <div className="flex gap-10 items-start flex-wrap lg:flex-nowrap">
      {/* Left — Upcoming Events */}
      <div className="flex-1 min-w-0">
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-6">
          Upcoming Events
        </h2>

        {previewEvents.length === 0 ? (
          <div className="bg-[#111] border border-zinc-800 rounded-xl p-10 text-center">
            <p className="text-gray-600 text-sm">No upcoming events yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {previewEvents.map((event, idx) => (
              <div
                key={event.id}
                className="flex items-center gap-4 bg-[#111] border border-zinc-800 hover:border-zinc-600 rounded-xl px-5 py-4 transition group"
              >
                {/* Index number */}
                <span className="text-xs text-zinc-600 font-mono w-4 shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {/* Thumbnail */}
                <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate group-hover:text-cyan-400 transition">
                    {event.title}
                  </p>
                  <p className="text-gray-500 text-xs truncate">
                    {event.artists}
                  </p>
                </div>

                {/* Date + Location */}
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{event.date}</p>
                  <p className="text-xs text-yellow-500">{event.location}</p>
                </div>

                {/* Attendees */}
                <div className="shrink-0 text-right hidden sm:block">
                  <p className="text-xs text-zinc-600 uppercase">Attendees</p>
                  <p className="text-xs text-cyan-400 font-semibold">
                    {event.attendees}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View More Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => onTabChange?.("upcoming")}
            className="px-8 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-400 text-gray-300 hover:text-white text-xs uppercase tracking-widest rounded-full transition"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            View All Events
          </button>
        </div>
      </div>

      {/* Right — Video Box */}
      <div className="w-full lg:w-72 shrink-0">
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-6">
          Night with us
        </h2>
        <div className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.7)]">
          <video
            src={nightVideo}
            className="w-full aspect-9/16 object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="px-4 py-3 border-t border-zinc-800">
            <p
              className="text-white text-sm font-semibold tracking-wide"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              Night with us
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">
              Azzi On The Beat · Boiler Room Lagos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerOverviewTab;
