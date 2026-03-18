import React, { useState, useEffect } from "react";
import {
  FaDollarSign,
  FaDownload,
  FaCalendar,
  FaSpinner,
  FaInfoCircle,
  FaBell,
  FaTimes,
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [eventPayoutPreview, setEventPayoutPreview] = useState([]);
  const [eventPayoutLoading, setEventPayoutLoading] = useState(false);
  const [payoutAlerts, setPayoutAlerts] = useState([]);

  useEffect(() => {
    fetchPayoutReport();
  }, [dateRange]);

  useEffect(() => {
    fetchEventPayoutPreview();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const interval = window.setInterval(() => {
      fetchEventPayoutPreview({ silent: true });
    }, 90000);

    return () => window.clearInterval(interval);
  }, [user?.id]);

  // Auto-apply custom range when both dates are selected and valid
  useEffect(() => {
    if (dateRange === "custom" && customFrom && customTo) {
      // Validate that end date is not before start date
      if (new Date(customTo) >= new Date(customFrom)) {
        fetchPayoutReport();
      }
    }
  }, [customFrom, customTo]);

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
      // Use isRefreshing for filter changes to avoid scrolling
      if (payoutReport) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
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
      setIsRefreshing(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString();
  };

  const fetchEventPayoutPreview = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setEventPayoutLoading(true);
      }
      const response = await organizerApi.getEventPayoutPreview();
      const rows =
        response?.success && Array.isArray(response?.data) ? response.data : [];
      setEventPayoutPreview(rows);

      const storageKey = user?.id
        ? `xf-organizer-payout-status-${user.id}`
        : null;

      if (storageKey) {
        let previousSnapshot = {};
        try {
          previousSnapshot = JSON.parse(
            localStorage.getItem(storageKey) || "{}",
          );
        } catch {
          previousSnapshot = {};
        }

        const nextSnapshot = {};
        const statusAlerts = [];

        rows.forEach((item) => {
          const rowKey = String(
            item?.payoutId ??
              `${item?.eventId || "event"}-${item?.currency || "USD"}`,
          );

          nextSnapshot[rowKey] = {
            status: item?.status || "",
            eventTitle: item?.eventTitle || "Event",
          };

          const previous = previousSnapshot?.[rowKey];
          if (!previous || previous.status === item?.status) {
            return;
          }

          const baseAlert = {
            id: `${Date.now()}-${rowKey}-${item?.status || "status"}`,
            title: item?.eventTitle || "Event payout",
            message: `Payout status changed from ${previous.status} to ${item?.status}.`,
          };

          if (item?.status === "PAID") {
            statusAlerts.push({ ...baseAlert, type: "success" });
          } else if (item?.status === "FAILED") {
            statusAlerts.push({ ...baseAlert, type: "error" });
          } else {
            statusAlerts.push({ ...baseAlert, type: "info" });
          }
        });

        if (statusAlerts.length > 0) {
          setPayoutAlerts((prev) => [...statusAlerts, ...prev].slice(0, 5));
        }

        localStorage.setItem(storageKey, JSON.stringify(nextSnapshot));
      }
    } catch (err) {
      console.error("Error fetching event payout preview:", err);
      setEventPayoutPreview([]);
    } finally {
      if (!silent) {
        setEventPayoutLoading(false);
      }
    }
  };

  const dismissPayoutAlert = (alertId) => {
    setPayoutAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  const clearAllPayoutAlerts = () => {
    setPayoutAlerts([]);
  };

  const handleClearCustomRange = () => {
    setCustomFrom("");
    setCustomTo("");
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light text-gray-200 mb-2">
              Finance
            </h1>
            <p className="text-gray-500 font-light">
              Track your earnings and payout report
            </p>
          </div>
          {isRefreshing && (
            <FaSpinner className="w-5 h-5 text-xf-accent animate-spin" />
          )}
        </div>
        <button
          type="button"
          onClick={exportToCSV}
          disabled={!payoutReport?.payoutSummary?.length}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-xf-accent hover:brightness-110 text-white rounded-lg font-light text-sm flex items-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaDownload className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {loading && !payoutReport && (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="w-8 h-8 text-xf-accent animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 p-4 text-red-400">
          {error}
        </div>
      )}

      {payoutAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Payout updates</p>
            <button
              type="button"
              onClick={clearAllPayoutAlerts}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Clear all
            </button>
          </div>
          {payoutAlerts.map((alert) => {
            const toneClass =
              alert.type === "success"
                ? "border-green-700 bg-green-500/10 text-green-300"
                : alert.type === "error"
                  ? "border-red-700 bg-red-500/10 text-red-300"
                  : "border-blue-700 bg-blue-500/10 text-blue-300";

            return (
              <div
                key={alert.id}
                className={`border rounded-lg px-4 py-3 ${toneClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <FaBell className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs opacity-90">{alert.message}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissPayoutAlert(alert.id)}
                    className="opacity-80 hover:opacity-100"
                    aria-label="Dismiss payout update"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(payoutReport || !loading) && (
        <>
          <div className="border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg text-gray-200">Event Payout Preview</h2>
                <p className="text-xs text-gray-500">
                  Payouts are released next day after event ends.
                </p>
              </div>
              {eventPayoutLoading ? (
                <FaSpinner className="w-4 h-4 text-xf-accent animate-spin" />
              ) : null}
            </div>

            <div className="overflow-x-auto">
              {eventPayoutPreview.length === 0 ? (
                <div className="text-sm text-gray-500 py-4">
                  No event payout entries yet.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-zinc-800">
                      <th className="py-2 pr-4">Event</th>
                      <th className="py-2 pr-4">Net Payout</th>
                      <th className="py-2 pr-4">Release At</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventPayoutPreview.map((item) => (
                      <tr
                        key={
                          item.payoutId || `${item.eventId}-${item.currency}`
                        }
                        className="border-b border-zinc-900"
                      >
                        <td className="py-2 pr-4 text-gray-200">
                          {item.eventTitle}
                        </td>
                        <td className="py-2 pr-4 text-green-400">
                          {formatCurrency(item.netPayout, item.currency)}
                        </td>
                        <td className="py-2 pr-4 text-gray-300">
                          {formatDateTime(item.releaseAt)}
                        </td>
                        <td className="py-2 pr-4 text-gray-200">
                          {item.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Financial Cards */}
          <div className="border border-zinc-800 bg-zinc-900/80 p-3 sm:p-4 overflow-x-auto hide-scrollbar">
            <div className="flex min-w-max gap-3 sm:gap-4">
              <div className="w-56 shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 p-4 sm:p-5">
                <p className="text-xs font-light text-gray-400 mb-2">
                  Gross Revenue
                </p>
                <p className="text-xl sm:text-2xl font-light text-emerald-400 wrap-break-word">
                  {formatCurrency(
                    totals.totalGrossRevenue,
                    payoutReport?.currency,
                  )}
                </p>
              </div>
              <div className="w-56 shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 p-4 sm:p-5">
                <p className="text-xs font-light text-gray-400 mb-2">
                  Tickets Sold
                </p>
                <p className="text-xl sm:text-2xl font-light text-sky-400">
                  {totals.totalTicketsSold || 0}
                </p>
              </div>
              <div className="w-56 shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 p-4 sm:p-5">
                <p className="text-xs font-light text-gray-400 mb-2">
                  Service Fee (10%)
                </p>
                <p className="text-xl sm:text-2xl font-light text-amber-400 wrap-break-word">
                  {formatCurrency(
                    totals.totalServiceFee,
                    payoutReport?.currency,
                  )}
                </p>
              </div>
              <div className="w-56 shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 p-4 sm:p-5">
                <p className="text-xs font-light text-gray-400 mb-2">
                  Net Earnings
                </p>
                <p className="text-xl sm:text-2xl font-light text-violet-400 wrap-break-word">
                  {formatCurrency(
                    totals.totalNetForOrganizer,
                    payoutReport?.currency,
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Payout Settings */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-light text-gray-200">
                Payout Settings
              </h2>
              <div className="group relative">
                <FaInfoCircle className="w-4 h-4 text-gray-500 cursor-help" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-3 bg-zinc-900 border border-zinc-600 rounded-lg text-xs text-gray-300 font-normal shadow-xl z-50">
                  Configure how you receive earnings from ticket sales. Choose
                  between automatic Stripe transfers or manual bank payouts.
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                  Stripe Payouts
                </p>
                {user?.id && (
                  <StripeConnectSetup organizerId={user.id} organizer={user} />
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                  Bank Details
                </p>
                <BankDetailsForm />
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="bg-zinc-900 border border-zinc-800 p-3">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
              Date Range
            </p>
            <div className="space-y-2">
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  if (e.target.value !== "custom") {
                    setCustomFrom("");
                    setCustomTo("");
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-gray-300 rounded text-xs focus:border-xf-accent focus:outline-none"
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateRange === "custom" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        From
                      </label>
                      <input
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        max={customTo || undefined}
                        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 text-gray-300 rounded text-xs focus:border-xf-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        To
                      </label>
                      <input
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        min={customFrom || undefined}
                        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 text-gray-300 rounded text-xs focus:border-xf-accent focus:outline-none"
                      />
                    </div>
                  </div>
                  {customFrom && customTo && (
                    <div className="flex items-center justify-between text-xs">
                      {new Date(customTo) < new Date(customFrom) ? (
                        <p className="text-red-400">
                          End date must be after start date
                        </p>
                      ) : (
                        <p className="text-green-400 flex items-center gap-1">
                          <FaInfoCircle className="w-3 h-3" />
                          Auto-applied
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleClearCustomRange}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payout Summary */}
          {!payoutReport?.payoutSummary?.length ? (
            <div className="bg-zinc-900 border border-zinc-800 p-6 text-center">
              <FaDollarSign className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-light">
                No payout data for selected period
              </p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-gray-200">
                    Payout Breakdown
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {payoutReport.payoutSummary[0]?.cadence === "WEEKLY"
                      ? "Weekly"
                      : "Monthly"}{" "}
                    schedule
                  </p>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto hide-scrollbar">
                <div className="overflow-x-auto hide-scrollbar">
                  <table className="w-full min-w-190 text-xs font-light">
                    <thead className="border-b border-zinc-700 bg-zinc-900 sticky top-0">
                      <tr>
                        <th className="text-left py-2 px-3 text-gray-400">
                          Period
                        </th>
                        <th className="text-right py-2 px-3 text-gray-400">
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
                        <th className="text-right py-2 px-3 text-gray-400">
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
                        <th className="text-right py-2 px-3 text-gray-400">
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
                        <th className="text-right py-2 px-3 text-gray-400">
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
                          <td className="py-2 px-3 text-gray-300 whitespace-nowrap">
                            {formatPeriodLabel(window)}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-300">
                            {window.totalTicketsSold}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-300">
                            {formatCurrency(
                              window.grossRevenue,
                              payoutReport.currency,
                            )}
                          </td>
                          <td className="py-2 px-3 text-right text-yellow-400">
                            -
                            {formatCurrency(
                              window.serviceFeeTotal,
                              payoutReport.currency,
                            )}
                          </td>
                          <td className="py-2 px-3 text-right text-green-400 font-medium">
                            {formatCurrency(
                              window.netForOrganizer,
                              payoutReport.currency,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-zinc-700 bg-zinc-800/50 sticky bottom-0">
                      <tr className="font-medium">
                        <td className="py-2.5 px-3 text-gray-200">Total</td>
                        <td className="py-2.5 px-3 text-right text-gray-200">
                          {displayedTicketsTotal}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-200">
                          {formatCurrency(
                            totals.totalGrossRevenue,
                            payoutReport.currency,
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-yellow-400">
                          -
                          {formatCurrency(
                            totals.totalServiceFee,
                            payoutReport.currency,
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-green-400 text-sm">
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
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrganizerFinance;
