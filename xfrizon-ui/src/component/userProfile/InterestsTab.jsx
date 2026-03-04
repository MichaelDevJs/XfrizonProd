import { FaMusic, FaCalendarAlt } from "react-icons/fa";

export default function InterestsTab({ user }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      {/* Music Interests */}
      <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FaMusic className="text-red-500" />
          Music Interests
        </h3>
        <div className="flex flex-wrap gap-2">
          {user.musicInterests && user.musicInterests.length > 0 ? (
            user.musicInterests.map((interest, idx) => (
              <span
                key={idx}
                className="bg-red-600/20 text-red-400 px-4 py-2 rounded-full text-sm font-semibold border border-red-600/30"
              >
                {interest}
              </span>
            ))
          ) : (
            <p className="text-gray-400">No music interests added yet</p>
          )}
        </div>
      </div>

      {/* Party Interests */}
      <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FaCalendarAlt className="text-red-500" />
          Event Interests
        </h3>
        <div className="flex flex-wrap gap-2">
          {user.partyInterests && user.partyInterests.length > 0 ? (
            user.partyInterests.map((interest, idx) => (
              <span
                key={idx}
                className="bg-[#111111] text-gray-200 px-4 py-2 rounded-full text-sm font-semibold border border-gray-800"
              >
                {interest}
              </span>
            ))
          ) : (
            <p className="text-gray-400">No party interests added yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
