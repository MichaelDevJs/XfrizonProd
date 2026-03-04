import React, { useState } from "react";
import { toast } from "react-toastify";

export default function OrganizersManagement() {
  const [organizers, setOrganizers] = useState([
    {
      id: 1,
      name: "Events Inc.",
      email: "events@inc.com",
      events: 15,
      status: "Approved",
      joinDate: "Jan 5, 2026",
    },
    {
      id: 2,
      name: "Live Music Productions",
      email: "live@music.com",
      events: 8,
      status: "Approved",
      joinDate: "Jan 20, 2026",
    },
    {
      id: 3,
      name: "Festival Organizers Africa",
      email: "festival@africa.com",
      events: 0,
      status: "Pending",
      joinDate: "Feb 18, 2026",
    },
    {
      id: 4,
      name: "Comedy Nights Ltd",
      email: "comedy@nights.com",
      events: 5,
      status: "Rejected",
      joinDate: "Feb 1, 2026",
    },
    {
      id: 5,
      name: "Concert Hub",
      email: "concert@hub.com",
      events: 12,
      status: "Approved",
      joinDate: "Jan 15, 2026",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrganizers = organizers.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleApprove = (id) => {
    setOrganizers(
      organizers.map((org) =>
        org.id === id ? { ...org, status: "Approved" } : org,
      ),
    );
    toast.success("Organizer approved");
  };

  const handleReject = (id) => {
    setOrganizers(
      organizers.map((org) =>
        org.id === id ? { ...org, status: "Rejected" } : org,
      ),
    );
    toast.success("Organizer rejected");
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this organizer?")) {
      setOrganizers(organizers.filter((org) => org.id !== id));
      toast.success("Organizer deleted");
    }
  };

  const stats = {
    total: organizers.length,
    approved: organizers.filter((o) => o.status === "Approved").length,
    pending: organizers.filter((o) => o.status === "Pending").length,
    rejected: organizers.filter((o) => o.status === "Rejected").length,
  };

  return (
    <div className="bg-black min-h-screen text-zinc-100 p-6">
      {/* Header */}
      <div className="border-b-2 border-t-2 border-zinc-700 bg-linear-to-r from-black via-zinc-900 to-black px-4 py-3 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          ORGANIZERS MANAGEMENT
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          TOTAL: {stats.total} | APPROVED: {stats.approved} | PENDING:{" "}
          {stats.pending} | REJECTED: {stats.rejected}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border-2 border-zinc-700 bg-zinc-950 px-4 py-3">
          <div className="text-xs uppercase text-zinc-400 font-bold">
            Total Organizers
          </div>
          <div className="text-2xl font-mono font-bold text-zinc-100 mt-1">
            {stats.total}
          </div>
        </div>
        <div className="border-2 border-green-700 bg-zinc-950 px-4 py-3">
          <div className="text-xs uppercase text-green-400 font-bold">
            Approved
          </div>
          <div className="text-2xl font-mono font-bold text-green-400 mt-1">
            {stats.approved}
          </div>
        </div>
        <div className="border-2 border-yellow-700 bg-zinc-950 px-4 py-3">
          <div className="text-xs uppercase text-yellow-400 font-bold">
            Pending
          </div>
          <div className="text-2xl font-mono font-bold text-yellow-400 mt-1">
            {stats.pending}
          </div>
        </div>
        <div className="border-2 border-red-700 bg-zinc-950 px-4 py-3">
          <div className="text-xs uppercase text-red-400 font-bold">
            Rejected
          </div>
          <div className="text-2xl font-mono font-bold text-red-400 mt-1">
            {stats.rejected}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-2 border-zinc-700 bg-zinc-950 px-4 py-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black border border-zinc-700 text-zinc-100 px-3 py-2 text-xs placeholder-zinc-600 font-mono focus:outline-none focus:border-red-600"
        />
      </div>

      {/* Table */}
      <div className="border-2 border-zinc-700 bg-zinc-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-black border-b-2 border-zinc-700">
                <th className="border-r border-zinc-700 px-4 py-2 text-left font-bold uppercase text-zinc-100">
                  ID
                </th>
                <th className="border-r border-zinc-700 px-4 py-2 text-left font-bold uppercase text-zinc-100">
                  Name
                </th>
                <th className="border-r border-zinc-700 px-4 py-2 text-left font-bold uppercase text-zinc-100">
                  Email
                </th>
                <th className="border-r border-zinc-700 px-4 py-2 text-center font-bold uppercase text-zinc-100">
                  Events
                </th>
                <th className="border-r border-zinc-700 px-4 py-2 text-left font-bold uppercase text-zinc-100">
                  Join Date
                </th>
                <th className="border-r border-zinc-700 px-4 py-2 text-center font-bold uppercase text-zinc-100">
                  Status
                </th>
                <th className="px-4 py-2 text-center font-bold uppercase text-zinc-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {filteredOrganizers.map((org) => (
                <tr
                  key={org.id}
                  className="border-b border-zinc-700 hover:bg-zinc-900 transition-colors"
                >
                  <td className="border-r border-zinc-700 px-4 py-3 font-mono text-zinc-300">
                    #{org.id}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-zinc-100">
                    {org.name}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-zinc-400 text-xs truncate">
                    {org.email}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-center font-mono text-zinc-300">
                    {org.events}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-zinc-400 font-mono text-xs">
                    {org.joinDate}
                  </td>
                  <td className="border-r border-zinc-700 px-4 py-3 text-center">
                    <span
                      className={`font-mono font-bold uppercase text-xs ${
                        org.status === "Approved"
                          ? "text-green-400"
                          : org.status === "Pending"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {org.status === "Approved"
                        ? "✓ APP"
                        : org.status === "Pending"
                          ? "⏳ PEN"
                          : "✕ REJ"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      {org.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(org.id)}
                            className="border border-green-600 text-green-400 hover:bg-green-950 px-2 py-1 font-mono text-xs font-bold uppercase transition-colors"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleReject(org.id)}
                            className="border border-red-600 text-red-400 hover:bg-red-950 px-2 py-1 font-mono text-xs font-bold uppercase transition-colors"
                          >
                            ✕
                          </button>
                        </>
                      )}
                      {org.status === "Approved" && (
                        <button
                          onClick={() => handleReject(org.id)}
                          className="border border-yellow-600 text-yellow-400 hover:bg-yellow-950 px-2 py-1 font-mono text-xs font-bold uppercase transition-colors"
                        >
                          BAN
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(org.id)}
                        className="border border-red-600 text-red-400 hover:bg-red-950 px-2 py-1 font-mono text-xs font-bold uppercase transition-colors"
                      >
                        DEL
                      </button>
                    </div>
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
