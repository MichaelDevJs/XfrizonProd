import React from "react";

const OrganizerCard = ({ organizer = {} }) => {
  const {
    name = "Unknown Organizer",
    logo = "",
    genre = "",
    location = "",
    verified = false,
  } = organizer;

  return (
    <div className="min-w-65 bg-zinc-900 border border-zinc-800 text-white p-6 rounded-xl snap-start text-center hover:border-red-500 transition-all duration-300 group">
      {logo ? (
        <img
          src={logo}
          alt={name}
          className="w-32 h-32 rounded-full mx-auto object-cover"
        />
      ) : (
        <div className="w-32 h-32 rounded-full mx-auto bg-zinc-800 flex items-center justify-center text-2xl text-gray-500">
          ?
        </div>
      )}

      <h3 className="text-lg font-light mt-4 text-gray-300 group-hover:text-red-500 transition-colors duration-300">
        {name}
      </h3>
      <div className="text-xs text-gray-500 mt-1 font-light">
        {genre} | {location}
      </div>

      <div className="flex justify-between mt-6 text-xs gap-2">
        <button className="text-gray-400 hover:text-red-500 hover:bg-zinc-800 px-3 py-2 rounded-lg transition-all duration-300 font-light">
          View Events
        </button>
        <button className="text-red-500 font-light hover:text-red-400 hover:bg-zinc-800 px-3 py-2 rounded-lg transition-all duration-300">
          Follow
        </button>
      </div>
    </div>
  );
};

export default OrganizerCard;
