import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FaChartBar,
  FaPen,
  FaUsers,
  FaUserTie,
  FaEnvelope,
  FaSignOutAlt,
  FaThLarge,
  FaMoneyBillWave,
  FaBars,
  FaTimes,
  FaHome,
  FaStore,
} from "react-icons/fa";

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/";
  };

  const navItemClass = ({ isActive }) =>
    `group flex items-center gap-2 px-3 py-2 rounded-lg text-xs tracking-wide uppercase transition-all whitespace-nowrap border ${
      isActive
        ? "bg-[#403838]/85 text-white border-[#5a4a4a] shadow-[0_0_0_1px_rgba(64,56,56,0.4)]"
        : "bg-zinc-950/40 text-zinc-300 border-transparent hover:bg-zinc-900/60 hover:border-zinc-700/40"
    }`;

  const navSections = [
    {
      title: "Overview",
      items: [
        { to: "/admin/dashboard", label: "Dashboard", icon: FaChartBar },
        { to: "/admin/home-blocks", label: "Homepage Blocks", icon: FaThLarge },
        { to: "/admin/blogs", label: "Blog Management", icon: FaPen },
      ],
    },
    {
      title: "Operations",
      items: [
        { to: "/admin/users", label: "Users", icon: FaUsers },
        { to: "/admin/organizers", label: "Organizers", icon: FaUserTie },
        {
          to: "/admin/messages",
          label: "Messages",
          icon: FaEnvelope,
          badge: "3",
        },
        { to: "/admin/payouts", label: "Payouts", icon: FaMoneyBillWave },
        { to: "/admin/partners", label: "Partners", icon: FaStore },
      ],
    },
  ];

  const pageTitle = useMemo(() => {
    if (location.pathname.includes("/admin/dashboard")) return "Dashboard";
    if (location.pathname.includes("/admin/blogs")) return "Blog Management";
    if (location.pathname.includes("/admin/users")) return "Users";
    if (location.pathname.includes("/admin/organizers")) return "Organizers";
    if (location.pathname.includes("/admin/messages")) return "Messages";
    if (location.pathname.includes("/admin/payouts")) return "Payouts";
    if (location.pathname.includes("/admin/partners")) return "Partners";
    if (location.pathname.includes("/admin/home-blocks"))
      return "Homepage Blocks";
    return "Admin Dashboard";
  }, [location.pathname]);

  return (
    <div className="admin-theme min-h-screen bg-[#1e1e1e] text-white flex flex-col lg:flex-row">
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
        className={`fixed left-0 top-0 z-50 h-dvh w-72 max-w-[85vw] transform bg-[#1e1e1e] text-white transition-transform duration-200 lg:static lg:h-auto lg:w-72 lg:max-w-none lg:translate-x-0 lg:border-r lg:border-zinc-800/50 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/50 bg-linear-to-b from-zinc-900/30 to-transparent">
          <h1 className="text-lg sm:text-xl font-semibold tracking-[0.16em] uppercase text-[#5a4a4a]">
            XF Admin
          </h1>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
            Control Center
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-3 sm:p-4">
          <div className="flex h-[calc(100dvh-185px)] lg:h-[calc(100dvh-190px)] flex-col gap-4 overflow-y-auto hide-scrollbar pb-2">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {section.title}
                </p>
                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={navItemClass}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon
                          size={16}
                          className="text-zinc-300 group-hover:text-white transition-colors"
                        />
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-[#5a4a4a] text-white text-[10px] px-2 py-0.5 uppercase tracking-wide rounded">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-auto space-y-1.5 pt-2 border-t border-zinc-800/40">
              <a
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs tracking-wide uppercase bg-zinc-950/40 text-zinc-300 border border-transparent hover:bg-zinc-900/60 hover:border-zinc-700/40 transition-all"
              >
                <FaHome size={15} />
                <span>View Site</span>
              </a>

              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center gap-2 px-3 py-2 w-full rounded-lg text-xs tracking-wide uppercase bg-zinc-950/40 text-zinc-300 border border-transparent hover:bg-zinc-900/60 hover:border-zinc-700/40 transition-all"
              >
                <FaSignOutAlt size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#1e1e1e]">
        {/* Header */}
        <div className="bg-zinc-950/70 border-b border-zinc-800/50 px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center rounded px-2 py-1 text-zinc-300 bg-zinc-900/80"
              aria-label="Toggle menu"
            >
              {menuOpen ? <FaTimes size={14} /> : <FaBars size={14} />}
            </button>
            <h2 className="text-sm sm:text-base font-semibold tracking-wider uppercase text-zinc-100">
              {pageTitle}
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
