import { useEffect, useState } from "react";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { parseLocalDateTime } from "../../utils/dateTime";

// Components
import TicketsTable from "./components/TicketsTable";

// Hooks
import { useTicketData } from "./hooks/useTicketData";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [selectedRsvpEventId, setSelectedRsvpEventId] = useState("all");
  const [rsvpRows, setRsvpRows] = useState([]);
  const [rsvpSearch, setRsvpSearch] = useState("");
  const [loadingRsvps, setLoadingRsvps] = useState(false);
  const [expandedRsvpRow, setExpandedRsvpRow] = useState(null);

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
      const ticketDate = parseLocalDateTime(ticket.purchaseDate);
      if (!ticketDate) {
        return false;
      }

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

  const fetchOrganizerEvents = async () => {
    try {
      const response = await api.get("/events", {
        params: { page: 0, size: 100, sort: "createdAt,desc" },
      });
      const events =
        response?.data?.content && Array.isArray(response.data.content)
          ? response.data.content
          : Array.isArray(response?.data)
            ? response.data
            : [];
      setOrganizerEvents(events);
      return events;
    } catch (error) {
      console.error("Failed to fetch organizer events for RSVP table", error);
      return [];
    }
  };

  const fetchRsvps = async (eventId = selectedRsvpEventId, eventsOverride = null) => {
    try {
      setLoadingRsvps(true);

      const events = Array.isArray(eventsOverride)
        ? eventsOverride
        : organizerEvents;

      const eventLookup = new Map(
        events.map((event) => [String(event.id), event.title || `Event ${event.id}`]),
      );

      if (eventId === "all") {
        const eligibleEvents = events.filter((event) => Boolean(event?.rsvpEnabled));
        if (eligibleEvents.length === 0) {
          setRsvpRows([]);
          return;
        }

        const responses = await Promise.all(
          eligibleEvents.map(async (event) => {
            try {
              const res = await api.get(`/events/${event.id}/rsvp`);
              const rows = Array.isArray(res.data) ? res.data : [];
              return rows.map((row) => ({
                ...row,
                eventTitle: event.title || `Event ${event.id}`,
              }));
            } catch {
              return [];
            }
          }),
        );

        const merged = responses.flat();
        merged.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
        setRsvpRows(merged);
        return;
      }

      const response = await api.get(`/events/${eventId}/rsvp`);
      const rows = Array.isArray(response.data) ? response.data : [];
      const normalized = rows.map((row) => ({
        ...row,
        eventTitle: eventLookup.get(String(eventId)) || `Event ${eventId}`,
      }));

      normalized.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
      setRsvpRows(normalized);
    } catch (error) {
      console.error("Failed to fetch RSVP rows", error);
      toast.error("Failed to load RSVP list");
      setRsvpRows([]);
    } finally {
      setLoadingRsvps(false);
    }
  };

  const filteredRsvps = rsvpRows.filter((row) => {
    const query = rsvpSearch.trim().toLowerCase();
    if (!query) return true;

    return (
      `${row.firstName || ""} ${row.lastName || ""}`.toLowerCase().includes(query) ||
      String(row.email || "").toLowerCase().includes(query) ||
      String(row.phone || "").toLowerCase().includes(query) ||
      String(row.eventTitle || "").toLowerCase().includes(query)
    );
  });

  const exportRsvpsToCsv = () => {
    if (filteredRsvps.length === 0) {
      toast.info("No RSVP records to export");
      return;
    }

    const csvRows = [
      [
        "Event",
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Note",
        "Status",
        "Created At",
      ],
      ...filteredRsvps.map((row) => [
        row.eventTitle || "",
        row.firstName || "",
        row.lastName || "",
        row.email || "",
        row.phone || "",
        row.note || "",
        row.status || "",
        row.createdAt ? new Date(row.createdAt).toLocaleString() : "",
      ]),
    ];

    const csv = csvRows
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `organizer-rsvps-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getNotePreview = (note) => {
    const value = String(note || "").trim();
    if (!value) return "-";
    return value.length > 40 ? `${value.slice(0, 40)}...` : value;
  };

  // Fetch tickets on mount
  useEffect(() => {
    fetchRecentTickets();
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const events = await fetchOrganizerEvents();
      await fetchRsvps("all", events);
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (organizerEvents.length === 0) return;
    fetchRsvps(selectedRsvpEventId);
  }, [selectedRsvpEventId]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3 sm:mb-8 sm:items-center sm:gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-zinc-800 rounded transition-colors"
          title="Back"
        >
          <FaArrowLeft className="w-4 h-4 text-gray-400 hover:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-gray-200">
            Recently Bought Tickets
          </h1>
          <p className="text-gray-500 font-light text-xs sm:text-sm mt-1">
            Recent ticket purchases
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 overflow-x-auto hide-scrollbar">
        <div className="flex min-w-max gap-3">
          <div className="w-48 shrink-0 rounded border border-zinc-700 p-3 bg-zinc-800">
            <p className="text-xs text-gray-400 mb-1.5">Total Tickets</p>
            <p className="text-xl font-light text-cyan-400">{totalTickets}</p>
          </div>
          <div className="w-48 shrink-0 rounded border border-zinc-700 p-3 bg-zinc-800">
            <p className="text-xs text-gray-400 mb-1.5">Total Revenue</p>
            <p className="text-xl font-light text-lime-400 wrap-break-word">
              {currencySymbol}
              {totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="w-48 shrink-0 rounded border border-zinc-700 p-3 bg-zinc-800">
            <p className="text-xs text-gray-400 mb-1.5">Show Rate</p>
            <p className="text-xl font-light text-green-400">{showRate}%</p>
          </div>
        </div>
      </div>

      {/* Recently bought tickets section */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900">
        <div className="p-3 border-b border-zinc-800">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-medium text-gray-200">
              Ticket History
            </h2>
            <button
              onClick={fetchRecentTickets}
              className="w-full sm:w-auto text-xs font-light text-gray-400 border border-zinc-700 rounded px-3 py-1.5 hover:border-zinc-600 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <div className="grid sm:grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500 font-light block mb-1">
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-gray-300 focus:outline-none focus:border-xf-accent font-light"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-light block mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-gray-300 focus:outline-none focus:border-xf-accent font-light"
                >
                  <option value="all">All</option>
                  <option value="validated">Validated</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-light block mb-1">
                  Search
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-2 top-2 text-gray-500 text-xs" />
                  <input
                    type="text"
                    placeholder="Name, email, ticket #..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-xf-accent font-light"
                  />
                </div>
              </div>
            </div>

            {(localSearch ||
              dateFilter !== "all" ||
              statusFilter !== "all") && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500 font-light">
                  Showing {filteredTickets.length} of {totalTickets}
                </p>
                <button
                  onClick={() => {
                    setLocalSearch("");
                    setDateFilter("all");
                    setStatusFilter("all");
                  }}
                  className="w-full sm:w-auto text-xs font-light text-gray-400 border border-zinc-700 rounded px-3 py-1 hover:border-zinc-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tickets table with scrollable container */}
        <div className="max-h-96 overflow-y-auto hide-scrollbar">
          <TicketsTable
            tickets={filteredTickets}
            onDownload={downloadUserData}
            isLoading={loadingTickets}
          />
        </div>
      </div>

      {/* RSVP Management */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900">
        <div className="p-3 border-b border-zinc-800 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-medium text-gray-200">RSVP Management</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchRsvps(selectedRsvpEventId)}
                className="text-xs font-light text-gray-400 border border-zinc-700 rounded px-3 py-1.5 hover:border-zinc-600 transition-colors"
              >
                ↻ Refresh
              </button>
              <button
                onClick={exportRsvpsToCsv}
                className="text-xs font-light text-gray-200 border border-zinc-600 rounded px-3 py-1.5 hover:border-zinc-500 transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 font-light block mb-1">
                Event
              </label>
              <select
                value={selectedRsvpEventId}
                onChange={(e) => setSelectedRsvpEventId(e.target.value)}
                className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-gray-300 focus:outline-none focus:border-xf-accent font-light"
              >
                <option value="all">All RSVP-enabled events</option>
                {organizerEvents
                  .filter((event) => Boolean(event?.rsvpEnabled))
                  .map((event) => (
                    <option key={event.id} value={String(event.id)}>
                      {event.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 font-light block mb-1">
                Search RSVP
              </label>
              <div className="relative">
                <FaSearch className="absolute left-2 top-2 text-gray-500 text-xs" />
                <input
                  type="text"
                  placeholder="Name, email, phone, event..."
                  value={rsvpSearch}
                  onChange={(e) => setRsvpSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-xf-accent font-light"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 font-light">
            Showing {filteredRsvps.length} RSVP records
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto hide-scrollbar">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-zinc-950 border-b border-zinc-800">
              <tr className="text-gray-400">
                <th className="px-3 py-2 font-light">Event</th>
                <th className="px-3 py-2 font-light">Name</th>
                <th className="px-3 py-2 font-light">Email</th>
                <th className="px-3 py-2 font-light">Phone</th>
                <th className="px-3 py-2 font-light">Note</th>
                <th className="px-3 py-2 font-light">Status</th>
                <th className="px-3 py-2 font-light">Submitted</th>
                <th className="px-3 py-2 font-light">Details</th>
              </tr>
            </thead>
            <tbody>
              {loadingRsvps ? (
                <tr>
                  <td className="px-3 py-5 text-gray-500" colSpan={8}>
                    Loading RSVP records...
                  </td>
                </tr>
              ) : filteredRsvps.length === 0 ? (
                <tr>
                  <td className="px-3 py-5 text-gray-500" colSpan={8}>
                    No RSVP records found.
                  </td>
                </tr>
              ) : (
                filteredRsvps.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-800/70 text-gray-300">
                    <td className="px-3 py-2">{row.eventTitle || "-"}</td>
                    <td className="px-3 py-2">
                      {[row.firstName, row.lastName].filter(Boolean).join(" ") || "-"}
                    </td>
                    <td className="px-3 py-2">{row.email || "-"}</td>
                    <td className="px-3 py-2">{row.phone || "-"}</td>
                    <td className="px-3 py-2 text-gray-400">
                      {getNotePreview(row.note)}
                    </td>
                    <td className="px-3 py-2">{row.status || "CONFIRMED"}</td>
                    <td className="px-3 py-2">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setExpandedRsvpRow(row)}
                        className="text-[11px] font-light text-gray-200 border border-zinc-600 rounded px-2 py-1 hover:border-zinc-500 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {expandedRsvpRow && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-lg border border-zinc-700 bg-zinc-900">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-medium text-gray-200">RSVP Details</h3>
              <button
                type="button"
                onClick={() => setExpandedRsvpRow(null)}
                className="text-gray-400 hover:text-gray-200 text-sm"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Event</p>
                  <p className="text-gray-200">{expandedRsvpRow.eventTitle || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-gray-200">{expandedRsvpRow.status || "CONFIRMED"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-gray-200">
                    {[expandedRsvpRow.firstName, expandedRsvpRow.lastName]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-gray-200">{expandedRsvpRow.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-gray-200">{expandedRsvpRow.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="text-gray-200">
                    {expandedRsvpRow.createdAt
                      ? new Date(expandedRsvpRow.createdAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Full Note</p>
                <div className="bg-zinc-800 border border-zinc-700 rounded p-3 text-gray-300 whitespace-pre-wrap min-h-24">
                  {String(expandedRsvpRow.note || "").trim() || "No note provided."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
