import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";

export default function OrganizersManagement() {
  const [organizers, setOrganizers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const normalizeOrganizerRow = (row) => {
    const payoutMethodFromData =
      row?.payoutMethod ||
      (row?.payoutPreference === "MANUAL" ||
      row?.iban ||
      row?.accountNumber ||
      row?.bankName
        ? "Manual"
        : "Stripe Connect");

    return {
      organizerId: row?.organizerId ?? row?.id ?? row?.userId,
      name: row?.name || row?.organizerName || "N/A",
      phoneNumber: row?.phoneNumber || row?.phone || "N/A",
      location: row?.location || row?.bankCountry || "N/A",
      email: row?.email || "N/A",
      ticketsListed: Number(row?.ticketsListed ?? 0),
      ticketsSold: Number(row?.ticketsSold ?? 0),
      payout: Number(
        row?.payout ?? row?.totalPendingAmount ?? row?.pendingAmount ?? 0,
      ),
      payoutMethod: payoutMethodFromData,
      dateJoined: row?.dateJoined || row?.createdAt || null,
    };
  };

  useEffect(() => {
    const loadOrganizers = async () => {
      try {
        setLoading(true);
        const endpoints = [
          "/admin/organizers/management",
          "/admin/manual-payouts/organizers",
        ];

        let resolvedRows = [];
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            const response = await api.get(endpoint);
            const payload = response?.data;
            const rows = Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload)
                ? payload
                : [];

            resolvedRows = rows.map(normalizeOrganizerRow);
            lastError = null;
            break;
          } catch (endpointError) {
            const status = endpointError?.response?.status;
            lastError = endpointError;

            if (status === 404) {
              continue;
            }

            throw endpointError;
          }
        }

        if (lastError) {
          throw lastError;
        }

        setOrganizers(resolvedRows);
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
    <div className="bg-[#1e1e1e] min-h-screen text-zinc-100 p-3 sm:p-4">
      {/* Header */}
      <div className="bg-linear-to-r from-[#403838] via-[#4a3a3a] to-[#403838] px-3 py-3 sm:py-4 mb-4 rounded-lg">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
          ORGANIZERS MANAGEMENT
        </h1>
        <p className="text-xs text-zinc-300 mt-1">TOTAL: {organizers.length}</p>
      </div>

      {/* Search Bar */}
      <div className="border border-zinc-800 bg-[#2a2a2a] rounded-lg px-3 py-2 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1e1e1e] border border-zinc-800 text-zinc-100 px-3 py-2 rounded text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* Table */}
      <div className="border border-zinc-800 bg-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto hide-scrollbar">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-[#1e1e1e] border-b border-zinc-800">
                <tr>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-left font-semibold uppercase text-zinc-200 text-[10px] sm:text-xs">
                    Name
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-left font-semibold uppercase text-zinc-200 text-[10px] sm:text-xs">
                    Phone
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-left font-semibold uppercase text-zinc-200 text-[10px] sm:text-xs">
                    Location
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-left font-semibold uppercase text-zinc-200 text-[10px] sm:text-xs">
                    Email
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-center font-semibold uppercase text-zinc-200 text-[10px] sm:text-xs">
                    Listed
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-center font-semibold uppercase text-zinc-200 text-[10px] sm:text-xs">
                    Sold
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-right font-semibold uppercase text-zinc-200 text-[10px] sm:text-xs">
                    Payout
                  </th>
                  <th className="border-r border-zinc-800 px-2 sm:px-3 py-2 text-left font-semibold uppercase text-zinc-200 text-[10px] sm:text-xs">
                    Method
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold uppercase text-zinc-200 text-[10px] sm:text-xs">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#2a2a2a]">
                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-3 py-8 text-center text-zinc-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredOrganizers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-3 py-8 text-center text-zinc-400"
                    >
                      No organizers found
                    </td>
                  </tr>
                ) : (
                  filteredOrganizers.map((org) => (
                    <tr
                      key={org.organizerId}
                      className="border-b border-zinc-800 hover:bg-[#333333] transition-colors"
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
        <div className="border-t border-zinc-800 bg-[#1e1e1e] px-3 py-2 text-xs text-zinc-400">
          Records: {filteredOrganizers.length} / Total: {organizers.length}
        </div>
      </div>
    </div>
  );
}
