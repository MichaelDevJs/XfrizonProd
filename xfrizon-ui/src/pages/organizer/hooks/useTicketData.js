import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import api from "../../../api/axios";
import { toast } from "react-toastify";
import {
  formatLocalDate,
  formatLocalTime,
  parseLocalDateTime,
} from "../../../utils/dateTime";

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

// Mock data for demo
const MOCK_TICKETS = [
  {
    id: 1,
    ticketNumber: "TKT-001",
    buyerName: "John Doe",
    buyerEmail: "john@example.com",
    eventName: "Summer Music Festival",
    purchaseDate: "2026-02-20T18:30:00",
    price: 50,
    tier: "Premium",
    validated: false,
  },
  {
    id: 2,
    ticketNumber: "TKT-002",
    buyerName: "Jane Smith",
    buyerEmail: "jane@example.com",
    eventName: "Tech Conference 2026",
    purchaseDate: "2026-02-19T14:15:00",
    price: 75,
    tier: "VIP",
    validated: true,
  },
  {
    id: 3,
    ticketNumber: "TKT-003",
    buyerName: "Mike Johnson",
    buyerEmail: "mike@example.com",
    eventName: "Summer Music Festival",
    purchaseDate: "2026-02-18T20:45:00",
    price: 50,
    tier: "Standard",
    validated: false,
  },
];

