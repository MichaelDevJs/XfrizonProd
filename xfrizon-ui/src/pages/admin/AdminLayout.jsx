import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FaChartBar,
  FaPen,
  FaUsers,
  FaUserTie,
  FaEnvelope,
  FaSignOutAlt,
  FaShieldAlt,
  FaThLarge,
  FaMoneyBillWave,
} from "react-icons/fa";

export default function AdminLayout() {
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/";
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 mb-2 border text-sm tracking-wide uppercase transition-colors ${
      isActive
        ? "bg-[#403838] border-[#403838] text-white"
        : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
    }`;

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-white">
      {/* Sidebar */}
      <div className="w-72 bg-[#1e1e1e] text-white border-r border-zinc-800 overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-2xl font-semibold tracking-[0.18em] uppercase text-[#403838]">
            XF Admin
          </h1>
          <p className="text-xs text-zinc-500 mt-2 uppercase tracking-wider">
            Minimal Dashboard
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <NavLink to="/admin/dashboard" className={navItemClass}>
            <FaChartBar size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/admin/blogs" className={navItemClass}>
            <FaPen size={18} />
            <span>Blog Management</span>
          </NavLink>

          <NavLink to="/admin/users" className={navItemClass}>
            <FaUsers size={18} />
            <span>Users</span>
          </NavLink>

          <NavLink to="/admin/organizers" className={navItemClass}>
            <FaUserTie size={18} />
            <span>Organizers</span>
          </NavLink>

          <NavLink to="/admin/verify-organizers" className={navItemClass}>
            <FaShieldAlt size={18} />
            <span>Verify Organizers</span>
          </NavLink>

          <NavLink to="/admin/home-blocks" className={navItemClass}>
            <FaThLarge size={18} />
            <span>Homepage Blocks</span>
          </NavLink>

          <NavLink to="/admin/messages" className={navItemClass}>
            <FaEnvelope size={18} />
            <span>Messages</span>
            <span className="ml-auto bg-[#403838] text-white text-[10px] px-2 py-1 uppercase tracking-wide">
              3
            </span>
          </NavLink>

          <NavLink to="/admin/payouts" className={navItemClass}>
            <FaMoneyBillWave size={18} />
            <span>Payouts</span>
          </NavLink>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full border border-zinc-800 text-zinc-300 hover:bg-zinc-900 transition-colors mt-8"
          >
            <FaSignOutAlt size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#1e1e1e]">
        {/* Header */}
        <div className="bg-zinc-950 border-b border-zinc-800 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-[0.12em] uppercase text-zinc-100">
            Admin Dashboard
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-zinc-400 uppercase tracking-wider">
              Welcome, <span className="font-semibold">Admin</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
