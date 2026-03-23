import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import adminUsersApi from "../../api/adminUsersApi";

const ASSIGNABLE_ROLES = ["USER", "BLOG_WRITER", "ADMIN"];

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleDrafts, setRoleDrafts] = useState({});
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const normalizeUserRow = (row) => {
    const id = row?.userId ?? row?.id ?? null;
    const firstName = row?.firstName || "";
    const lastName = row?.lastName || "";
    const composedName = `${firstName} ${lastName}`.trim();

    const socialLinks = [
      row?.instagram ? `IG: ${row.instagram}` : null,
      row?.twitter ? `X: ${row.twitter}` : null,
      row?.website ? `Web: ${row.website}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const ticketsBoughtRaw =
      row?.ticketsBought ??
      row?.ticketBought ??
      row?.ticketsCount ??
      row?.ticketCount ??
      row?.totalTicketsBought ??
      row?.purchasedTickets ??
      0;

    const amountSpentRaw =
      row?.amountSpent ??
      row?.totalSpent ??
      row?.spentAmount ??
      row?.totalPaid ??
      0;

    const roleRaw = row?.roles || row?.role || "USER";
    const normalizedRoles = String(roleRaw)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .join(", ");

    const amountSpent = Number(amountSpentRaw);

    return {
      id,
      name: row?.name || composedName || "N/A",
      email: row?.email || "N/A",
      role: row?.role || "USER",
      roles: normalizedRoles || "USER",
      location: row?.location || "N/A",
      ticketsBought: Number.isFinite(Number(ticketsBoughtRaw))
        ? Number(ticketsBoughtRaw)
        : 0,
      amountSpent: Number.isFinite(amountSpent) ? amountSpent : 0,
      phoneNumber: row?.phoneNumber || "N/A",
      address: row?.address || "N/A",
      socialLinks: socialLinks || "N/A",
      bio: row?.bio || "N/A",
      joinDate: row?.dateJoined || row?.createdAt || null,
    };
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const rows = await adminUsersApi.getAll();
        const normalized = Array.isArray(rows)
          ? rows.map(normalizeUserRow)
          : [];
        setUsers(normalized);
      } catch (error) {
        console.error("Failed to load users:", error);
        toast.error(error?.response?.data?.message || "Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        String(user.name || "")
          .toLowerCase()
          .includes(query) ||
        String(user.email || "")
          .toLowerCase()
          .includes(query) ||
        String(user.roles || "")
          .toLowerCase()
          .includes(query) ||
        String(user.location || "")
          .toLowerCase()
          .includes(query) ||
        String(user.phoneNumber || "")
          .toLowerCase()
          .includes(query) ||
        String(user.address || "")
          .toLowerCase()
          .includes(query) ||
        String(user.socialLinks || "")
          .toLowerCase()
          .includes(query) ||
        String(user.bio || "")
          .toLowerCase()
          .includes(query),
    );
  }, [searchTerm, users]);

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

  const formatAmount = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "$0.00";
    return `$${numeric.toFixed(2)}`;
  };

  const handleRoleDraftChange = (userId, role) => {
    setRoleDrafts((prev) => ({
      ...prev,
      [userId]: role,
    }));
  };

  const handleAssignRole = async (user) => {
    const nextRole = roleDrafts[user.id] || user.role || "USER";
    if (
      String(nextRole).toUpperCase() === String(user.role || "").toUpperCase()
    ) {
      toast.info("Role is unchanged");
      return;
    }

    try {
      setUpdatingUserId(user.id);
      await adminUsersApi.assignRole({ userId: user.id, role: nextRole });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? {
                ...item,
                role: nextRole,
                roles: nextRole,
              }
            : item,
        ),
      );
      toast.success(`Role updated to ${nextRole}`);
    } catch (error) {
      console.error("Failed to assign role:", error);
      toast.error(
        error?.response?.data?.message ||
          "Role update failed. Ensure backend role assignment endpoint is enabled.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Delete user ${user.email}? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setDeletingUserId(user.id);
      await adminUsersApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      toast.success(`User ${user.email} deleted`);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to delete user. User may have related records.",
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="admin-theme bg-[#1e1e1e] text-white min-h-screen">
      <div className="bg-linear-to-r from-[#1e1e1e] via-[#252525] to-[#1e1e1e] border-b border-zinc-800/50 p-4">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">
          Users Management
        </h1>
        <p className="text-zinc-500 text-xs uppercase mt-1">
          Users table fetched from database
        </p>
      </div>

      <div className="p-3 sm:p-4 border-b border-zinc-800/50 bg-[#242424]">
        <input
          type="text"
          placeholder="Search by name, email, roles, location, phone, address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1e1e1e] border border-zinc-700/60 px-3 py-2 rounded-lg text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
        />
      </div>

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
                      ROLES
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      LOCATION
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-center font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      TICKETS
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-right font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      AMOUNT SPENT
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      PHONE
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      ADDRESS
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      SOCIAL LINKS
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      BIO
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left font-bold text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                      JOIN DATE
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-left font-bold text-zinc-300 text-[10px] sm:text-xs">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="13"
                        className="px-3 py-8 text-center text-zinc-400"
                      >
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="13"
                        className="px-3 py-8 text-center text-zinc-400"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
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
                        <td className="px-2 sm:px-3 py-2 text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                          {user.roles}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                          {user.location}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-center text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                          {user.ticketsBought}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs font-medium whitespace-nowrap">
                          {formatAmount(user.amountSpent)}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs">
                          {user.phoneNumber}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs truncate max-w-xs">
                          {user.address}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs truncate max-w-xs">
                          {user.socialLinks}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-zinc-300 border-r border-zinc-800 text-[10px] sm:text-xs truncate max-w-xs">
                          {user.bio}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-zinc-400 border-r border-zinc-800 text-[10px] sm:text-xs">
                          {formatDate(user.joinDate)}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={roleDrafts[user.id] || user.role || "USER"}
                              onChange={(e) =>
                                handleRoleDraftChange(user.id, e.target.value)
                              }
                              className="bg-[#1e1e1e] border border-zinc-700/60 px-2 py-1 rounded text-white text-[10px] sm:text-xs focus:outline-none"
                            >
                              {ASSIGNABLE_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={updatingUserId === user.id}
                              onClick={() => handleAssignRole(user)}
                              className="px-2 py-1 rounded bg-[#403838] text-white disabled:opacity-50"
                            >
                              {updatingUserId === user.id ? "..." : "Save"}
                            </button>
                            <button
                              type="button"
                              disabled={deletingUserId === user.id}
                              onClick={() => handleDeleteUser(user)}
                              className="px-2 py-1 rounded bg-red-700/80 hover:bg-red-700 text-white disabled:opacity-50"
                            >
                              {deletingUserId === user.id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-[#202020] border-t border-zinc-800/50 px-3 py-2 text-xs text-zinc-500">
            Records: {filteredUsers.length} / Total: {users.length}
          </div>
        </div>
      </div>
    </div>
  );
}
