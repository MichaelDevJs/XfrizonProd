import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";

export default function OrganizersManagement() {
  const [organizers, setOrganizers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrganizers = async () => {
      try {
        setLoading(true);
        const response = await api.get("/admin/organizers/management");
        const rows = response?.data?.data;
        setOrganizers(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error("Failed to load organizer management data:", error);
        toast.error(
          error?.response?.data?.message ||
            "Failed to load organizer management data",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrganizers();
  }, []);

  const filteredOrganizers = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return organizers.filter(
      (org) =>
        String(org.name || "")
          .toLowerCase()
          .includes(query) ||
        String(org.email || "")
          .toLowerCase()
          .includes(query) ||
        String(org.location || "")
          .toLowerCase()
          .includes(query),
    );
  }, [organizers, searchTerm]);

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPayout = (value) => {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric)) return "0.00";
    return numeric.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="bg-black min-h-screen text-zinc-100 p-3 sm:p-4">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-linear-to-r from-black via-zinc-900 to-black px-3 py-2 sm:py-3 mb-4 rounded-t-lg">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">
          ORGANIZERS MANAGEMENT
        </h1>
        <p className="text-xs text-zinc-400 mt-1">TOTAL: {organizers.length}</p>
      </div>

      {/* Search Bar */}
      <div className="border border-zinc-800 bg-zinc-950 rounded-lg px-3 py-2 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg text-xs placeholder-zinc-600 font-mono focus:outline-none focus:border-red-600"
        />
      </div>

      {/* Table */}
      <div className="border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto hide-scrollbar">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-black border-b border-zinc-800">
                <tr>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-left font-bold uppercase text-zinc-100 text-[10px] sm:text-xs">
                    Name
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-left font-bold uppercase text-zinc-100 text-[10px] sm:text-xs">
                    Phone
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-left font-bold uppercase text-zinc-100 text-[10px] sm:text-xs">
                    Location
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-left font-bold uppercase text-zinc-100 text-[10px] sm:text-xs">
                    Email
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-center font-bold uppercase text-zinc-100 text-[10px] sm:text-xs">
                    Listed
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-center font-bold uppercase text-zinc-100 text-[10px] sm:text-xs">
                    Sold
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-right font-bold uppercase text-zinc-100 text-[10px] sm:text-xs">
                    Payout
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-left font-bold uppercase text-zinc-100 text-[10px] sm:text-xs">
                    Method
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-bold uppercase text-zinc-100 text-[10px] sm:text-xs">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-3 py-8 text-center text-zinc-400">
                      Loading...
                    </td>
                  </tr>
                ) : filteredOrganizers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-3 py-8 text-center text-zinc-400">
                      No organizers found
                    </td>
                  </tr>
                ) : (
                  filteredOrganizers.map((org) => (
                    <tr
                      key={org.organizerId}
                      className="border-b border-zinc-800 hover:bg-zinc-900 transition-colors"
                    >
                      <td className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-zinc-100 text-[10px] sm:text-xs">
                        {org.name}
                      </td>
                      <td className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-zinc-300 text-[10px] sm:text-xs">
                        {org.phoneNumber || "N/A"}
                      </td>
                      <td className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-zinc-300 text-[10px] sm:text-xs">
                        {org.location || "N/A"}
                      </td>
                      <td className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-zinc-400 truncate text-[10px] sm:text-xs">
                        {org.email}
                      </td>
                      <td className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-center font-mono text-zinc-300 text-[10px] sm:text-xs">
                        {org.ticketsListed ?? 0}
                      </td>
                      <td className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-center font-mono text-zinc-300 text-[10px] sm:text-xs">
                        {org.ticketsSold ?? 0}
                      </td>
                      <td className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-right font-mono text-zinc-200 text-[10px] sm:text-xs">
                        {formatPayout(org.payout)}
                      </td>
                      <td className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-zinc-300 text-[10px] sm:text-xs">
                        {org.payoutMethod || "Manual"}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-zinc-400 font-mono text-[10px] sm:text-xs">
                        {formatDate(org.dateJoined)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="border-t border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-400 font-mono">
          Records: {filteredOrganizers.length} / Total: {organizers.length}
        </div>
      </div>
    </div>
  );
}

      <div className="border-b border-zinc-800 bg-linear-to-r from-black via-zinc-900 to-black px-3 py-2 sm:py-3 mb-4 rounded-t-lg">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">
          ORGANIZERS MANAGEMENT
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          TOTAL: {stats.total} | APPROVED: {stats.approved} | PENDING:{" "}
          {stats.pending} | REJECTED: {stats.rejected}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <div className="border border-zinc-800 bg-zinc-950 rounded-lg px-3 py-2">
          <div className="text-[10px] sm:text-xs uppercase text-zinc-400 font-bold">
            Total Organizers
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-zinc-100 mt-1">
            {stats.total}
          </div>
        </div>
        <div className="border border-green-800 bg-zinc-950 rounded-lg px-3 py-2">
          <div className="text-[10px] sm:text-xs uppercase text-green-400 font-bold">
            Approved
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-green-400 mt-1">
            {stats.approved}
          </div>
        </div>
        <div className="border border-yellow-800 bg-zinc-950 rounded-lg px-3 py-2">
          <div className="text-[10px] sm:text-xs uppercase text-yellow-400 font-bold">
            Pending
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-yellow-400 mt-1">
            {stats.pending}
          </div>
        </div>
        <div className="border border-red-800 bg-zinc-950 rounded-lg px-3 py-2">
          <div className="text-[10px] sm:text-xs uppercase text-red-400 font-bold">
            Rejected
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-red-400 mt-1">
            {stats.rejected}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border border-zinc-800 bg-zinc-950 rounded-lg px-3 py-2 mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg

              {filteredOrganizers.map((org) => (
                <tr
                  key={org.organizerId}
                  className="border-b border-zinc-700 hover:bg-zinc-900 transition-colors"
                >
                  <td className="border-r border-zinc-700 px-4 py-3 text-zinc-100">
                    {org.name}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-zinc-300">
                    {org.phoneNumber || "N/A"}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-zinc-300">
                    {org.location || "N/A"}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-zinc-400 text-xs truncate">
                    {org.email}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-center font-mono text-zinc-300">
                    {org.ticketsListed ?? 0}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-center font-mono text-zinc-300">
                    {org.ticketsSold ?? 0}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-right font-mono text-zinc-200">
                    {formatPayout(org.payout)}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-zinc-300">
                    {org.payoutMethod || "Manual"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                    {formatDate(org.dateJoined)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Stats */}
        <div className="border-t-2 border-zinc-700 bg-black px-4 py-2 text-xs text-zinc-400 font-mono">
          Records: {filteredOrganizers.length} / Total: {organizers.length}
        </div>
      </div>
    </div>
  );
}
