import { FaSearch } from "react-icons/fa";

const TicketFilters = ({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  eventFilter,
  onEventFilterChange,
  uniqueEvents,
  onExportCSV,
  onClearFilters,
  isFiltering,
  ticketsCount,
}) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <FaSearch className="absolute left-3 top-3 text-gray-600 text-sm" />
        <input
          type="text"
          placeholder="Search by name, email, event, or ticket number..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-light text-sm"
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={dateFilter}
          onChange={(e) => onDateFilterChange(e.target.value)}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last Month</option>
        </select>

        {uniqueEvents.length > 0 && (
          <select
            value={eventFilter}
            onChange={(e) => onEventFilterChange(e.target.value)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Events</option>
            {uniqueEvents.map((event) => (
              <option key={event} value={event}>
                {event}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={onExportCSV}
          disabled={ticketsCount === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-light text-sm transition-all duration-300"
        >
          📥 Export CSV
        </button>

        {isFiltering && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg font-light text-sm transition-all duration-300"
          >
            ✕ Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketFilters;
