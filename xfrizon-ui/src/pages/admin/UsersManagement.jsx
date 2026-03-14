import React, { useState } from "react";
import { toast } from "react-toastify";

export default function UsersManagement() {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      joinDate: "Jan 15, 2026",
      status: "ACTIVE",
    },
    {
      id: 2,
      name: "John Doe",
      email: "john@example.com",
      joinDate: "Feb 5, 2026",
      status: "ACTIVE",
    },
    {
      id: 3,
      name: "Emma Wilson",
      email: "emma@example.com",
      joinDate: "Feb 18, 2026",
      status: "ACTIVE",
    },
    {
      id: 4,
      name: "Michael Smith",
      email: "michael@example.com",
      joinDate: "Feb 10, 2026",
      status: "LOCKED",
    },
    {
      id: 5,
      name: "Lisa Anderson",
      email: "lisa@example.com",
      joinDate: "Feb 1, 2026",
      status: "ACTIVE",
    },
    {
      id: 6,
      name: "David Brown",
      email: "david@example.com",
      joinDate: "Jan 25, 2026",
      status: "ACTIVE",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleStatus = (id) => {
    setUsers(
      users.map((user) =>
        user.id === id
          ? { ...user, status: user.status === "ACTIVE" ? "LOCKED" : "ACTIVE" }
          : user,
      ),
    );
    toast.success("User status updated");
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this user?")) {
      setUsers(users.filter((user) => user.id !== id));
      toast.success("User deleted");
    }
  };

  return (
    <div className="admin-theme bg-[#1e1e1e] text-white min-h-screen">
      {/* Header */}
      <div className="bg-linear-to-r from-[#1e1e1e] via-[#252525] to-[#1e1e1e] border-b border-zinc-800/50 p-4">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">
          Users Management
        </h1>
        <p className="text-zinc-500 text-xs uppercase mt-1">
          User accounts management & moderation
        </p>
      </div>

      {/* Search */}
      <div className="p-3 sm:p-4 border-b border-zinc-800/50 bg-[#242424]">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1e1e1e] border border-zinc-700/60 px-3 py-2 rounded-lg text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* Table */}
      <div className="p-3 sm:p-4">
        <div className="border border-zinc-800/50 bg-[#232323] rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto hide-scrollbar">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-[#262626] border-b border-zinc-800/50">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      ID
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      NAME
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      EMAIL
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      JOIN DATE
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-center font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      STATUS
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-center font-bold text-zinc-300 text-[10px] sm:text-xs">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-zinc-800/40 hover:bg-zinc-900/40"
                    >
                      <td className="px-2 sm:px-3 py-2 text-zinc-400 border-r border-zinc-800 font-mono text-[10px] sm:text-xs">
                        {user.id}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-white border-r border-zinc-800 font-semibold text-[10px] sm:text-xs">
                        {user.name}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-zinc-300 border-r border-zinc-800 truncate text-[10px] sm:text-xs">
                        {user.email}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-zinc-400 border-r border-zinc-800 text-[10px] sm:text-xs">
                        {user.joinDate}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center border-r border-zinc-800">
                        <span
                          className={
                            user.status === "ACTIVE"
                              ? "text-green-400 font-bold text-[10px] sm:text-xs"
                              : "text-red-400 font-bold text-[10px] sm:text-xs"
                          }
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className={`${
                              user.status === "ACTIVE"
                                ? "bg-yellow-700 hover:bg-yellow-600 border-yellow-600"
                                : "bg-green-700 hover:bg-green-600 border-green-600"
                            } text-white px-2 py-1 text-[10px] font-bold border rounded`}
                          >
                            LOCK
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-700 hover:bg-red-600 text-white px-2 py-1 text-[10px] font-bold border border-red-600 rounded"
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
          </div>
          <div className="bg-[#202020] border-t border-zinc-800/50 px-3 py-2 text-xs text-zinc-500">
            Records:{" "}
            <span className="font-mono font-bold text-zinc-300">
              {filteredUsers.length}
            </span>{" "}
            / Total:{" "}
            <span className="font-mono font-bold text-zinc-300">
              {users.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