export const useTicketData = () => {
  const { organizer } = useContext(AuthContext);
  const [recentTickets, setRecentTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [validationRate, setValidationRate] = useState(0);
  const [uniqueEvents, setUniqueEvents] = useState([]);
  const [stats, setStats] = useState([
    {
      label: "Total Events",
      value: "0",
      icon: null,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Tickets Sold",
      value: "0",
      icon: null,
      color: "from-indigo-500 to-indigo-500",
    },
    {
      label: "Revenue",
      value: "$0",
      icon: null,
      color: "from-green-500 to-emerald-500",
    },
  ]);

  // Fetch recently bought tickets
  const fetchRecentTickets = async () => {
    try {
      setLoadingTickets(true);
      console.log(
        "[useTicketData] Fetching tickets for organizer:",
        organizer?.id,
      );
      const response = await api.get(
        `/organizers/${organizer?.id}/recent-tickets`,
      );
      console.log("[useTicketData] API Response:", response);

      // Extract tickets from ApiResponse structure
      let ticketsData = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        ticketsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        ticketsData = response.data;
      }

      console.log("[useTicketData] Raw tickets count:", ticketsData.length);
      console.log("[useTicketData] Sample ticket:", ticketsData[0]);

      // Map the snake_case API response to camelCase for frontend
      const mappedTickets = ticketsData.map((ticket) => {
        // Log each ticket to debug field names
        console.log("[useTicketData] Ticket fields:", Object.keys(ticket));
        console.log("[useTicketData] Buyer name:", ticket.buyer_name);
        console.log("[useTicketData] Purchase price:", ticket.purchase_price);
        console.log("[useTicketData] Ticket number:", ticket.ticket_number);

        return {
          id: ticket.id,
          ticketNumber: ticket.ticket_number || `TKT-${ticket.id}`,
          buyerName: ticket.buyer_name || "Unknown",
          buyerEmail: ticket.buyer_email || "N/A",
          eventName: ticket.event_title,
          purchaseDate: ticket.purchase_date,
          quantity: ticket.quantity || 1,
          price: parseFloat(ticket.purchase_price) || 0,
          currency: ticket.currency || "NGN",
          tier: ticket.ticket_tier,
          validated: ticket.validated,
          eventDate: ticket.event_date,
          eventLocation: ticket.event_location,
          eventFlyerUrl: ticket.event_flyer_url,
          status: ticket.status,
          paymentIntentId: ticket.payment_intent_id,
        };
      });

      console.log(
        "[useTicketData] Mapped tickets count:",
        mappedTickets.length,
      );
      console.log("[useTicketData] Sample mapped ticket:", mappedTickets[0]);

      setRecentTickets(mappedTickets);
      setFilteredTickets(mappedTickets);

      if (mappedTickets.length > 0) {
        const totalRevenue = mappedTickets.reduce(
          (sum, ticket) => sum + (ticket.price || 0),
          0,
        );
        // Get currency from first ticket (all tickets from same organizer should have same currency)
        const currency = mappedTickets[0]?.currency || "NGN";
        const currencySymbol = getCurrencySymbol(currency);
        setStats((prev) => [
          prev[0],
          { ...prev[1], value: mappedTickets.length.toString() },
          { ...prev[2], value: `${currencySymbol}${totalRevenue.toFixed(2)}` },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch recent tickets:", error);
      // Apply same mapping to mock data
      const mappedMockTickets = MOCK_TICKETS.map((ticket) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        buyerName: ticket.buyerName,
        buyerEmail: ticket.buyerEmail,
        eventName: ticket.eventName,
        purchaseDate: ticket.purchaseDate,
        price: ticket.price,
        tier: ticket.tier,
        validated: ticket.validated,
      }));
      setRecentTickets(mappedMockTickets);
      setFilteredTickets(mappedMockTickets);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Calculate validation rate and unique events
  useEffect(() => {
    if (recentTickets.length > 0) {
      const validated = recentTickets.filter((t) => t.validated).length;
      setValidationRate(((validated / recentTickets.length) * 100).toFixed(1));

      const events = [...new Set(recentTickets.map((t) => t.eventName))];
      setUniqueEvents(events);
    }
  }, [recentTickets]);

  // Filter tickets based on search query, date, and event
  useEffect(() => {
    let filtered = [...recentTickets];

    if (dateFilter !== "all") {
      const today = new Date();
      const filterDate = new Date();
      if (dateFilter === "today") filterDate.setDate(today.getDate());
      else if (dateFilter === "week") filterDate.setDate(today.getDate() - 7);
      else if (dateFilter === "month")
        filterDate.setMonth(today.getMonth() - 1);
      filtered = filtered.filter((t) => {
        const purchaseDate = parseLocalDateTime(t.purchaseDate);
        return purchaseDate ? purchaseDate >= filterDate : false;
      });
    }

    if (eventFilter !== "all") {
      filtered = filtered.filter((t) => t.eventName === eventFilter);
    }

    if (searchQuery.toLowerCase().trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.buyerName?.toLowerCase().includes(query) ||
          ticket.buyerEmail?.toLowerCase().includes(query) ||
          ticket.eventName?.toLowerCase().includes(query) ||
          ticket.ticketNumber?.toLowerCase().includes(query),
      );
    }

    setFilteredTickets(filtered);
  }, [searchQuery, recentTickets, dateFilter, eventFilter]);

  const exportToCSV = () => {
    const csvContent = [
      [
        "Ticket #",
        "Buyer Name",
        "Email",
        "Event",
        "Date",
        "Time",
        "Tier",
        "Quantity",
        "Price",
        "Status",
      ],
      ...filteredTickets.map((t) => {
        const currencySymbol = getCurrencySymbol(t.currency);
        return [
          t.ticketNumber,
          t.buyerName,
          t.buyerEmail,
          t.eventName,
          formatLocalDate(t.purchaseDate),
          formatLocalTime(t.purchaseDate),
          t.tier || "Standard",
          t.quantity || 1,
          `${currencySymbol}${t.price.toFixed(2)}`,
          t.validated ? "Validated" : "Pending",
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Tickets exported successfully!");
  };

  const downloadUserData = (ticket) => {
    const currencySymbol = getCurrencySymbol(ticket.currency);
    const userData = {
      ticketNumber: ticket.ticketNumber,
      buyerName: ticket.buyerName,
      buyerEmail: ticket.buyerEmail,
      eventName: ticket.eventName,
      purchaseDate: formatLocalDate(ticket.purchaseDate),
      purchaseTime: formatLocalTime(ticket.purchaseDate),
      ticketTier: ticket.tier || "Standard",
      price: `${currencySymbol}${ticket.price.toFixed(2)}`,
      validationStatus: ticket.validated ? "Validated" : "Pending",
      downloadedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ticket.ticketNumber}-${ticket.buyerName.replace(/\s+/g, "_")}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Data for ${ticket.buyerName} downloaded!`);
  };

  const updateTicketValidation = (ticketNumber) => {
    setRecentTickets((prev) =>
      prev.map((ticket) =>
        ticket.ticketNumber === ticketNumber
          ? { ...ticket, validated: true }
          : ticket,
      ),
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setEventFilter("all");
  };

  return {
    recentTickets,
    filteredTickets,
    loadingTickets,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    eventFilter,
    setEventFilter,
    validationRate,
    uniqueEvents,
    stats,
    setStats,
    fetchRecentTickets,
    exportToCSV,
    downloadUserData,
    updateTicketValidation,
    clearFilters,
  };
};
