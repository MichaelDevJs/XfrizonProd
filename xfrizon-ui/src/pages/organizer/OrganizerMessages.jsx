import React, { useState } from "react";
import { FaEnvelope, FaSearch } from "react-icons/fa";

const OrganizerMessages = () => {
  const [messages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-light text-gray-200 mb-2">Messages</h1>
        <p className="text-gray-500 font-light">
          Communicate with customers about their tickets
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-3.5 text-gray-600" />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-all font-light text-sm"
        />
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <FaEnvelope className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 font-light mb-2">No messages yet</p>
          <p className="text-xs text-gray-600 font-light">
            When customers reach out, you'll see them here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-red-500 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-light text-white">{msg.from}</p>
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
