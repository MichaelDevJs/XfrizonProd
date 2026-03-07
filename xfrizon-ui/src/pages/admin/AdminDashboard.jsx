import React from "react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Blogs", value: "24", link: "/admin/blogs" },
    { label: "Total Users", value: "1,234", link: "/admin/users" },
    { label: "Total Organizers", value: "56", link: "/admin/organizers" },
    { label: "Unread Messages", value: "12", link: "/admin/messages" },
    {
      label: "Verified Organizers",
      value: "47",
      link: "/admin/verify-organizers",
    },
    {
      label: "Pending Verification",
      value: "9",
      link: "/admin/verify-organizers",
    },
  ];

  const recentActivity = [
    { action: "New blog published", user: "Admin", time: "2 hours ago" },
    {
      action: "New user registered",
      user: "Sarah Johnson",
      time: "4 hours ago",
    },
    { action: "Organizer approved", user: "Events Inc.", time: "6 hours ago" },
    { action: "Message received", user: "John Doe", time: "8 hours ago" },
    { action: "Fraud alert triggered", user: "System", time: "10 hours ago" },
  ];

  return (
    <div className="bg-[#1e1e1e] text-white min-h-screen">
      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 p-4">
        <h1 className="text-xl sm:text-2xl font-semibold uppercase tracking-wider text-zinc-100">
          Admin Dashboard
        </h1>
        <p className="text-zinc-500 text-xs uppercase mt-1 tracking-wider">
          System Overview
        </p>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-4 space-y-4">
        {/* Stats Grid */}
        <div className="border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden">
          <div className="border-b border-zinc-800 bg-[#1e1e1e] px-3 py-2">
            <h2 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
              Key Metrics
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
            {stats.map((stat, idx) => (
              <Link
                key={idx}
                to={stat.link}
                className="p-3 hover:bg-zinc-900/70 transition border-r border-b border-zinc-800 last:border-r-0 cursor-pointer group"
              >
                <p className="text-[10px] sm:text-xs uppercase text-zinc-500 font-bold mb-1">
                  {stat.label}
                </p>
                <p className="text-xl sm:text-2xl font-mono font-semibold text-[#403838] group-hover:text-zinc-200">
                  {stat.value}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden">
          <div className="border-b border-zinc-800 bg-[#1e1e1e] px-3 py-2">
            <h2 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            <Link
              to="/admin/blogs"
              className="p-3 border-r border-b sm:border-b-0 border-zinc-800 hover:bg-zinc-900/70 transition text-xs"
            >
              <p className="font-bold uppercase text-[#403838] mb-0.5 tracking-wide text-[10px] sm:text-xs">
                → Write New Blog
              </p>
              <p className="text-zinc-500 text-[10px]">
                Create and publish new content
              </p>
            </Link>
            <Link
              to="/admin/verify-organizers"
              className="p-3 border-b sm:border-b-0 border-zinc-800 hover:bg-zinc-900/70 transition text-xs"
            >
              <p className="font-bold uppercase text-[#403838] mb-0.5 tracking-wide text-[10px] sm:text-xs">
                → Verify Organizers
              </p>
              <p className="text-zinc-500 text-[10px]">
                Review pending organizer accounts
              </p>
            </Link>
            <Link
              to="/admin/messages"
              className="p-3 border-r border-b sm:border-b-0 border-zinc-800 hover:bg-zinc-900/70 transition text-xs"
            >
              <p className="font-bold uppercase text-[#403838] mb-0.5 tracking-wide text-[10px] sm:text-xs">
                → View Messages (12)
              </p>
              <p className="text-zinc-500 text-[10px]">
                Read messages from platform users
              </p>
            </Link>
            <Link
              to="/admin/users"
              className="p-3 hover:bg-zinc-900/70 transition text-xs"
            >
              <p className="font-bold uppercase text-[#403838] mb-0.5 tracking-wide text-[10px] sm:text-xs">
                → Manage Users
              </p>
              <p className="text-zinc-500 text-[10px]">
                View and manage user accounts
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden">
          <div className="border-b border-zinc-800 bg-[#1e1e1e] px-3 py-2">
            <h2 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
              Recent Activity
            </h2>
          </div>
          <div className="max-h-80 overflow-y-auto hide-scrollbar">
            <table className="w-full text-xs border-collapse">
              <tbody>
                {recentActivity.map((activity, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-800 hover:bg-zinc-900/70"
                  >
                    <td className="px-3 py-2 border-r border-zinc-800 font-semibold text-zinc-100 text-[10px] sm:text-xs">
                      {activity.action}
                    </td>
                    <td className="px-3 py-2 border-r border-zinc-800 text-zinc-400 text-[10px] sm:text-xs">
                      {activity.user}
                    </td>
                    <td className="px-3 py-2 text-zinc-500 text-[10px] sm:text-xs">
                      {activity.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status */}
        <div className="border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden">
          <div className="border-b border-zinc-800 bg-[#1e1e1e] px-3 py-2">
            <h2 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
              System Status
            </h2>
          </div>
          <div className="p-3 text-xs space-y-2">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
              <span className="text-zinc-400 text-[10px] sm:text-xs">
                API Status:
              </span>
              <span className="font-mono text-zinc-200 text-[10px] sm:text-xs">
                ◉ ONLINE
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
              <span className="text-zinc-400 text-[10px] sm:text-xs">
                Database:
              </span>
              <span className="font-mono text-zinc-200 text-[10px] sm:text-xs">
                ◉ CONNECTED
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
              <span className="text-zinc-400 text-[10px] sm:text-xs">
                Payment Gateway:
              </span>
              <span className="font-mono text-zinc-200 text-[10px] sm:text-xs">
                ◉ ACTIVE
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-[10px] sm:text-xs">
                Last Sync:
              </span>
              <span className="font-mono text-zinc-300 text-[10px] sm:text-xs">
                2 mins ago
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
