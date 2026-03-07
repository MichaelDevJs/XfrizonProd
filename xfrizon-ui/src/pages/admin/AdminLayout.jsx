import React, { useState } from "react";
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
  FaBars,
  FaTimes,
} from "react-icons/fa";

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/";
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-xs tracking-wide uppercase transition-colors whitespace-nowrap ${
      isActive
        ? "bg-[#403838] text-white"
        : "bg-zinc-950/70 text-zinc-300 hover:bg-zinc-900"
    }`;

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white flex flex-col lg:flex-row">
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 lg:hidden ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Sidebar / Top Nav */}
      <aside
        className={`fixed left-0 top-0 z-50 h-dvh w-72 max-w-[85vw] transform bg-[#1e1e1e] text-white transition-transform duration-200 lg:static lg:h-auto lg:w-64 lg:max-w-none lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-3 sm:p-4">
          <h1 className="text-lg sm:text-xl font-semibold tracking-[0.16em] uppercase text-[#403838]">
            XF Admin
          </h1>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
            Minimal Dashboard
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-3 sm:p-4 lg:space-y-2">
          <div className="flex flex-col gap-2 overflow-y-auto hide-scrollbar pb-1 lg:pb-0">
            <NavLink
              to="/admin/dashboard"
              className={navItemClass}
              onClick={() => setMenuOpen(false)}
            >
              <FaChartBar size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/blogs"
              className={navItemClass}
              onClick={() => setMenuOpen(false)}
            >
              <FaPen size={18} />
              <span>Blog Management</span>
            </NavLink>

            <NavLink
              to="/admin/users"
              className={navItemClass}
              onClick={() => setMenuOpen(false)}
            >
              <FaUsers size={18} />
              <span>Users</span>
            </NavLink>

            <NavLink
              to="/admin/organizers"
              className={navItemClass}
              onClick={() => setMenuOpen(false)}
            >
              <FaUserTie size={18} />
              <span>Organizers</span>
            </NavLink>

            <NavLink
              to="/admin/verify-organizers"
              className={navItemClass}
              onClick={() => setMenuOpen(false)}
            >
              <FaShieldAlt size={18} />
              <span>Verify Organizers</span>
            </NavLink>

            <NavLink
              to="/admin/home-blocks"
              className={navItemClass}
              onClick={() => setMenuOpen(false)}
            >
              <FaThLarge size={18} />
              <span>Homepage Blocks</span>
            </NavLink>

            <NavLink
              to="/admin/messages"
              className={navItemClass}
              onClick={() => setMenuOpen(false)}
            >
              <FaEnvelope size={18} />
              <span>Messages</span>
              <span className="ml-auto bg-[#403838] text-white text-[10px] px-2 py-0.5 uppercase tracking-wide rounded">
                3
              </span>
            </NavLink>

            <NavLink
              to="/admin/payouts"
              className={navItemClass}
              onClick={() => setMenuOpen(false)}
            >
              <FaMoneyBillWave size={18} />
              <span>Payouts</span>
            </NavLink>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="hidden lg:flex items-center gap-2 px-3 py-2 w-full rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 transition-colors mt-4"
          >
            <FaSignOutAlt size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#1e1e1e]">
        {/* Header */}
        <div className="bg-zinc-950 px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center rounded px-2 py-1 text-zinc-300 bg-zinc-900/80"
              aria-label="Toggle menu"
            >
              {menuOpen ? <FaTimes size={14} /> : <FaBars size={14} />}
            </button>
            <h2 className="text-sm sm:text-base font-semibold tracking-wider uppercase text-zinc-100">
              Admin Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-zinc-400 uppercase tracking-wider">
              Welcome, <span className="font-semibold">Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className="lg:hidden px-2 py-1 rounded text-[10px] uppercase text-zinc-300 bg-zinc-900/80"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-3 sm:p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
