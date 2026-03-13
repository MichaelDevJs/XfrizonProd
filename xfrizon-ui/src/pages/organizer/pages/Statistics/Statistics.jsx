import { useState, Fragment } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Statistics = () => {
  const navigate = useNavigate();
  const [activeTable, setActiveTable] = useState("monthly");
  const [expandedMonth, setExpandedMonth] = useState(null);

  // Mock data
  const monthlyData = [
    {
      month: "Jan",
      revenue: 1200,
      tickets: 34,
      attendance: 28,
      noShow: 6,
      interest: 245,
      followers: 1200,
    },
    {
      month: "Feb",
      revenue: 1900,
      tickets: 52,
      attendance: 47,
      noShow: 5,
      interest: 380,
      followers: 1450,
    },
    {
      month: "Mar",
      revenue: 1500,
      tickets: 41,
      attendance: 36,
      noShow: 5,
      interest: 310,
      followers: 1650,
    },
    {
      month: "Apr",
      revenue: 2200,
      tickets: 63,
      attendance: 58,
      noShow: 5,
      interest: 420,
      followers: 1850,
    },
    {
      month: "May",
      revenue: 2800,
      tickets: 78,
      attendance: 71,
      noShow: 7,
      interest: 510,
      followers: 2100,
    },
    {
      month: "Jun",
      revenue: 2390,
      tickets: 67,
      attendance: 61,
      noShow: 6,
      interest: 450,
      followers: 2300,
    },
    {
      month: "Jul",
      revenue: 3490,
      tickets: 95,
      attendance: 88,
      noShow: 7,
      interest: 620,
      followers: 2650,
    },
    {
      month: "Aug",
      revenue: 3100,
      tickets: 87,
      attendance: 79,
      noShow: 8,
      interest: 580,
      followers: 2850,
    },
    {
      month: "Sep",
      revenue: 2800,
      tickets: 75,
      attendance: 68,
      noShow: 7,
      interest: 510,
      followers: 3000,
    },
    {
      month: "Oct",
      revenue: 3200,
      tickets: 88,
      attendance: 81,
      noShow: 7,
      interest: 580,
      followers: 3200,
    },
    {
      month: "Nov",
      revenue: 3900,
      tickets: 105,
      attendance: 97,
      noShow: 8,
      interest: 720,
      followers: 3500,
    },
    {
      month: "Dec",
      revenue: 4200,
      tickets: 112,
      attendance: 104,
      noShow: 8,
      interest: 780,
      followers: 3850,
    },
  ];

  const frequentBuyers = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      purchases: 15,
      totalSpent: 3750,
      lastPurchase: "2026-02-19",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      purchases: 12,
      totalSpent: 3000,
      lastPurchase: "2026-02-18",
    },
    {
      id: 3,
      name: "Carol Williams",
      email: "carol@example.com",
      purchases: 10,
      totalSpent: 2500,
      lastPurchase: "2026-02-17",
    },
    {
      id: 4,
      name: "David Brown",
      email: "david@example.com",
      purchases: 9,
      totalSpent: 2250,
      lastPurchase: "2026-02-16",
    },
    {
      id: 5,
      name: "Eve Davis",
      email: "eve@example.com",
      purchases: 8,
      totalSpent: 2000,
      lastPurchase: "2026-02-15",
    },
  ];

  const recentSales = [
    {
      id: 1,
      ticketNumber: "TKT-001",
      buyerName: "John Doe",
      event: "Summer Festival",
      date: "2026-02-20",
      amount: 50,
      tier: "Premium",
    },
    {
      id: 2,
      ticketNumber: "TKT-002",
      buyerName: "Jane Smith",
      event: "Tech Conference",
      date: "2026-02-19",
      amount: 75,
      tier: "VIP",
    },
    {
      id: 3,
      ticketNumber: "TKT-003",
      buyerName: "Mike Johnson",
      event: "Summer Festival",
      date: "2026-02-18",
      amount: 50,
      tier: "Standard",
    },
    {
      id: 4,
      ticketNumber: "TKT-004",
      buyerName: "Sarah Wilson",
      event: "Art Exhibition",
      date: "2026-02-17",
      amount: 35,
      tier: "Standard",
    },
    {
      id: 5,
      ticketNumber: "TKT-005",
      buyerName: "Tom Harris",
      event: "Tech Conference",
      date: "2026-02-16",
      amount: 75,
      tier: "VIP",
    },
  ];

  const downloadMonthData = (month) => {
    const monthData = monthlyData.find((d) => d.month === month);
    if (monthData) {
      const csvContent = [
        [
          "Month",
          "Revenue",
          "Tickets Sold",
          "Attendance",
          "Didn't Show Up",
          "Interest",
          "Followers",
        ],
        [
          monthData.month,
          monthData.revenue,
          monthData.tickets,
          monthData.attendance,
          monthData.noShow,
          monthData.interest,
          monthData.followers,
        ],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `monthly-${monthData.month.toLowerCase()}-${new Date().getTime()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Data downloaded!");
    }
  };

  const downloadAllMonthly = () => {
    const csvContent = [
      [
        "Month",
        "Revenue",
        "Tickets",
        "Attendance",
        "No-Show",
        "Interest",
        "Followers",
      ],
      ...monthlyData.map((row) => [
        row.month,
        row.revenue,
        row.tickets,
        row.attendance,
        row.noShow,
        row.interest,
        row.followers,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monthly-all-${new Date().getTime()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("All data downloaded!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/organizer/dashboard")}
          className="p-2 hover:bg-zinc-800 rounded transition-colors"
          title="Back"
        >
          <FaArrowLeft className="w-4 h-4 text-gray-400 hover:text-gray-300" />
        </button>
        <div>
          <h1 className="text-3xl font-light text-gray-200">Statistics</h1>
          <p className="text-gray-500 font-light text-sm mt-1">
            Comprehensive analytics
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="border border-zinc-700 rounded p-4 bg-[#1e1e1e]">
          <p className="text-xs text-gray-500 font-light mb-2">Total Revenue</p>
          <p className="text-2xl font-light text-lime-400">
            $
            {monthlyData
              .reduce((sum, m) => sum + m.revenue, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="border border-zinc-700 rounded p-4 bg-[#1e1e1e]">
          <p className="text-xs text-gray-500 font-light mb-2">Tickets Sold</p>
          <p className="text-2xl font-light text-cyan-400">
            {monthlyData.reduce((sum, m) => sum + m.tickets, 0)}
          </p>
        </div>
        <div className="border border-zinc-700 rounded p-4 bg-[#1e1e1e]">
          <p className="text-xs text-gray-500 font-light mb-2">
            Attendance Rate
          </p>
          <p className="text-2xl font-light text-green-400">
            {Math.round(
              (monthlyData.reduce((sum, m) => sum + m.attendance, 0) /
                monthlyData.reduce((sum, m) => sum + m.tickets, 0)) *
                100,
            )}
            %
          </p>
        </div>
      </div>

      {/* Table Navigation */}
      <div className="flex gap-2 border-b border-zinc-800 mb-6">
        {["monthly", "buyers", "sales"].map((table) => {
          const isDisabled = table === "buyers";
          return (
            <button
              key={table}
              onClick={() => !isDisabled && setActiveTable(table)}
              disabled={isDisabled}
              className={`px-4 py-2 text-sm font-light transition-colors border-b-2 ${
                isDisabled
                  ? "text-gray-600 border-transparent cursor-not-allowed opacity-50"
                  : activeTable === table
                    ? "text-gray-200 border-zinc-500"
                    : "text-gray-500 border-transparent hover:text-gray-400"
              }`}
            >
              {table === "monthly"
                ? "Monthly Sales"
                : table === "buyers"
                  ? "Frequent Buyers"
                  : "Recent Sales"}
            </button>
          );
        })}
      </div>

      {/* Monthly Sales Table */}
      {activeTable === "monthly" && (
        <div className="border border-zinc-700 rounded overflow-hidden">
          <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
            <h3 className="font-light text-white text-sm">
              Monthly Sales & Engagement
            </h3>
            <button
              onClick={downloadAllMonthly}
              className="px-3 py-1 text-xs font-light text-gray-400 border border-zinc-700 rounded hover:border-zinc-600 transition-colors"
            >
              📥 Download All
            </button>
          </div>
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="text-left p-4 text-gray-500 font-light text-xs">
                    Month
                  </th>
                  <th className="text-left p-4 text-gray-500 font-light text-xs">
                    Revenue
                  </th>
                  <th className="text-left p-4 text-gray-500 font-light text-xs">
                    Tickets
                  </th>
                  <th className="text-left p-4 text-gray-500 font-light text-xs">
                    Attended
                  </th>
                  <th className="text-left p-4 text-gray-500 font-light text-xs">
                    No-Show
                  </th>
                  <th className="text-left p-4 text-gray-500 font-light text-xs">
                    Interest
                  </th>
                  <th className="text-left p-4 text-gray-500 font-light text-xs">
                    Followers
                  </th>
                  <th className="text-left p-4 text-gray-500 font-light text-xs">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row, idx) => {
                  const attendanceRate = Math.round(
                    (row.attendance / row.tickets) * 100,
                  );
                  const noShowRate = Math.round(
                    (row.noShow / row.tickets) * 100,
                  );

                  return (
                    <Fragment key={idx}>
                      <tr className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors bg-[#1e1e1e]">
                        <td className="p-4 text-gray-300 font-light">
                          {row.month}
                        </td>
                        <td className="p-4 text-lime-400 font-light">
                          ${row.revenue.toLocaleString()}
                        </td>
                        <td className="p-4 text-cyan-400 font-light">
                          {row.tickets}
                        </td>
                        <td className="p-4 text-green-400 font-light text-xs">
                          {row.attendance} ({attendanceRate}%)
                        </td>
                        <td className="p-4 text-yellow-400 font-light text-xs">
                          {row.noShow} ({noShowRate}%)
                        </td>
                        <td className="p-4 text-purple-400 font-light">
                          {row.interest}
                        </td>
                        <td className="p-4 text-blue-400 font-light">
                          {row.followers}
                        </td>
                        <td className="p-4 flex gap-1">
                          <button
                            onClick={() =>
                              setExpandedMonth(
                                expandedMonth === row.month ? null : row.month,
                              )
                            }
                            className="px-2 py-1 text-xs font-light text-gray-400 border border-zinc-700 rounded hover:border-zinc-600 transition-colors"
                            title="View details"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => downloadMonthData(row.month)}
                            className="px-2 py-1 text-xs font-light text-gray-400 border border-zinc-700 rounded hover:border-zinc-600 transition-colors"
                            title="Download"
                          >
                            📥
                          </button>
                        </td>
                      </tr>
                      {expandedMonth === row.month && (
                        <tr className="border-b border-zinc-800 bg-[#1e1e1e]">
                          <td colSpan="8" className="p-4">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="border border-zinc-700 rounded p-3 bg-[#1e1e1e]">
                                <p className="text-gray-500 font-light mb-1">
                                  Total Tickets
                                </p>
                                <p className="text-2xl font-light text-cyan-400">
                                  {row.tickets}
                                </p>
                              </div>
                              <div className="border border-zinc-700 rounded p-3 bg-[#1e1e1e]">
                                <p className="text-gray-500 font-light mb-1">
                                  Attendance
                                </p>
                                <p className="text-2xl font-light text-green-400">
                                  {row.attendance}
                                </p>
                                <p className="text-xs text-green-500 mt-1">
                                  {attendanceRate}% show rate
                                </p>
                              </div>
                              <div className="border border-zinc-700 rounded p-3 bg-[#1e1e1e]">
                                <p className="text-gray-500 font-light mb-1">
                                  Didn't Show Up
                                </p>
                                <p className="text-2xl font-light text-yellow-400">
                                  {row.noShow}
                                </p>
                                <p className="text-xs text-yellow-500 mt-1">
                                  {noShowRate}% no-show rate
                                </p>
                              </div>
                              <div className="border border-zinc-700 rounded p-3 bg-[#1e1e1e]">
                                <p className="text-gray-500 font-light mb-1">
                                  Engagement
                                </p>
                                <div className="space-y-1">
                                  <p className="text-gray-300">
                                    Interest:{" "}
                                    <span className="text-purple-400">
                                      {row.interest}
                                    </span>
                                  </p>
                                  <p className="text-gray-300">
                                    Followers:{" "}
                                    <span className="text-blue-400">
                                      {row.followers}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Frequent Buyers Table */}
      {activeTable === "buyers" && (
        <div className="border border-zinc-700 rounded overflow-hidden opacity-50 pointer-events-none">
          <div className="p-12 text-center">
            <p className="text-sm font-light text-gray-400 mb-2">Coming Soon</p>
            <p className="text-xs text-gray-500 font-light">
              Frequent Buyers analytics will be available soon
            </p>
          </div>
        </div>
      )}

      {/* Recent Sales Table */}
      {activeTable === "sales" && (
        <div className="border border-zinc-700 rounded overflow-hidden opacity-50 pointer-events-none group relative">
          <div className="p-12 text-center">
            <p className="text-sm font-light text-gray-400 mb-2">Coming Soon</p>
            <p className="text-xs text-gray-500 font-light">
              Recent Sales analytics will be available soon
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-center">
              <p className="text-sm font-light text-gray-300">ℹ️ Coming Soon</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
