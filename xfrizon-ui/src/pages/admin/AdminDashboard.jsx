import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboardSummary } from "../../api/adminDashboardApi";
import { getReferralAnalytics } from "../../api/referralApi";

const toIsoDate = (date) => date.toISOString().slice(0, 10);

const getDefaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);

  return {
    fromDate: toIsoDate(from),
    toDate: toIsoDate(to),
  };
};

export default function AdminDashboard() {
  const defaults = getDefaultRange();
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [referralAnalytics, setReferralAnalytics] = useState(null);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const loadSummary = async () => {
    setLoadingSummary(true);
    setSummaryError("");

    try {
      const response = await getAdminDashboardSummary();
      setSummary(response?.data || null);
    } catch (error) {
      setSummaryError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load dashboard summary",
      );
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadReferralAnalytics = async (from, to) => {
    setLoadingReferrals(true);
    setReferralError("");

    try {
      const response = await getReferralAnalytics({
        fromDate: from,
        toDate: to,
        limit: 8,
      });
      setReferralAnalytics(response?.data || null);
    } catch (error) {
      setReferralError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load referral analytics",
      );
      setReferralAnalytics(null);
    } finally {
      setLoadingReferrals(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadReferralAnalytics(fromDate, toDate);
  }, []);

  const handleApplyRange = () => {
    if (!fromDate || !toDate) {
      setReferralError("Select both from/to dates.");
      return;
    }
    if (toDate < fromDate) {
      setReferralError("To date cannot be earlier than from date.");
      return;
    }
    loadReferralAnalytics(fromDate, toDate);
  };

  const stats = [
    {
      label: "Total Blogs",
      value: loadingSummary ? "..." : (summary?.totalBlogs ?? "0"),
      link: "/admin/blogs",
    },
    {
      label: "Total Users",
      value: loadingSummary ? "..." : (summary?.totalUsers ?? "0"),
      link: "/admin/users",
    },
    {
      label: "Total Organizers",
      value: loadingSummary ? "..." : (summary?.totalOrganizers ?? "0"),
      link: "/admin/organizers",
    },
    {
      label: "Unread Messages",
      value: loadingSummary
        ? "..."
        : summary?.unreadMessages == null
          ? "N/A"
          : String(summary.unreadMessages),
      link: "/admin/messages",
    },
    {
      label: "Verified Organizers",
      value: loadingSummary ? "..." : (summary?.verifiedOrganizers ?? "0"),
      link: "/admin/verify-organizers",
    },
    {
      label: "Pending Verification",
      value: loadingSummary ? "..." : (summary?.pendingVerification ?? "0"),
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
          {summaryError ? (
            <div className="px-3 py-2 border-b border-zinc-800 text-[11px] text-red-400">
              {summaryError}
            </div>
          ) : null}
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

        {/* Referral Analytics */}
        <div className="border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden">
          <div className="border-b border-zinc-800 bg-[#1e1e1e] px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
              Referral Analytics
            </h2>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200"
              />
              <span className="text-zinc-500">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200"
              />
              <button
                onClick={handleApplyRange}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded px-2 py-1 transition"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {referralError && (
              <p className="text-[11px] text-red-400">{referralError}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="border border-zinc-800 rounded p-2 bg-[#1e1e1e]">
                <p className="text-[10px] uppercase text-zinc-500">Signups</p>
                <p className="text-lg font-mono text-zinc-100">
                  {loadingReferrals
                    ? "..."
                    : referralAnalytics?.totalSignups ?? 0}
                </p>
              </div>
              <div className="border border-zinc-800 rounded p-2 bg-[#1e1e1e]">
                <p className="text-[10px] uppercase text-zinc-500">Purchases</p>
                <p className="text-lg font-mono text-zinc-100">
                  {loadingReferrals
                    ? "..."
                    : referralAnalytics?.totalTicketPurchases ?? 0}
                </p>
              </div>
              <div className="border border-zinc-800 rounded p-2 bg-[#1e1e1e]">
                <p className="text-[10px] uppercase text-zinc-500">Conversions</p>
                <p className="text-lg font-mono text-zinc-100">
                  {loadingReferrals
                    ? "..."
                    : referralAnalytics?.totalConversions ?? 0}
                </p>
              </div>
              <div className="border border-zinc-800 rounded p-2 bg-[#1e1e1e]">
                <p className="text-[10px] uppercase text-zinc-500">Referrers</p>
                <p className="text-lg font-mono text-zinc-100">
                  {loadingReferrals
                    ? "..."
                    : referralAnalytics?.uniqueReferrers ?? 0}
                </p>
              </div>
            </div>

            <div className="border border-zinc-800 rounded overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-[#1e1e1e]">
                <p className="text-[10px] uppercase text-zinc-500 font-bold">
                  Top Referrers
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto hide-scrollbar">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/50">
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Email</th>
                      <th className="text-right px-3 py-2">Signups</th>
                      <th className="text-right px-3 py-2">Purchases</th>
                      <th className="text-right px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(referralAnalytics?.topReferrers || []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-4 text-center text-zinc-500 text-[11px]"
                        >
                          {loadingReferrals
                            ? "Loading referral data..."
                            : "No referral conversions found for this range."}
                        </td>
                      </tr>
                    ) : (
                      (referralAnalytics?.topReferrers || []).map((row) => (
                        <tr
                          key={row.referrerUserId}
                          className="border-b border-zinc-800 hover:bg-zinc-900/60"
                        >
                          <td className="px-3 py-2 text-zinc-200">
                            {row.referrerName || "Unknown"}
                          </td>
                          <td className="px-3 py-2 text-zinc-400">
                            {row.referrerEmail || "-"}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-200 font-mono">
                            {row.signupConversions ?? 0}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-200 font-mono">
                            {row.ticketPurchaseConversions ?? 0}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-100 font-mono font-semibold">
                            {row.totalConversions ?? 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
                → View Messages
              </p>
              <p className="text-zinc-500 text-[10px]">
                Message inbox is still using local mock data
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
