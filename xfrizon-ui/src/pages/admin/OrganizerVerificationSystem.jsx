import { useState, useMemo } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaBan,
  FaDownload,
  FaSearch,
  FaFilter,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-toastify";

const OrganizerVerificationSystem = () => {
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("revenue");
  const [showAllCountries, setShowAllCountries] = useState(false);

  // Mock organizer data
  const [organizers, setOrganizers] = useState([
    {
      id: "ORG-001",
      name: "Lagos Events Pro",
      email: "contact@lagosevents.com",
      phone: "+234 803 456 7890",
      country: "Nigeria",
      city: "Lagos",
      address: "123 Victoria Island, Lagos",
      monthlyRevenue: 45000,
      ticketsSold: 2450,
      idStatus: "verified",
      contactPersonName: "Chioma Okafor",
      contactPhoto:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      joinDate: "2024-01-15",
      rating: 4.8,
      totalEvents: 24,
      suspensionFlag: false,
    },
    {
      id: "ORG-002",
      name: "Nairobi Music Collective",
      email: "info@nairobimusic.ke",
      phone: "+254 712 345 678",
      country: "Kenya",
      city: "Nairobi",
      address: "456 Westlands, Nairobi",
      monthlyRevenue: 38500,
      ticketsSold: 1890,
      idStatus: "pending",
      contactPersonName: "James Kipchoge",
      contactPhoto:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      joinDate: "2024-02-20",
      rating: 4.5,
      totalEvents: 18,
      suspensionFlag: false,
    },
    {
      id: "ORG-003",
      name: "Accra Entertainment Hub",
      email: "events@accraarent.com",
      phone: "+233 501 234 567",
      country: "Ghana",
      city: "Accra",
      address: "789 Ring Road, Accra",
      monthlyRevenue: 52000,
      ticketsSold: 3100,
      idStatus: "verified",
      contactPersonName: "Ama Boateng",
      contactPhoto:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      joinDate: "2023-11-10",
      rating: 4.9,
      totalEvents: 35,
      suspensionFlag: false,
    },
    {
      id: "ORG-004",
      name: "Johannesburg Live",
      email: "support@jhblive.co.za",
      phone: "+27 11 234 5678",
      country: "South Africa",
      city: "Johannesburg",
      address: "321 Sandton, Johannesburg",
      monthlyRevenue: 61000,
      ticketsSold: 3750,
      idStatus: "rejected",
      contactPersonName: "Thabo Mthembu",
      contactPhoto:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      joinDate: "2024-01-20",
      rating: 3.2,
      totalEvents: 12,
      suspensionFlag: true,
    },
    {
      id: "ORG-005",
      name: "Kampala Events Team",
      email: "hello@kampalaevent.ug",
      phone: "+256 701 234 567",
      country: "Uganda",
      city: "Kampala",
      address: "555 Heroes Lane, Kampala",
      monthlyRevenue: 28500,
      ticketsSold: 1420,
      idStatus: "pending",
      contactPersonName: "Patience Nakama",
      contactPhoto:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      joinDate: "2024-03-05",
      rating: 4.3,
      totalEvents: 8,
      suspensionFlag: false,
    },
    {
      id: "ORG-006",
      name: "Cairo Concert Series",
      email: "info@cairoconcert.eg",
      phone: "+20 100 234 5678",
      country: "Egypt",
      city: "Cairo",
      address: "987 Nile Street, Cairo",
      monthlyRevenue: 42000,
      ticketsSold: 2100,
      idStatus: "verified",
      contactPersonName: "Fatima Hassan",
      contactPhoto:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      joinDate: "2023-12-01",
      rating: 4.7,
      totalEvents: 20,
      suspensionFlag: false,
    },
    {
      id: "ORG-007",
      name: "Dar es Salaam Events",
      email: "contact@darevents.tz",
      phone: "+255 654 321 0987",
      country: "Tanzania",
      city: "Dar es Salaam",
      address: "111 Ocean Drive, Dar es Salaam",
      monthlyRevenue: 35000,
      ticketsSold: 1680,
      idStatus: "pending",
      contactPersonName: "Isaac Mwangi",
      contactPhoto:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      joinDate: "2024-02-14",
      rating: 4.2,
      totalEvents: 14,
      suspensionFlag: false,
    },
  ]);

  // Get unique countries
  const countries = [...new Set(organizers.map((org) => org.country))].sort();
  const displayedCountries = showAllCountries
    ? countries
    : countries.slice(0, 5);

  // Filter organizers
  const filteredOrganizers = useMemo(() => {
    return organizers
      .filter((org) => {
        const matchesSearch =
          org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCountry =
          selectedCountries.length === 0 ||
          selectedCountries.includes(org.country);

        return matchesSearch && matchesCountry;
      })
      .sort((a, b) => {
        if (sortBy === "revenue") return b.monthlyRevenue - a.monthlyRevenue;
        if (sortBy === "tickets") return b.ticketsSold - a.ticketsSold;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0;
      });
  }, [selectedCountries, searchTerm, sortBy]);

  const toggleCountry = (country) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country],
    );
  };

  const clearFilters = () => {
    setSelectedCountries([]);
    setSearchTerm("");
    setSortBy("revenue");
  };

  const handleVerify = (id) => {
    setOrganizers(
      organizers.map((org) =>
        org.id === id ? { ...org, idStatus: "verified" } : org,
      ),
    );
    toast.success("Organizer verified successfully!");
  };

  const handleReject = (id) => {
    setOrganizers(
      organizers.map((org) =>
        org.id === id ? { ...org, idStatus: "rejected" } : org,
      ),
    );
    toast.error("Organizer rejected.");
  };

  const handleSuspend = (id) => {
    setOrganizers(
      organizers.map((org) =>
        org.id === id ? { ...org, suspensionFlag: !org.suspensionFlag } : org,
      ),
    );
    toast.warning("Organizer suspension status updated.");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "verified":
        return (
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <span className="text-green-600 font-semibold">Verified</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-2">
            <FaClock className="text-yellow-500" />
            <span className="text-yellow-600 font-semibold">Pending</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2">
            <FaTimesCircle className="text-red-500" />
            <span className="text-red-600 font-semibold">Rejected</span>
          </div>
        );
      default:
        return null;
    }
  };

  const statsCards = [
    {
      label: "Total Organizers",
      value: organizers.length,
      color: "bg-zinc-800",
    },
    {
      label: "Verified",
      value: organizers.filter((o) => o.idStatus === "verified").length,
      color: "bg-green-900/30",
    },
    {
      label: "Pending Review",
      value: organizers.filter((o) => o.idStatus === "pending").length,
      color: "bg-yellow-900/30",
    },
    {
      label: "Suspended",
      value: organizers.filter((o) => o.suspensionFlag).length,
      color: "bg-red-900/30",
    },
  ];

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-zinc-900 to-black border-b border-red-500/30 p-8">
        <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">
          Organizer Verification System
        </h1>
        <p className="text-zinc-400">
          Manage organizer accounts, verify credentials, and prevent fraud
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-8 bg-black">
        {statsCards.map((stat, idx) => (
          <div
            key={idx}
            className={`${stat.color} border border-zinc-700 rounded-lg p-6 backdrop-blur-sm hover:border-red-500/50 transition`}
          >
            <p className="text-zinc-400 text-sm uppercase mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-red-500">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-black border-t border-b border-zinc-700 p-4 mx-0">
        <div className="max-w-full px-8 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Search */}
          <div>
            <label className="text-xs uppercase text-zinc-500 block mb-1 font-bold">
              Search
            </label>
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-600 px-2 py-1">
              <FaSearch className="text-zinc-600 text-xs" />
              <input
                type="text"
                placeholder="Name, Email, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-white outline-none w-full text-xs placeholder-zinc-600"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs uppercase text-zinc-500 block mb-1 font-bold">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-600 px-2 py-1 text-white text-xs outline-none cursor-pointer"
            >
              <option value="revenue">Monthly Revenue</option>
              <option value="tickets">Tickets Sold</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          {/* Country Filter Chip Display */}
          <div>
            <label className="text-xs uppercase text-zinc-500 block mb-1 font-bold">
              Countries
            </label>
            <div className="flex flex-wrap gap-1">
              {selectedCountries.length > 0 ? (
                selectedCountries.map((country) => (
                  <span
                    key={country}
                    className="inline-flex items-center gap-1 bg-red-900/40 text-red-300 px-2 py-0.5 text-xs border border-red-600"
                  >
                    {country}
                    <button
                      onClick={() => toggleCountry(country)}
                      className="hover:text-red-200 ml-1"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-zinc-600 text-xs">All countries</span>
              )}
            </div>
          </div>

          {/* Clear Button */}
          <div>
            <button
              onClick={clearFilters}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 text-xs font-bold border border-zinc-600 transition"
            >
              CLEAR
            </button>
          </div>
        </div>

        {/* Country Buttons */}
        <div className="px-8 mt-3 pt-3 border-t border-zinc-700">
          <p className="text-xs uppercase text-zinc-600 mb-2 font-bold">
            Filter by Country:
          </p>
          <div className="flex flex-wrap gap-1">
            {displayedCountries.map((country) => (
              <button
                key={country}
                onClick={() => toggleCountry(country)}
                className={`px-2 py-1 text-xs font-bold border transition ${
                  selectedCountries.includes(country)
                    ? "bg-red-600 text-white border-red-500"
                    : "bg-zinc-900 text-zinc-300 border-zinc-600 hover:border-red-500"
                }`}
              >
                {country} (
                {organizers.filter((o) => o.country === country).length})
              </button>
            ))}
            {countries.length > 5 && (
              <button
                onClick={() => setShowAllCountries(!showAllCountries)}
                className="px-2 py-1 text-xs font-bold border bg-zinc-900 text-zinc-300 border-zinc-600 hover:border-red-500"
              >
                {showAllCountries ? "- LESS" : "+ MORE"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="px-8 py-4 bg-black">
        <div className="bg-black border border-zinc-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-700">
                  <th className="px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-700">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-700">
                    COMPANY
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-700">
                    CONTACT
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-700">
                    CITY
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-700">
                    COUNTRY
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-700">
                    EMAIL
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-700">
                    PHONE
                  </th>
                  <th className="px-3 py-2 text-right font-bold text-zinc-300 border-r border-zinc-700">
                    REVENUE
                  </th>
                  <th className="px-3 py-2 text-right font-bold text-zinc-300 border-r border-zinc-700">
                    TICKETS
                  </th>
                  <th className="px-3 py-2 text-center font-bold text-zinc-300 border-r border-zinc-700">
                    RATING
                  </th>
                  <th className="px-3 py-2 text-center font-bold text-zinc-300 border-r border-zinc-700">
                    STATUS
                  </th>
                  <th className="px-3 py-2 text-center font-bold text-zinc-300">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrganizers.length > 0 ? (
                  filteredOrganizers.map((organizer, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-zinc-700 hover:bg-zinc-950"
                    >
                      <td className="px-3 py-2 text-zinc-300 border-r border-zinc-700 font-mono text-xs">
                        <span
                          className={
                            organizer.suspensionFlag
                              ? "text-red-500"
                              : "text-zinc-400"
                          }
                        >
                          {organizer.id}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-white border-r border-zinc-700 font-semibold">
                        {organizer.name}
                      </td>

                      <td className="px-3 py-2 text-zinc-300 border-r border-zinc-700">
                        {organizer.contactPersonName}
                      </td>

                      <td className="px-3 py-2 text-zinc-300 border-r border-zinc-700">
                        {organizer.city}
                      </td>

                      <td className="px-3 py-2 text-zinc-300 border-r border-zinc-700">
                        {organizer.country}
                      </td>

                      <td className="px-3 py-2 text-zinc-400 border-r border-zinc-700 text-xs truncate">
                        {organizer.email}
                      </td>

                      <td className="px-3 py-2 text-zinc-400 border-r border-zinc-700 text-xs">
                        {organizer.phone}
                      </td>

                      <td className="px-3 py-2 text-right text-red-400 border-r border-zinc-700 font-mono">
                        ₦{organizer.monthlyRevenue.toLocaleString()}
                      </td>

                      <td className="px-3 py-2 text-right text-green-400 border-r border-zinc-700 font-mono">
                        {organizer.ticketsSold.toLocaleString()}
                      </td>

                      <td className="px-3 py-2 text-center text-zinc-400 border-r border-zinc-700">
                        {organizer.rating}★
                      </td>

                      <td className="px-3 py-2 text-center border-r border-zinc-700">
                        {organizer.idStatus === "verified" && (
                          <span className="text-green-500 font-bold text-xs">
                            ✓ OK
                          </span>
                        )}
                        {organizer.idStatus === "pending" && (
                          <span className="text-yellow-500 font-bold text-xs">
                            ⏳ WAIT
                          </span>
                        )}
                        {organizer.idStatus === "rejected" && (
                          <span className="text-red-500 font-bold text-xs">
                            ✕ NO
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-0.5 justify-center">
                          {organizer.idStatus === "pending" && (
                            <>
                              <button
                                onClick={() => handleVerify(organizer.id)}
                                className="bg-green-700 hover:bg-green-600 text-white px-1.5 py-0.5 text-xs font-bold border border-green-600"
                                title="Approve"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleReject(organizer.id)}
                                className="bg-red-700 hover:bg-red-600 text-white px-1.5 py-0.5 text-xs font-bold border border-red-600"
                                title="Reject"
                              >
                                ✕
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleSuspend(organizer.id)}
                            className={`${
                              organizer.suspensionFlag
                                ? "bg-red-900 hover:bg-red-800 border-red-700"
                                : "bg-zinc-700 hover:bg-zinc-600 border-zinc-600"
                            } text-white px-1.5 py-0.5 text-xs font-bold border`}
                            title="Suspend/Unsuspend"
                          >
                            BAN
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="12"
                      className="px-3 py-4 text-center text-zinc-600"
                    >
                      No organizers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          <div className="bg-zinc-950 border-t border-zinc-700 px-3 py-2 text-xs text-zinc-500">
            <p>
              Records:{" "}
              <span className="font-mono font-bold text-zinc-300">
                {filteredOrganizers.length}
              </span>{" "}
              / Total:{" "}
              <span className="font-mono font-bold text-zinc-300">
                {organizers.length}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerVerificationSystem;
