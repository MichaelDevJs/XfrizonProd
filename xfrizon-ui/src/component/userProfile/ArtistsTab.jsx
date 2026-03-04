import { FaMusic, FaHeart } from "react-icons/fa";

export default function ArtistsTab({ user }) {
  return (
    <div className="max-w-4xl">
      <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FaHeart className="text-red-500" />
          Favorite Artists
        </h3>
        {user.favoriteArtists && user.favoriteArtists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {user.favoriteArtists.map((artist, idx) => (
              <div
                key={idx}
                className="bg-[#111111] border border-gray-800 rounded-lg p-4 text-center hover:border-red-600 transition cursor-pointer group"
              >
                <div className="w-full h-24 bg-linear-to-br from-[#1e1e1e] to-[#111111] border border-gray-800 rounded-lg mb-3 flex items-center justify-center group-hover:border-red-600 transition">
                  <FaMusic className="text-3xl text-white opacity-50" />
                </div>
                <p className="font-semibold text-sm">{artist}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No favorite artists added yet</p>
        )}
      </div>
    </div>
  );
}
