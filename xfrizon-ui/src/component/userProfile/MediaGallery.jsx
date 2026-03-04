import {
  FaComment,
  FaHeart,
  FaArrowLeft,
  FaMusic,
  FaBookmark,
} from "react-icons/fa";
import TicketPreviewModal from "./TicketPreviewModal";
import { useState } from "react";
import remaFlyer from "../../asset/Rema_F_img.jpeg";
import orgIcon from "../../asset/Afro_nation.jpeg";

export default function MediaGallery({ user, savedItems, setSavedItems }) {
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Use user's media if available, otherwise use mock data
  const mediaItems =
    user?.media && user.media.length > 0
      ? user.media.map((item, idx) => ({
          id: idx,
          caption: item.caption || "User uploaded media",
          image: item.url,
          likes: 0,
          comments: 0,
          commentsList: [],
          // Add default values for ticket-specific properties
          event: "My Media",
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          time: "N/A",
          organizer: user?.firstName
            ? `${user.firstName} ${user.lastName}`
            : "User",
          organizerAvatar: user?.profilePicture || orgIcon,
          tier: "Media",
          flyer: item.url,
        }))
      : [
          {
            id: 1,
            event: "Rema Rave Concert",
            date: "Feb 20, 2026",
            time: "10:00 PM",
            organizer: "DJ Mike",
            organizerAvatar: orgIcon,
            tier: "VIP Ticket",
            flyer: remaFlyer,
            image:
              "https://i.pinimg.com/736x/34/85/31/3485313b9a0f0758de8292ca2904e7b1.jpg",
            caption: "What a wonderful Night with my Girls 🎉✨",
            likes: 234,
            comments: 12,
            commentsList: [
              {
                id: 1,
                author: "Alex Chen",
                avatar: "https://i.pravatar.cc/150?img=1",
                text: "Looks amazing! 🔥 The energy was insane that night",
                timestamp: "1h ago",
              },
              {
                id: 2,
                author: "Maria Santos",
                avatar: "https://i.pravatar.cc/150?img=2",
                text: "I was there too! Best concert ever 🎵",
                timestamp: "2h ago",
              },
              {
                id: 3,
                author: "Dev Patel",
                avatar: "https://i.pravatar.cc/150?img=3",
                text: "Rema brought down the house! 🎤✨",
                timestamp: "3h ago",
              },
            ],
          },
          {
            id: 2,
            event: "Rema Rave Concert",
            date: "Feb 15, 2026",
            time: "9:00 PM",
            organizer: "DJ Kojo",
            organizerAvatar: orgIcon,
            tier: "Regular Ticket",
            flyer: remaFlyer,
            image:
              "https://i.pinimg.com/736x/34/85/31/3485313b9a0f0758de8292ca2904e7b1.jpg",
            caption: "Best vibes in the city! 🎵💃",
            likes: 567,
            comments: 34,
            commentsList: [
              {
                id: 1,
                author: "Jordan Kim",
                avatar: "https://i.pravatar.cc/150?img=4",
                text: "The production quality was next level 🎬",
                timestamp: "4h ago",
              },
              {
                id: 2,
                author: "Sophie Turner",
                avatar: "https://i.pravatar.cc/150?img=5",
                text: "Can't wait for the next show! Who's going? 🙋",
                timestamp: "5h ago",
              },
              {
                id: 3,
                author: "Marcus Johnson",
                avatar: "https://i.pravatar.cc/150?img=6",
                text: "This is what live music is all about 🎸🔥",
                timestamp: "6h ago",
              },
            ],
          },
        ];

  const openTicketPreview = (item) => {
    setSelectedTicket({
      id: item.id,
      event: item.event,
      date: item.date,
      time: item.time,
      organizer: item.organizer,
      tier: item.tier,
      flyer: item.flyer,
    });
  };

  return (
    <>
      <div className="max-w-xl mx-auto">
        <div className="space-y-4">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-800 hover:border-red-600 transition-colors"
            >
              {/* Ticket Header */}
              <div
                onClick={() => openTicketPreview(item)}
                className="flex gap-3 p-3 bg-[#111111] border-b border-gray-800 hover:border-red-600 cursor-pointer transition-colors group"
              >
                {/* Flyer */}
                <img
                  src={item.flyer}
                  alt="Event flyer"
                  className="w-16 h-20 rounded-lg object-cover border border-gray-800 group-hover:border-red-600 transition-colors"
                />

                {/* Event Details */}
                <div className="flex-1 flex flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 font-bold ${
                        item.tier && item.tier.includes("VIP")
                          ? "bg-black text-red-400 border border-gray-800"
                          : "bg-black text-gray-200 border border-gray-800"
                      }`}
                    >
                      {item.tier || "Media"}
                    </span>
                    <p className="text-sm font-black text-white truncate tracking-tight">
                      {item.event}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium">
                      {item.date} • {item.time}
                    </span>
                  </div>
                </div>

                {/* Organizer Avatar */}
                <div className="flex flex-col items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                  <img
                    src={item.organizerAvatar}
                    alt={item.organizer}
                    className="w-10 h-10 rounded-md object-cover border-2 border-red-600"
                    title={item.organizer}
                  />
                </div>
              </div>

              {/* Photo */}
              <div className="relative aspect-square bg-gray-800 overflow-hidden">
                <img
                  src={item.image}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Interactions */}
              <div className="px-3 py-3 border-b border-gray-800 flex gap-4 bg-[#111111]">
                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-colors">
                  <FaHeart className="text-sm font-bold" />
                  <span className="text-xs font-bold">{item.likes}</span>
                </button>
                <div className="w-px bg-gray-700/50"></div>
                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                  <FaComment className="text-sm font-bold" />
                  <span className="text-xs font-bold">{item.comments}</span>
                </button>
                <div className="w-px bg-gray-700/50"></div>
                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                  <FaArrowLeft className="text-sm font-bold rotate-180" />
                  <span className="text-xs font-bold">Share</span>
                </button>
                <div className="w-px bg-gray-700/50"></div>
                <button
                  onClick={() => {
                    if (!savedItems.find((s) => s.id === item.id)) {
                      setSavedItems([...savedItems, item]);
                    }
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 transform hover:scale-110 ${
                    savedItems.find((s) => s.id === item.id)
                      ? "bg-yellow-600/20 text-yellow-400 hover:text-yellow-300"
                      : "bg-[#1e1e1e] hover:bg-yellow-600/20 text-gray-400 hover:text-yellow-300"
                  }`}
                >
                  <FaBookmark className="text-sm font-bold" />
                  <span className="text-xs font-bold">Save</span>
                </button>
              </div>

              {/* Caption & Comments Section */}
              <div className="bg-[#1a1a1a] border-t border-gray-700/50">
                {/* Caption */}
                <div className="px-3 py-2.5 border-b border-gray-700/30">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    <span className="font-bold text-red-400">
                      @{user?.firstName?.toLowerCase()}
                    </span>{" "}
                    <span className="text-white">{item.caption}</span>
                  </p>
                </div>

                {/* Comments */}
                <div className="px-3 py-2">
                  <p className="text-xs font-bold text-gray-400 mb-2.5 uppercase tracking-wider">
                    Top Comments
                  </p>
                  <div className="space-y-2.5">
                    {item.commentsList?.map((comment) => (
                      <div key={comment.id} className="flex gap-2.5">
                        <img
                          src={comment.avatar}
                          alt={comment.author}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {comment.author}
                            </span>
                            <span className="text-xs text-gray-500">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 leading-snug mt-0.5">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {item.commentsList && item.commentsList.length > 0 && (
                    <button className="mt-2.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                      View all {item.comments} comments
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Preview Modal */}
      <TicketPreviewModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </>
  );
}
