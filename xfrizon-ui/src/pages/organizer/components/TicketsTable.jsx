const CURRENCY_SYMBOLS = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  KES: "KSh",
  ZAR: "R",
  GHS: "GH₵",
  CAD: "C$",
  INR: "₹",
  UGX: "UGX",
  JPY: "¥",
  AUD: "A$",
  CNY: "¥",
};

const getCurrencySymbol = (currencyCode) => {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode || "$";
};

const TicketsTable = ({ tickets, onDownload, isLoading }) => {
  const safeTickets = Array.isArray(tickets) ? tickets : [];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 font-light text-sm">Loading tickets...</p>
      </div>
    );
  }

  if (safeTickets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 font-light text-sm">No tickets found</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-zinc-700 rounded">
      <table className="w-full text-sm border-collapse min-w-max">
        <thead>
          <tr className="border-b border-zinc-700 bg-zinc-900/50 sticky top-0 z-10">
            <th className="text-left py-3 px-4 text-gray-400 font-light whitespace-nowrap min-w-fit">
              Ticket #
            </th>
            <th className="text-left py-3 px-4 text-gray-400 font-light whitespace-nowrap min-w-fit">
              Buyer Name
            </th>
            <th className="text-left py-3 px-4 text-gray-400 font-light whitespace-nowrap min-w-fit">
              Email
            </th>
            <th className="text-left py-3 px-4 text-gray-400 font-light whitespace-nowrap min-w-fit">
              Event
            </th>
            <th className="text-left py-3 px-4 text-gray-400 font-light whitespace-nowrap min-w-fit">
              Date
            </th>
            <th className="text-left py-3 px-4 text-gray-400 font-light whitespace-nowrap min-w-fit">
              Time
            </th>
            <th className="text-left py-3 px-4 text-gray-400 font-light whitespace-nowrap min-w-fit">
              Tier
            </th>
            <th className="text-left py-3 px-4 text-gray-400 font-light whitespace-nowrap min-w-fit">
              Quantity
            </th>
            <th className="text-left py-3 px-4 text-gray-400 font-light whitespace-nowrap min-w-fit">
              Price
            </th>
            <th className="text-left py-3 px-4 text-gray-400 font-light whitespace-nowrap min-w-fit">
              Status
            </th>
            <th className="text-left py-3 px-4 text-gray-400 font-light whitespace-nowrap min-w-fit">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {safeTickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors bg-[#1e1e1e]"
            >
              <td className="py-3 px-4 text-gray-300 font-mono text-xs whitespace-nowrap">
                {ticket.ticketNumber}
              </td>
              <td className="py-3 px-4 text-gray-300 font-light whitespace-nowrap">
                {ticket.buyerName}
              </td>
              <td className="py-3 px-4 text-gray-400 font-light text-xs whitespace-nowrap">
                {ticket.buyerEmail}
              </td>
              <td className="py-3 px-4 text-gray-300 font-light whitespace-nowrap">
                {ticket.eventName}
              </td>
              <td className="py-3 px-4 text-gray-400 font-light text-xs whitespace-nowrap">
                {new Date(ticket.purchaseDate).toLocaleDateString()}
              </td>
              <td className="py-3 px-4 text-gray-400 font-light text-xs whitespace-nowrap">
                {new Date(ticket.purchaseDate).toLocaleTimeString()}
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <span className="text-xs font-light text-cyan-400">
                  {ticket.tier || "Standard"}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-300 font-light whitespace-nowrap">
                <span className="inline-block bg-zinc-800 px-2 py-1 rounded text-xs font-semibold">
                  {ticket.quantity || 1}
                </span>
              </td>
              <td className="py-3 px-4 text-lime-400 font-light text-sm whitespace-nowrap">
                {getCurrencySymbol(ticket.currency)}{Number(ticket.price ?? 0).toFixed(2)}
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <span
                  className={`text-xs font-light ${
                    ticket.validated ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  {ticket.validated ? "✓ Validated" : "Pending"}
                </span>
              </td>
              <td className="py-3 px-4">
                <button
                  onClick={() => onDownload(ticket)}
                  className="px-2 py-1 border border-zinc-700 hover:border-zinc-600 text-gray-400 hover:text-gray-300 rounded text-xs font-light transition-colors"
                >
                  ⬇
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketsTable;
