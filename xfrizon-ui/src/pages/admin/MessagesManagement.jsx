import React, { useState } from "react";
import { toast } from "react-toastify";

export default function MessagesManagement() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      subject: "Event Support Request",
      message: "I need help with my ticket...",
      type: "USER",
      date: "Feb 22, 2026",
      isRead: false,
    },
    {
      id: 2,
      name: "Events Inc.",
      email: "events@inc.com",
      subject: "New Event Approval",
      message: "We have submitted 3 new events...",
      type: "ORG",
      date: "Feb 21, 2026",
      isRead: false,
    },
    {
      id: 3,
      name: "John Doe",
      email: "john@example.com",
      subject: "Account Issue",
      message: "I'm unable to reset my passwords...",
      type: "USER",
      date: "Feb 20, 2026",
      isRead: true,
    },
    {
      id: 4,
      name: "Festival Organizers Africa",
      email: "festival@africa.com",
      subject: "Partnership Inquiry",
      message: "Are there partnership opportunities...",
      type: "ORG",
      date: "Feb 19, 2026",
      isRead: true,
    },
    {
      id: 5,
      name: "Lisa Chen",
      email: "lisa@example.com",
      subject: "Refund Request",
      message: "I would like to request a refund...",
      type: "USER",
      date: "Feb 18, 2026",
      isRead: true,
    },
  ]);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");

  const handleMarkAsRead = (id) => {
    setMessages(
      messages.map((msg) => (msg.id === id ? { ...msg, isRead: true } : msg)),
    );
    toast.success("Message marked as read");
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      setMessages(messages.filter((msg) => msg.id !== id));
      toast.success("Message deleted");
    }
  };

  const handleReply = () => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply message");
      return;
    }
    toast.success("Reply sent successfully");
    setReplyText("");
    setSelectedMessage(null);
  };

  const unreadCount = messages.filter((msg) => !msg.isRead).length;

  return (
    <div className="bg-black min-h-screen text-zinc-100 p-6">
      {/* Header */}
      <div className="border-b-2 border-t-2 border-zinc-700 bg-linear-to-r from-black via-zinc-900 to-black px-4 py-3 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          MESSAGES
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          UNREAD: {unreadCount} | TOTAL: {messages.length}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Messages List Column */}
        <div className="col-span-2 border-2 border-zinc-700 bg-zinc-950">
          <div className="border-b-2 border-zinc-700 bg-black px-4 py-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-bold uppercase text-zinc-100">
              <div className="col-span-1">ID</div>
              <div className="col-span-2">FROM</div>
              <div className="col-span-3">SUBJECT</div>
              <div className="col-span-2">TYPE</div>
              <div className="col-span-2">DATE</div>
              <div className="col-span-2">STATUS</div>
            </div>
          </div>

          <div className="divide-y divide-zinc-700">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  handleMarkAsRead(msg.id);
                }}
                className="border-b border-zinc-700 px-4 py-2 hover:bg-zinc-800 cursor-pointer transition-colors text-xs"
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 font-mono text-zinc-300">
                    #{msg.id}
                  </div>
                  <div className="col-span-2 text-zinc-300 truncate">
                    {msg.name}
                  </div>
                  <div className="col-span-3 text-zinc-300 truncate">
                    {msg.subject}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`px-2 py-0.5 font-mono uppercase text-xs ${msg.type === "USER" ? "bg-zinc-700 text-blue-300" : "bg-zinc-700 text-purple-300"}`}
                    >
                      {msg.type === "USER" ? "USR" : "ORG"}
                    </span>
                  </div>
                  <div className="col-span-2 font-mono text-zinc-400 text-xs">
                    {msg.date}
                  </div>
                  <div className="col-span-2 font-mono">
                    <span
                      className={
                        msg.isRead ? "text-zinc-500" : "text-red-500 font-bold"
                      }
                    >
                      {msg.isRead ? "✓ READ" : "◉ NEW"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-zinc-700 bg-black px-4 py-2 text-xs text-zinc-400 font-mono">
            Records: {messages.length} / Total: {messages.length}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="border-2 border-zinc-700 bg-zinc-950 flex flex-col">
          {selectedMessage ? (
            <>
              {/* Detail Header */}
              <div className="border-b-2 border-zinc-700 bg-black px-4 py-2">
                <h2 className="text-sm font-bold uppercase text-zinc-100">
                  {selectedMessage.subject}
                </h2>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 text-xs space-y-3">
                {/* Sender Info */}
                <div className="border border-zinc-700 bg-zinc-900 p-2">
                  <div className="text-zinc-400 mb-1">FROM:</div>
                  <div className="text-zinc-200 font-mono">
                    {selectedMessage.name}
                  </div>
                  <div className="text-zinc-300 font-mono text-xs">
                    {selectedMessage.email}
                  </div>
                </div>

                {/* Message Body */}
                <div className="border border-zinc-700 bg-zinc-900 p-2">
                  <div className="text-zinc-400 mb-1">MESSAGE:</div>
                  <div className="text-zinc-200 whitespace-pre-wrap wrap-break-word">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Metadata */}
                <div className="border border-zinc-700 bg-zinc-900 p-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-zinc-400">TYPE:</div>
                      <div className="text-zinc-300 font-mono">
                        {selectedMessage.type === "USER" ? "USER" : "ORGANIZER"}
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-400">DATE:</div>
                      <div className="text-zinc-300 font-mono">
                        {selectedMessage.date}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reply Input */}
                <div className="border border-zinc-700 bg-zinc-900 p-2">
                  <label className="text-zinc-400 block mb-1 uppercase text-xs font-bold">
                    REPLY:
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="3"
                    className="w-full bg-black border border-zinc-600 text-zinc-100 p-1 font-mono text-xs focus:outline-none focus:border-red-600"
                    placeholder="Type reply..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t-2 border-zinc-700 bg-black px-4 py-2 flex gap-1">
                <button
                  onClick={handleReply}
                  className="flex-1 border border-red-600 text-red-600 hover:bg-red-950 px-2 py-1 font-mono text-xs uppercase font-bold transition-colors"
                >
                  REPLY
                </button>
                <button
                  onClick={() => handleDelete(selectedMessage.id)}
                  className="border border-red-600 text-red-600 hover:bg-red-950 px-2 py-1 font-mono text-xs uppercase font-bold transition-colors"
                >
                  DEL
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="border border-zinc-600 text-zinc-400 hover:bg-zinc-800 px-2 py-1 font-mono text-xs uppercase font-bold transition-colors"
                >
                  CLOSE
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center px-4">
              <p className="text-zinc-500 text-xs uppercase">
                SELECT MESSAGE TO VIEW
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
