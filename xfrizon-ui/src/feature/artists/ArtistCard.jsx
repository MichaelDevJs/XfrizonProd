import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { getImageUrl } from "../../utils/images";
import React from "react";

const ArtistCard = ({ artist = {} }) => {
  const {
    name = "Unknown Artist",
    verified = false,
    followers = 0,
    image = "",
  } = artist;
  // Use direct URL if image is a full URL, otherwise use getImageUrl for local images
  const src =
    typeof image === "string" &&
    (image.startsWith("http://") || image.startsWith("https://"))
      ? image
      : getImageUrl(image, "artists");

  return (
    <div className="min-w-[260px] bg-zinc-900 border border-zinc-800 text-white p-6 rounded-xl snap-start text-center hover:border-red-500 transition-all duration-300 group">
      <img
        src={src}
        alt={name}
        onError={(e) => (e.currentTarget.src = "/assets/placeholder.jpg")}
        className="w-32 h-32 rounded-full mx-auto object-cover"
      />

      <div className="flex justify-center items-center gap-2 mt-4">
        <h3 className="text-lg font-light text-gray-300 group-hover:text-red-500 transition-colors duration-300">
          {name}
        </h3>
        {verified && <CheckBadgeIcon className="w-5 h-5 text-red-500" />}
      </div>

      <p className="text-gray-500 text-xs mt-2 font-light">Followers</p>
      <p className="text-gray-400 font-light">{followers}</p>

      <div className="flex justify-between mt-6 text-xs gap-2">
        <button className="text-gray-400 hover:text-red-500 hover:bg-zinc-800 px-3 py-2 rounded-lg transition-all duration-300 font-light">
          View Profile
        </button>
        <button className="text-red-500 font-light hover:text-red-400 hover:bg-zinc-800 px-3 py-2 rounded-lg transition-all duration-300">
          Follow
        </button>
      </div>
    </div>
  );
};

export default ArtistCard;
