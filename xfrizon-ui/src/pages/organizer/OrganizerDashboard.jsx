import { useEffect, useState } from "react";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Components
import TicketsTable from "./components/TicketsTable";

// Hooks
import { useTicketData } from "./hooks/useTicketData";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Ticket data hook
  const {
    recentTickets,
    loadingTickets,
    fetchRecentTickets,
    downloadUserData,
  } = useTicketData();

  // Filter tickets based on date range
  const getDateFilteredTickets = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return recentTickets.filter((ticket) => {
      const ticketDate = new Date(ticket.purchaseDate);
      const ticketDay = new Date(
        ticketDate.getFullYear(),
        ticketDate.getMonth(),
        ticketDate.getDate(),
      );

      switch (dateFilter) {
        case "today":
          return ticketDay.getTime() === today.getTime();
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return ticketDate >= weekAgo;
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return ticketDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  // Filter by status
  const dateFilteredTickets = getDateFilteredTickets();
  const statusFilteredTickets = dateFilteredTickets.filter((ticket) => {
    if (statusFilter === "validated") return ticket.validated;
    if (statusFilter === "pending") return !ticket.validated;
    return true;
  });

  // Filter by search
  const filteredTickets = statusFilteredTickets.filter((ticket) => {
    const searchLower = localSearch.toLowerCase();
    return (
      (ticket.buyerName || "").toLowerCase().includes(searchLower) ||
      (ticket.buyerEmail || "").toLowerCase().includes(searchLower) ||
      (ticket.ticketNumber || "").toLowerCase().includes(searchLower)
    );
  });

  // Currency symbols mapping
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

  // Calculate stats
  const totalTickets = recentTickets.length;
  const totalRevenue = recentTickets.reduce(
    (sum, ticket) => sum + ticket.price,
    0,
  );
  // Get currency from first ticket (all from same organizer)
  const currency = recentTickets[0]?.currency || "NGN";
  const currencySymbol = getCurrencySymbol(currency);
  const validatedCount = recentTickets.filter((t) => t.validated).length;
  const showRate =
    totalTickets > 0 ? Math.round((validatedCount / totalTickets) * 100) : 0;

  // Fetch tickets on mount
  useEffect(() => {
    fetchRecentTickets();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-zinc-800 rounded transition-colors"
          title="Back"
        >
          <FaArrowLeft className="w-4 h-4 text-gray-400 hover:text-gray-300" />
        </button>
        <div>
          <h1 className="text-3xl font-light text-gray-200">
            Recently Bought Tickets
          </h1>
          <p className="text-gray-500 font-light text-sm mt-1">
            Recent ticket purchases
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="border border-zinc-700 rounded p-4 bg-[#1e1e1e]">
          <p className="text-xs text-gray-500 font-light mb-2">Total Tickets</p>
          <p className="text-2xl font-light text-cyan-400">{totalTickets}</p>
        </div>
        <div className="border border-zinc-700 rounded p-4 bg-[#1e1e1e]">
          <p className="text-xs text-gray-500 font-light mb-2">Total Revenue</p>
          <p className="text-2xl font-light text-lime-400">
            {currencySymbol}
            {totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="border border-zinc-700 rounded p-4 bg-[#1e1e1e]">
          <p className="text-xs text-gray-500 font-light mb-2">Show Rate</p>
          <p className="text-2xl font-light text-green-400">{showRate}%</p>
        </div>
      </div>

      {/* Recently bought tickets section */}
      <div className="border border-zinc-700 rounded overflow-hidden">
        <div className="p-4 border-b border-zinc-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-light text-gray-400">Ticket History</h2>
            <button
              onClick={fetchRecentTickets}
              className="text-xs font-light text-gray-400 border border-zinc-700 rounded px-3 py-1 hover:border-zinc-600 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Quick Filters */}
          <div className="space-y-3 mb-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-light block mb-2">
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-gray-300 focus:outline-none focus:border-zinc-600 font-light"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-light block mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-gray-300 focus:outline-none focus:border-zinc-600 font-light"
                >
                  <option value="all">All</option>
                  <option value="validated">Validated</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-light block mb-2">
                Search Customer
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-2.5 text-gray-500 text-xs" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ticket #..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-zinc-600 font-light"
                />
              </div>
            </div>

            {(localSearch ||
              dateFilter !== "all" ||
              statusFilter !== "all") && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-light">
                  Showing {filteredTickets.length} of {totalTickets}
                </p>
                <button
                  onClick={() => {
                    setLocalSearch("");
                    setDateFilter("all");
                    setStatusFilter("all");
                  }}
                  className="text-xs font-light text-gray-400 border border-zinc-700 rounded px-3 py-1 hover:border-zinc-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tickets table */}
        <TicketsTable
          tickets={filteredTickets}
          onDownload={downloadUserData}
          isLoading={loadingTickets}
        />
      </div>
    </div>
  );
};

export default OrganizerDashboard;
