import React, { useState } from "react";
import { FaEnvelope, FaSearch } from "react-icons/fa";

const OrganizerMessages = () => {
  const [messages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-light text-gray-200 mb-1">
          Messages
        </h1>
        <p className="text-xs text-gray-500 font-light">
          Communicate with customers about their tickets
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-2.5 text-gray-600 text-xs" />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-all font-light text-xs"
        />
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <FaEnvelope className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-light text-sm mb-1">
            No messages yet
          </p>
          <p className="text-xs text-gray-600 font-light">
            When customers reach out, you'll see them here
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto hide-scrollbar space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-red-500 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-light text-white text-sm">{msg.from}</p>
                  <p className="text-xs text-gray-500 font-light">
                    {msg.subject}
                  </p>
                </div>
                <span className="text-xs text-gray-500 font-light">
                  {msg.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizerMessages;
