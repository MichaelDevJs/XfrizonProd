import React, { useState, useEffect } from "react";
import {
  FaDollarSign,
  FaDownload,
  FaCalendar,
  FaSpinner,
  FaInfoCircle,
} from "react-icons/fa";
import StripeConnectSetup from "../../component/organizer/StripeConnectSetup";
import BankDetailsForm from "../../component/organizer/BankDetailsForm";
import { useAuth } from "../../hooks/useAuth";
import organizerApi from "../../api/organizerApi";

const OrganizerFinance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payoutReport, setPayoutReport] = useState(null);
  const [dateRange, setDateRange] = useState("3months");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    fetchPayoutReport();
  }, [dateRange]);

  const toDateKey = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split("T")[0];
  };

  const formatDateShort = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatWeekdayShort = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return weekdays[date.getDay()];
  };

  const getIsoWeekNumber = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    return Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
  };

  const formatPeriodLabel = (period) => {
    const start = period?.windowStart;
    const end = period?.windowEnd;

    if (!start || !end) return period?.window || "-";

    const startLabel = formatDateShort(start);
    const endLabel = formatDateShort(end);
    const startDay = formatWeekdayShort(start);
    const endDay = formatWeekdayShort(end);

    if (period?.cadence === "WEEKLY") {
      const weekNumber = getIsoWeekNumber(start);
      return `Week ${weekNumber ?? "-"}: ${startDay} ${startLabel} - ${endDay} ${endLabel}`;
    }

    return `${startDay} ${startLabel} - ${endDay} ${endLabel}`;
  };

  const generateAllPeriods = (fromDate, toDate, cadence = "WEEKLY") => {
    if (!fromDate || !toDate) return [];

    const periods = [];
    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (cadence === "WEEKLY") {
      const current = new Date(start);
      const day = current.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      current.setDate(current.getDate() + diff);

      while (current <= end) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const periodEnd = weekEnd > end ? end : weekEnd;

        periods.push({
          window: `${weekStart.toISOString().split("T")[0]} - ${periodEnd.toISOString().split("T")[0]}`,
          windowStart: `${weekStart.toISOString().split("T")[0]}T00:00:00`,
          windowEnd: `${periodEnd.toISOString().split("T")[0]}T23:59:59`,
          cadence: "WEEKLY",
          totalTicketsSold: 0,
          grossRevenue: 0,
          serviceFeeTotal: 0,
          netForOrganizer: 0,
        });

        current.setDate(current.getDate() + 7);
      }
    } else {
      const current = new Date(start.getFullYear(), start.getMonth(), 1);

      while (current <= end) {
        const monthStart = new Date(current);
        const monthEnd = new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          0,
        );
        const periodEnd = monthEnd > end ? end : monthEnd;

        periods.push({
          window: `${monthStart.toISOString().split("T")[0]} - ${periodEnd.toISOString().split("T")[0]}`,
          windowStart: `${monthStart.toISOString().split("T")[0]}T00:00:00`,
          windowEnd: `${periodEnd.toISOString().split("T")[0]}T23:59:59`,
          cadence: "MONTHLY",
          totalTicketsSold: 0,
          grossRevenue: 0,
          serviceFeeTotal: 0,
          netForOrganizer: 0,
        });

        current.setMonth(current.getMonth() + 1);
      }
    }

    return periods;
  };

  const mergePayoutData = (allPeriods, actualData) => {
    if (!actualData || actualData.length === 0) return allPeriods;

    const actualByStart = new Map();
    actualData.forEach((item) => {
      const key = toDateKey(item.windowStart);
      if (key) actualByStart.set(key, item);
    });

    return allPeriods.map((period) => {
      const key = toDateKey(period.windowStart);
      const actual = key ? actualByStart.get(key) : null;
      if (!actual) return period;

      return {
        ...period,
        totalTicketsSold: actual.totalTicketsSold ?? 0,
        grossRevenue: actual.grossRevenue ?? 0,
        serviceFeeTotal: actual.serviceFeeTotal ?? 0,
        netForOrganizer: actual.netForOrganizer ?? 0,
        paymentRecordsCount: actual.paymentRecordsCount ?? 0,
        avgPricePerTicket: actual.avgPricePerTicket ?? 0,
      };
    });
  };

  const fetchPayoutReport = async () => {
    try {
      setLoading(true);
      setError(null);

      let fromDate = null;
      let toDate = null;

      const now = new Date();
      const formatDate = (date) => date.toISOString().split(".")[0];

      switch (dateRange) {
        case "thisMonth":
          fromDate = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
          toDate = formatDate(now);
          break;
        case "lastMonth":
          fromDate = formatDate(
            new Date(now.getFullYear(), now.getMonth() - 1, 1),
          );
          toDate = formatDate(
            new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
          );
          break;
        case "3months":
          fromDate = formatDate(
            new Date(now.getFullYear(), now.getMonth() - 3, 1),
          );
          toDate = formatDate(now);
          break;
        case "custom":
          if (customFrom && customTo) {
            fromDate = new Date(customFrom).toISOString().split(".")[0];
            toDate = new Date(customTo + "T23:59:59")
              .toISOString()
              .split(".")[0];
          }
          break;
        default:
          break;
      }

      const response = await organizerApi.getPayoutReport(fromDate, toDate);
      if (response.success) {
        // If we have actual data, use it directly with filled gaps
        if (
          response.data.payoutSummary &&
          response.data.payoutSummary.length > 0
        ) {
          const cadence = response.data.payoutSummary[0].cadence || "WEEKLY";
          const allPeriods = generateAllPeriods(fromDate, toDate, cadence);
          const mergedSummary = mergePayoutData(
            allPeriods,
            response.data.payoutSummary,
          );

          setPayoutReport({
            ...response.data,
            payoutSummary: mergedSummary,
          });
        } else {
          // No data, just show empty periods
          const allPeriods = generateAllPeriods(fromDate, toDate, "WEEKLY");
          setPayoutReport({
            currency: response.data.currency || "USD",
            payoutSummary: allPeriods,
            totals: {
              totalGrossRevenue: 0,
              totalServiceFee: 0,
              totalNetForOrganizer: 0,
              totalPaymentRecords: 0,
              totalTicketsSold: 0,
            },
          });
        }
      } else {
        setError(response.message || "Failed to fetch payout report");
      }
    } catch (err) {
      console.error("Error fetching payout report:", err);
      setError(err.message || "Failed to fetch payout report");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateSubmit = () => {
    if (customFrom && customTo) {
      setDateRange("custom");
    }
  };

  const formatCurrency = (amount, currency) => {
    if (!amount || !currency) return "0.00";
    const symbols = {
      NGN: "₦",
      USD: "$",
      GBP: "£",
      EUR: "€",
      KES: "KSh",
      ZAR: "R",
      GHS: "GH₵",
    };
    // Amount is in major units (e.g., 1200.00 for $1200), not cents
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${symbols[currency] || currency}${formatted}`;
  };

  const exportToCSV = () => {
    if (!payoutReport?.payoutSummary) return;

    const headers = [
      "Window",
      "Cadence",
      "Tickets Sold",
      "Gross Revenue",
      "Service Fee",
      "Net Amount",
    ];
    const rows = payoutReport.payoutSummary.map((window) => [
      formatPeriodLabel(window),
      window.cadence,
      window.totalTicketsSold,
      formatCurrency(window.grossRevenue, payoutReport.currency),
      formatCurrency(window.serviceFeeTotal, payoutReport.currency),
      formatCurrency(window.netForOrganizer, payoutReport.currency),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totals = payoutReport?.totals || {
    totalGrossRevenue: 0,
    totalServiceFee: 0,
    totalNetForOrganizer: 0,
    totalPaymentRecords: 0,
    totalTicketsSold: 0,
  };

  const displayedTicketsTotal = (payoutReport?.payoutSummary || []).reduce(
    (sum, period) => sum + (period.totalTicketsSold || 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-light text-gray-200 mb-2">Finance</h1>
          <p className="text-gray-500 font-light">
            Track your earnings and payout report
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={!payoutReport?.payoutSummary?.length}
          className="px-4 py-2 bg-xf-accent hover:brightness-110 text-white rounded-lg font-light text-sm flex items-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaDownload className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="w-8 h-8 text-xf-accent animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {!loading && (
        <>
          {/* Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <p className="text-xs font-light text-green-100 mb-2">
                Gross Revenue
              </p>
              <p className="text-3xl font-light">
                {formatCurrency(
                  totals.totalGrossRevenue,
                  payoutReport?.currency,
                )}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
              <p className="text-xs font-light text-blue-100 mb-2">
                Tickets Sold
              </p>
              <p className="text-3xl font-light">
                {totals.totalTicketsSold || 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white">
              <p className="text-xs font-light text-yellow-100 mb-2">
                Service Fee (10%)
              </p>
              <p className="text-3xl font-light">
                {formatCurrency(totals.totalServiceFee, payoutReport?.currency)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
              <p className="text-xs font-light text-indigo-100 mb-2">
                Net Earnings
              </p>
              <p className="text-3xl font-light">
                {formatCurrency(
                  totals.totalNetForOrganizer,
                  payoutReport?.currency,
                )}
              </p>
            </div>
          </div>

          {/* Payout Settings */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-2xl font-light text-gray-200 mb-4">
              Payout Settings
            </h2>
            <p className="text-gray-500 font-light mb-6">
              Configure how you receive payments from ticket sales
            </p>
            {user?.id && (
              <StripeConnectSetup organizerId={user.id} organizer={user} />
            )}

            {/* Bank Details for Manual Payout */}
            <BankDetailsForm />
          </div>

          {/* Date Filter */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setDateRange("thisMonth")}
              className={`px-4 py-2 bg-zinc-900 border ${
                dateRange === "thisMonth"
                  ? "border-xf-accent"
                  : "border-zinc-800"
              } text-gray-300 rounded-lg font-light text-sm hover:border-xf-accent transition-all duration-300`}
            >
              <FaCalendar className="inline-block mr-2 w-4 h-4" />
              This Month
            </button>
            <button
              onClick={() => setDateRange("lastMonth")}
              className={`px-4 py-2 bg-zinc-900 border ${
                dateRange === "lastMonth"
                  ? "border-xf-accent"
                  : "border-zinc-800"
              } text-gray-300 rounded-lg font-light text-sm hover:border-xf-accent transition-all duration-300`}
            >
              Last Month
            </button>
            <button
              onClick={() => setDateRange("3months")}
              className={`px-4 py-2 bg-zinc-900 border ${
                dateRange === "3months" ? "border-xf-accent" : "border-zinc-800"
              } text-gray-300 rounded-lg font-light text-sm hover:border-xf-accent transition-all duration-300`}
            >
              Last 3 Months
            </button>

            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-gray-300 rounded-lg font-light text-sm focus:border-xf-accent focus:outline-none"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-gray-300 rounded-lg font-light text-sm focus:border-xf-accent focus:outline-none"
              />
              <button
                onClick={handleCustomDateSubmit}
                disabled={!customFrom || !customTo}
                className="px-4 py-2 bg-xf-accent hover:brightness-110 text-white rounded-lg font-light text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Payout Summary */}
          {!payoutReport?.payoutSummary?.length ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <FaDollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 font-light">
                No payout data for selected period
              </p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800">
                <h2 className="text-xl font-light text-gray-200">
                  Payout Breakdown
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {payoutReport.payoutSummary[0]?.cadence === "WEEKLY"
                    ? "Weekly"
                    : "Monthly"}{" "}
                  payout schedule
                </p>
              </div>
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full text-sm font-light">
                  <thead className="border-b border-zinc-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-gray-400">
                        Period
                      </th>
                      <th className="text-right py-3 px-4 text-gray-400">
                        <div className="flex items-center justify-end gap-1">
                          Tickets
                          <div className="group relative">
                            <FaInfoCircle className="w-3 h-3 text-gray-500 cursor-help" />
                            <div
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-48 p-2 bg-zinc-900 border border-zinc-600 rounded text-xs text-gray-300 font-normal shadow-xl"
                              style={{ zIndex: 9999 }}
                            >
                              Total individual tickets sold in this period
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 text-gray-400">
                        <div className="flex items-center justify-end gap-1">
                          Gross Revenue
                          <div className="group relative">
                            <FaInfoCircle className="w-3 h-3 text-gray-500 cursor-help" />
                            <div
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-56 p-2 bg-zinc-900 border border-zinc-600 rounded text-xs text-gray-300 font-normal shadow-xl"
                              style={{ zIndex: 9999 }}
                            >
                              Total amount paid by customers (ticket price +
                              service fee)
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 text-gray-400">
                        <div className="flex items-center justify-end gap-1">
                          Service Fee
                          <div className="group relative">
                            <FaInfoCircle className="w-3 h-3 text-gray-500 cursor-help" />
                            <div
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-52 p-2 bg-zinc-900 border border-zinc-600 rounded text-xs text-gray-300 font-normal shadow-xl"
                              style={{ zIndex: 9999 }}
                            >
                              Platform's 10% commission deducted from ticket
                              price
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 text-gray-400">
                        <div className="flex items-center justify-end gap-1">
                          Net Earnings
                          <div className="group relative">
                            <FaInfoCircle className="w-3 h-3 text-gray-500 cursor-help" />
                            <div
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-56 p-2 bg-zinc-900 border border-zinc-600 rounded text-xs text-gray-300 font-normal shadow-xl"
                              style={{ zIndex: 9999 }}
                            >
                              Amount you'll receive in your account (Gross -
                              Service Fee)
                            </div>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutReport.payoutSummary.map((window, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-300">
                          {formatPeriodLabel(window)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-300">
                          {window.totalTicketsSold}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-300">
                          {formatCurrency(
                            window.grossRevenue,
                            payoutReport.currency,
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-yellow-400">
                          -
                          {formatCurrency(
                            window.serviceFeeTotal,
                            payoutReport.currency,
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-green-400 font-medium">
                          {formatCurrency(
                            window.netForOrganizer,
                            payoutReport.currency,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-zinc-700 bg-zinc-800/50">
                    <tr className="font-medium">
                      <td className="py-4 px-4 text-gray-200">Total</td>
                      <td className="py-4 px-4 text-right text-gray-200">
                        {displayedTicketsTotal}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-200">
                        {formatCurrency(
                          totals.totalGrossRevenue,
                          payoutReport.currency,
                        )}
                      </td>
                      <td className="py-4 px-4 text-right text-yellow-400">
                        -
                        {formatCurrency(
                          totals.totalServiceFee,
                          payoutReport.currency,
                        )}
                      </td>
                      <td className="py-4 px-4 text-right text-green-400 text-lg">
                        {formatCurrency(
                          totals.totalNetForOrganizer,
                          payoutReport.currency,
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrganizerFinance;
