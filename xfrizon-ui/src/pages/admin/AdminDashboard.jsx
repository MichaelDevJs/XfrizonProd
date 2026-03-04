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
      <div className="bg-zinc-950 border border-zinc-800 p-6">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.16em] text-zinc-100">
          Admin Dashboard
        </h1>
        <p className="text-zinc-500 text-xs uppercase mt-2 tracking-wider">
          System Overview
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 bg-[#1e1e1e] px-4 py-2">
            <h2 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
              Key Metrics
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-zinc-800">
            {stats.map((stat, idx) => (
              <Link
                key={idx}
                to={stat.link}
                className="p-4 hover:bg-zinc-900/70 transition border-r border-b border-zinc-800 last:border-r-0 cursor-pointer group"
              >
                <p className="text-xs uppercase text-zinc-500 font-bold mb-2">
                  {stat.label}
                </p>
                <p className="text-3xl font-mono font-semibold text-[#403838] group-hover:text-zinc-200">
                  {stat.value}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 bg-[#1e1e1e] px-4 py-2">
            <h2 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <Link
              to="/admin/blogs"
              className="p-4 border-r border-b border-zinc-800 hover:bg-zinc-900/70 transition text-xs"
            >
              <p className="font-bold uppercase text-[#403838] mb-1 tracking-wide">
                → Write New Blog
              </p>
              <p className="text-zinc-500">Create and publish new content</p>
            </Link>
            <Link
              to="/admin/verify-organizers"
              className="p-4 border-b border-zinc-800 hover:bg-zinc-900/70 transition text-xs"
            >
              <p className="font-bold uppercase text-[#403838] mb-1 tracking-wide">
                → Verify Organizers
              </p>
              <p className="text-zinc-500">Review pending organizer accounts</p>
            </Link>
            <Link
              to="/admin/messages"
              className="p-4 border-r border-zinc-800 hover:bg-zinc-900/70 transition text-xs"
            >
              <p className="font-bold uppercase text-[#403838] mb-1 tracking-wide">
                → View Messages (12)
              </p>
              <p className="text-zinc-500">Read messages from platform users</p>
            </Link>
            <Link
              to="/admin/users"
              className="p-4 hover:bg-zinc-900/70 transition text-xs"
            >
              <p className="font-bold uppercase text-[#403838] mb-1 tracking-wide">
                → Manage Users
              </p>
              <p className="text-zinc-500">View and manage user accounts</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 bg-[#1e1e1e] px-4 py-2">
            <h2 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
              Recent Activity
            </h2>
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {recentActivity.map((activity, idx) => (
                <tr
                  key={idx}
                  className="border-b border-zinc-800 hover:bg-zinc-900/70"
                >
                  <td className="px-4 py-3 border-r border-zinc-800 font-semibold text-zinc-100">
                    {activity.action}
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-800 text-zinc-400">
                    {activity.user}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{activity.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* System Status */}
        <div className="border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 bg-[#1e1e1e] px-4 py-2">
            <h2 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
              System Status
            </h2>
          </div>
          <div className="p-4 text-xs space-y-2">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">API Status:</span>
              <span className="font-mono text-zinc-200">◉ ONLINE</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">Database:</span>
              <span className="font-mono text-zinc-200">◉ CONNECTED</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">Payment Gateway:</span>
              <span className="font-mono text-zinc-200">◉ ACTIVE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Last Sync:</span>
              <span className="font-mono text-zinc-300">2 mins ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
