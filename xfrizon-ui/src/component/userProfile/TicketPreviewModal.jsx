export default function TicketPreviewModal({ ticket, onClose }) {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="relative bg-gray-900 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          ✕
        </button>

        {/* Ticket Preview */}
        <div className="bg-linear-to-br from-gray-800 to-gray-900 p-6 text-white">
          {/* Flyer */}
          <img
            src={ticket.flyer}
            alt="Event flyer"
            className="w-full h-64 rounded-lg object-cover mb-4"
          />

          {/* Event Info */}
          <h3 className="text-lg font-bold mb-3">{ticket.event}</h3>

          <div className="space-y-2 mb-4 text-sm text-gray-300">
            <p>📅 {ticket.date}</p>
            <p>🕐 {ticket.time}</p>
            <p>🎤 by {ticket.organizer}</p>
          </div>

          {/* Ticket Tier */}
          <div
            className={`py-2 px-3 rounded-lg mb-4 text-center font-semibold text-sm ${
              ticket.tier.includes("VIP")
                ? "bg-blue-600/30 text-blue-300"
                : "bg-green-600/30 text-green-300"
            }`}
          >
            {ticket.tier}
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-gray-800 p-4 rounded-lg mb-4 flex items-center justify-center">
            <div className="w-32 h-32 bg-gray-700 rounded flex items-center justify-center text-gray-500">
              QR Code
            </div>
          </div>

          {/* Ticket Number */}
          <p className="text-xs text-gray-400 text-center">
            Ticket #20260220{ticket.id.toString().padStart(4, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
