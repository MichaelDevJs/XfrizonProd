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
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
      <div className="bg-linear-to-r from-black via-zinc-900 to-black border-b border-zinc-700 p-6">
        <h1 className="text-3xl font-bold uppercase tracking-widest">
          Users Management
        </h1>
        <p className="text-zinc-500 text-xs uppercase mt-1">
          User accounts management & moderation
        </p>
      </div>

      {/* Search */}
      <div className="p-6 border-b border-zinc-700 bg-zinc-950">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black border border-zinc-700 px-3 py-2 text-white text-xs placeholder-zinc-600"
        />
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="border border-zinc-700 bg-zinc-950 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-700">
                  <th className="px-4 py-2 text-left font-bold text-zinc-300 border-r border-zinc-700">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left font-bold text-zinc-300 border-r border-zinc-700">
                    NAME
                  </th>
                  <th className="px-4 py-2 text-left font-bold text-zinc-300 border-r border-zinc-700">
                    EMAIL
                  </th>
                  <th className="px-4 py-2 text-left font-bold text-zinc-300 border-r border-zinc-700">
                    JOIN DATE
                  </th>
                  <th className="px-4 py-2 text-center font-bold text-zinc-300 border-r border-zinc-700">
                    STATUS
                  </th>
                  <th className="px-4 py-2 text-center font-bold text-zinc-300">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-zinc-700 hover:bg-zinc-900"
                  >
                    <td className="px-4 py-3 text-zinc-400 border-r border-zinc-700 font-mono">
                      {user.id}
                    </td>
                    <td className="px-4 py-3 text-white border-r border-zinc-700 font-semibold">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 border-r border-zinc-700 text-xs truncate">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 border-r border-zinc-700">
                      {user.joinDate}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-zinc-700">
                      <span
                        className={
                          user.status === "ACTIVE"
                            ? "text-green-400 font-bold"
                            : "text-red-400 font-bold"
                        }
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`${
                            user.status === "ACTIVE"
                              ? "bg-yellow-700 hover:bg-yellow-600 border-yellow-600"
                              : "bg-green-700 hover:bg-green-600 border-green-600"
                          } text-white px-2 py-1 text-xs font-bold border`}
                        >
                          LOCK
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="bg-red-700 hover:bg-red-600 text-white px-2 py-1 text-xs font-bold border border-red-600"
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
          <div className="bg-zinc-950 border-t border-zinc-700 px-4 py-2 text-xs text-zinc-500">
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
