import React, { useState, useEffect } from "react";
import {
  getPendingPayouts,
  getEventPayoutPreview,
  holdEventPayout,
  releaseEventPayout,
  payEventPayoutNow,
  completeManualEventPayout,
  retryFailedEventPayout,
  retryAllFailedEventPayouts,
  markPayoutAsSent,
  cancelPayout,
} from "../../api/payoutApi";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaTimes,
  FaSpinner,
  FaMoneyBillWave,
  FaDownload,
  FaRedo,
} from "react-icons/fa";
import CreateManualPayoutModal from "../../component/admin/CreateManualPayoutModal";

export default function AdminPayoutManagement() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prefillPayout, setPrefillPayout] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [eventPayoutPreview, setEventPayoutPreview] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewStatus, setPreviewStatus] = useState("");
  const [manualQueueScope, setManualQueueScope] = useState("dueNow");

  useEffect(() => {
    loadPendingPayouts();
    loadEventPayoutPreview("");
  }, []);

  const loadPendingPayouts = async () => {
    try {
      setLoading(true);
      const response = await getPendingPayouts();
      const pageData = response.data || response;
      setPayouts(pageData?.content || []);
    } catch (error) {
      console.error("Error loading payouts:", error);
      setPayouts([]);
      if (error.message && !error.response) {
        toast.error(error.message);
        return;
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Your admin session expired. Please log in again.");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to load pending payouts",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const loadEventPayoutPreview = async (status = previewStatus) => {
    try {
      setPreviewLoading(true);
      const response = await getEventPayoutPreview(status || undefined);
      const rows = Array.isArray(response?.data) ? response.data : [];
      setEventPayoutPreview(rows);
    } catch (error) {
      console.error("Error loading payout preview:", error);
      setEventPayoutPreview([]);
      if (error.message && !error.response) {
        toast.error(error.message);
        return;
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Your admin session expired. Please log in again.");
      } else {
        toast.error(
          error.response?.data?.message ||
            "Failed to load event payout preview",
        );
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyPreviewFilter = () => {
    loadEventPayoutPreview(previewStatus);
  };

  const handleResetPreviewFilter = () => {
    setPreviewStatus("");
    loadEventPayoutPreview("");
  };

  const handleHoldEventPayout = async (payoutId) => {
    const reason =
      window.prompt("Reason for hold:", "Awaiting admin review") || "";
    try {
      setProcessing(`hold-${payoutId}`);
      await holdEventPayout(payoutId, reason);
      toast.success("Payout held");
      loadEventPayoutPreview();
    } catch (error) {
      console.error("Error holding event payout:", error);
      toast.error("Failed to hold payout");
    } finally {
      setProcessing(null);
    }
  };

  const handleReleaseEventPayout = async (payoutId) => {
    try {
      setProcessing(`release-${payoutId}`);
      await releaseEventPayout(payoutId);
      toast.success("Payout released");
      loadEventPayoutPreview();
    } catch (error) {
      console.error("Error releasing event payout:", error);
      toast.error("Failed to release payout");
    } finally {
      setProcessing(null);
    }
  };

  const handlePayNow = async (payoutId) => {
    try {
      setProcessing(`pay-${payoutId}`);
      await payEventPayoutNow(payoutId);
      toast.success("Payout processed");
      loadEventPayoutPreview();
    } catch (error) {
      console.error("Error processing payout:", error);
      toast.error("Failed to process payout");
    } finally {
      setProcessing(null);
    }
  };

  const handleCompleteManualPayout = async (payoutId) => {
    try {
      setProcessing(`manual-complete-${payoutId}`);
      await completeManualEventPayout(payoutId);
      toast.success("Manual payout marked as completed");
      loadEventPayoutPreview();
    } catch (error) {
      console.error("Error completing manual payout:", error);
      toast.error(
        error?.response?.data?.message || "Failed to complete manual payout",
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleRetryFailedPayout = async (payoutId) => {
    try {
      setProcessing(`retry-${payoutId}`);
      await retryFailedEventPayout(payoutId);
      toast.success("Retry triggered");
      loadEventPayoutPreview();
    } catch (error) {
      console.error("Error retrying failed payout:", error);
      toast.error("Failed to retry payout");
    } finally {
      setProcessing(null);
    }
  };

  const handleRetryAllFailed = async () => {
    try {
      setProcessing("retry-all");
      const response = await retryAllFailedEventPayouts();
      const retriedCount =
        Number.isFinite(Number(response?.data?.retriedCount))
          ? Number(response.data.retriedCount)
          : null;
      toast.success(
        retriedCount !== null
          ? `Retried ${retriedCount} failed payout(s)`
          : "Retry triggered for failed payouts",
      );
      loadEventPayoutPreview();
    } catch (error) {
      console.error("Error retrying all failed payouts:", error);
      toast.error("Failed to retry all failed payouts");
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkAsSent = async (payoutId) => {
    try {
      setProcessing(payoutId);
      await markPayoutAsSent(payoutId, adminNotes);
      toast.success("Payout marked as sent");
      setAdminNotes("");
      setSelectedPayout(null);
      loadPendingPayouts();
      loadEventPayoutPreview();
    } catch (error) {
      console.error("Error marking payout as sent:", error);
      toast.error("Failed to mark payout as sent");
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelPayout = async (payoutId, reason) => {
    try {
      setProcessing(payoutId);
      await cancelPayout(payoutId, reason);
      toast.success("Payout cancelled");
      loadPendingPayouts();
      loadEventPayoutPreview();
    } catch (error) {
      console.error("Error cancelling payout:", error);
      toast.error("Failed to cancel payout");
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount, currency = "USD") => {
    const safeCurrency =
      typeof currency === "string" && currency.trim().length === 3
        ? currency.trim().toUpperCase()
        : "USD";
    const locales = {
      NGN: "en-NG",
      USD: "en-US",
      GBP: "en-GB",
      EUR: "de-DE",
      KES: "en-KE",
      ZAR: "en-ZA",
      GHS: "en-GH",
    };
    const numericAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
    return new Intl.NumberFormat(locales[safeCurrency] || "en-NG", {
      style: "currency",
      currency: safeCurrency,
    }).format(numericAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return "-";
    }
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }
    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isReleaseTimeReached = (item) => {
    if (!item?.releaseAt) return false;
    const releaseAt = new Date(item.releaseAt);
    if (Number.isNaN(releaseAt.getTime())) return false;
    return releaseAt <= new Date();
  };

  const manualEventPayoutQueue = eventPayoutPreview
    .filter((item) => item?.prefersManualPayout && item?.status !== "PAID")
    .filter((item) => {
      if (manualQueueScope === "all") return true;
      return isReleaseTimeReached(item);
    })
    .sort((a, b) => {
      const first = new Date(a?.releaseAt || 0).getTime();
      const second = new Date(b?.releaseAt || 0).getTime();
      return first - second;
    });

  const manualDueNowCount = eventPayoutPreview.filter(
    (item) =>
      item?.prefersManualPayout &&
      item?.status !== "PAID" &&
      isReleaseTimeReached(item),
  ).length;

  const payoutStatusCounts = eventPayoutPreview.reduce((acc, item) => {
    const status = (item?.status || "UNKNOWN").toUpperCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const paidWithoutTransferCount = eventPayoutPreview.filter(
    (item) => item?.status === "PAID" && !item?.stripeTransferId,
  ).length;

  const overdueAutoPayoutCount = eventPayoutPreview.filter(
    (item) =>
      !item?.prefersManualPayout &&
      item?.status !== "PAID" &&
      isReleaseTimeReached(item),
  ).length;

  const financeAuditRows = eventPayoutPreview
    .filter((item) => {
      const isFailed = item?.status === "FAILED";
      const isPaidWithoutTransfer =
        item?.status === "PAID" && !item?.stripeTransferId;
      const isOverdueAuto =
        !item?.prefersManualPayout &&
        item?.status !== "PAID" &&
        isReleaseTimeReached(item);
      return isFailed || isPaidWithoutTransfer || isOverdueAuto;
    })
    .sort((a, b) => {
      const aDate = new Date(a?.updatedAt || a?.releaseAt || 0).getTime();
      const bDate = new Date(b?.updatedAt || b?.releaseAt || 0).getTime();
      return bDate - aDate;
    });

  const toCsvSafe = (value) => {
    const safeValue = value === null || value === undefined ? "" : String(value);
    const escaped = safeValue.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const exportEventPayoutCsv = () => {
    if (!eventPayoutPreview.length) {
      toast.info("No event payout data to export");
      return;
    }

    const headers = [
      "Payout ID",
      "Event ID",
      "Event",
      "Organizer",
      "Organizer Email",
      "Currency",
      "Net Payout",
      "Event End",
      "Release At",
      "Status",
      "Stripe Transfer ID",
      "Last Error",
      "Updated At",
    ];

    const rows = eventPayoutPreview.map((item) => [
      item.payoutId,
      item.eventId,
      item.eventTitle,
      item.organizerName,
      item.organizerEmail,
      item.currency,
      item.netPayout,
      item.eventEndAt,
      item.releaseAt,
      item.status,
      item.stripeTransferId,
      item.lastError,
      item.updatedAt,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => toCsvSafe(value)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filterSuffix = previewStatus ? `-${previewStatus.toLowerCase()}` : "";
    const dateStamp = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `event-payout-preview${filterSuffix}-${dateStamp}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-[radial-gradient(circle_at_20%_0%,rgba(220,38,38,0.16),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(185,28,28,0.14),transparent_45%),linear-gradient(180deg,#070708_0%,#0d0d11_100%)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-red-500 text-4xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(circle_at_20%_0%,rgba(220,38,38,0.16),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(185,28,28,0.14),transparent_45%),linear-gradient(180deg,#070708_0%,#0d0d11_100%)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">
              Payout Management
            </h1>
            <p className="text-red-200/80">
              XF finance cockpit for manual and scheduled organizer payouts
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-xl transition-all font-semibold shadow-[0_12px_24px_rgba(220,38,38,0.35)] flex items-center gap-2"
          >
            <FaMoneyBillWave />
            Create Manual Payout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900/80 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-red-900/20">
            <div className="text-red-100/80 text-sm mb-2">Pending Payouts</div>
            <div className="text-3xl font-bold text-white">
              {payouts.length}
            </div>
          </div>
          <div className="bg-zinc-900/80 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-red-900/20">
            <div className="text-red-100/80 text-sm mb-2">
              Total Pending Amount
            </div>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(
                payouts.reduce((sum, p) => sum + (p.amount || 0), 0),
                payouts.length > 0 ? payouts[0].currency : "USD",
              )}
            </div>
          </div>
          <div className="bg-zinc-900/80 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-red-900/20">
            <div className="text-red-100/80 text-sm mb-2">Oldest Pending</div>
            <div className="text-lg font-semibold text-white">
              {payouts.length > 0
                ? formatDate(payouts[payouts.length - 1].createdAt)
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Payouts List */}
        <div className="bg-zinc-900/85 rounded-2xl overflow-hidden mb-8 shadow-[0_20px_45px_rgba(0,0,0,0.4)] ring-1 ring-white/5">
          <div className="px-6 py-4 bg-zinc-900/70 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-white text-lg font-semibold">Manual Payout Queue</h2>
              <p className="text-red-100/70 text-sm">
                Organizers on manual payout with amounts due after event end.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Due now: {manualDueNowCount}</span>
              <select
                value={manualQueueScope}
                onChange={(e) => setManualQueueScope(e.target.value)}
                className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-xs"
              >
                <option value="dueNow">Due now</option>
                <option value="all">All manual</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {manualEventPayoutQueue.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No manual payout items pending
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Event</th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Organizer</th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Amount Due</th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Bank Details</th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Status</th>
                    <th className="text-right px-6 py-3 text-gray-300 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {manualEventPayoutQueue.map((item) => {
                    const isCompleting =
                      processing === `manual-complete-${item.payoutId}`;
                    const isDueNow = isReleaseTimeReached(item);
                    const canComplete =
                      isDueNow && (item.status === "READY" || item.status === "HELD");

                    return (
                      <tr
                        key={`manual-${item.payoutId}`}
                        className="hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-200">
                          <div className="font-medium">{item.eventTitle}</div>
                          <div className="text-xs text-gray-500">
                            Ends: {formatDate(item.eventEndAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          <div>{item.organizerName}</div>
                          <div className="text-xs text-gray-500">{item.organizerEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-green-400 font-semibold">
                          {formatCurrency(item.netPayout, item.currency)}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-300">
                          <div>{item.bankName || "-"}</div>
                          <div>{item.accountHolderName || "-"}</div>
                          <div className="font-mono text-gray-400">
                            {item.iban || item.accountNumber || "-"}
                          </div>
                          <div className="text-gray-500">{item.bankCountry || "-"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-gray-200 border border-zinc-700">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleCompleteManualPayout(item.payoutId)}
                            disabled={!canComplete || isCompleting}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded disabled:opacity-50"
                            title={!isDueNow ? "Available after release time" : "Mark manual payout as completed"}
                          >
                            {isCompleting ? "Completing..." : "Mark Completed"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-6 py-4 bg-zinc-900/65 flex items-center justify-between">
            <div>
              <h2 className="text-white text-lg font-semibold">
                Event Payout Preview
              </h2>
              <p className="text-red-100/70 text-sm">
                Automatic release is scheduled for next day after event ends.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {previewLoading && (
                <FaSpinner className="animate-spin text-red-500" />
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-zinc-900/45 grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={previewStatus}
              onChange={(e) => setPreviewStatus(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
            >
              <option value="">ALL</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="READY">READY</option>
              <option value="HELD">HELD</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
            </select>

            <button
              onClick={handleApplyPreviewFilter}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Apply
            </button>

            <button
              onClick={handleResetPreviewFilter}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded"
            >
              Reset
            </button>

            <button
              onClick={handleRetryAllFailed}
              disabled={processing === "retry-all"}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing === "retry-all" ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaRedo />
              )}
              Retry Failed
            </button>

            <button
              onClick={exportEventPayoutCsv}
              disabled={!eventPayoutPreview.length}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaDownload />
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            {eventPayoutPreview.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                No event payout preview data available
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">
                      Event
                    </th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">
                      Organizer
                    </th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">
                      Net Payout
                    </th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">
                      Event End
                    </th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">
                      Release At
                    </th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-gray-300 font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {eventPayoutPreview.map((item) => {
                    const isProcessingPay =
                      processing === `pay-${item.payoutId}`;
                    const isProcessingHold =
                      processing === `hold-${item.payoutId}`;
                    const isProcessingRelease =
                      processing === `release-${item.payoutId}`;
                    const isProcessingRetry =
                      processing === `retry-${item.payoutId}`;
                    return (
                      <tr
                        key={`${item.payoutId}`}
                        className="hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">
                            {item.eventTitle}
                          </div>
                          <div className="text-gray-400 text-sm">
                            Event #{item.eventId}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {item.organizerName}
                          <div className="text-gray-500">
                            {item.organizerEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-200 font-semibold">
                          {formatCurrency(item.netPayout, item.currency)}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {formatDate(item.eventEndAt)}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {formatDate(item.releaseAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-gray-200 border border-zinc-700">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {item.status !== "PAID" &&
                              item.status !== "HELD" && (
                                <button
                                  onClick={() =>
                                    handleHoldEventPayout(item.payoutId)
                                  }
                                  disabled={isProcessingHold}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded disabled:opacity-50"
                                >
                                  Hold
                                </button>
                              )}
                            {item.status === "HELD" && (
                              <button
                                onClick={() =>
                                  handleReleaseEventPayout(item.payoutId)
                                }
                                disabled={isProcessingRelease}
                                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded disabled:opacity-50"
                              >
                                Release
                              </button>
                            )}
                            {item.status !== "PAID" && (
                              <button
                                onClick={() => handlePayNow(item.payoutId)}
                                disabled={isProcessingPay}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50"
                              >
                                Pay Now
                              </button>
                            )}
                            {item.status === "FAILED" && (
                              <button
                                onClick={() =>
                                  handleRetryFailedPayout(item.payoutId)
                                }
                                disabled={isProcessingRetry}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded disabled:opacity-50"
                              >
                                {isProcessingRetry ? "Retrying" : "Retry"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/85 rounded-2xl overflow-hidden mb-8 shadow-[0_20px_45px_rgba(0,0,0,0.4)] ring-1 ring-white/5">
          <div className="px-6 py-4 bg-zinc-900/65">
            <h2 className="text-white text-lg font-semibold">Finance Audit Snapshot</h2>
            <p className="text-red-100/70 text-sm">
              Operational checks to catch failed, overdue, or inconsistent payout records.
            </p>
          </div>

          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 bg-zinc-900/40">
            <div className="bg-zinc-800/70 rounded-xl p-3 ring-1 ring-zinc-700/70">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">SCHEDULED</div>
              <div className="text-white text-lg font-semibold">{payoutStatusCounts.SCHEDULED || 0}</div>
            </div>
            <div className="bg-zinc-800/70 rounded-xl p-3 ring-1 ring-zinc-700/70">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">READY</div>
              <div className="text-white text-lg font-semibold">{payoutStatusCounts.READY || 0}</div>
            </div>
            <div className="bg-zinc-800/70 rounded-xl p-3 ring-1 ring-zinc-700/70">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">HELD</div>
              <div className="text-white text-lg font-semibold">{payoutStatusCounts.HELD || 0}</div>
            </div>
            <div className="bg-zinc-800/70 rounded-xl p-3 ring-1 ring-zinc-700/70">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">PAID</div>
              <div className="text-white text-lg font-semibold">{payoutStatusCounts.PAID || 0}</div>
            </div>
            <div className="bg-zinc-800/70 rounded-xl p-3 ring-1 ring-zinc-700/70">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">FAILED</div>
              <div className="text-amber-300 text-lg font-semibold">{payoutStatusCounts.FAILED || 0}</div>
            </div>
            <div className="bg-zinc-800/70 rounded-xl p-3 ring-1 ring-zinc-700/70">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">MANUAL DUE NOW</div>
              <div className="text-emerald-300 text-lg font-semibold">{manualDueNowCount}</div>
            </div>
            <div className="bg-zinc-800/70 rounded-xl p-3 ring-1 ring-zinc-700/70">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">OVERDUE AUTO</div>
              <div className="text-orange-300 text-lg font-semibold">{overdueAutoPayoutCount}</div>
            </div>
            <div className="bg-zinc-800/70 rounded-xl p-3 ring-1 ring-zinc-700/70">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">PAID W/O REF</div>
              <div className="text-rose-300 text-lg font-semibold">{paidWithoutTransferCount}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {financeAuditRows.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No audit anomalies detected in current payout preview.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Event</th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Organizer</th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Net</th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Release</th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Transfer Ref</th>
                    <th className="text-left px-6 py-3 text-gray-300 font-medium">Issue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {financeAuditRows.map((item) => {
                    const issue =
                      item?.status === "FAILED"
                        ? item?.lastError || "Stripe transfer failed"
                        : item?.status === "PAID" && !item?.stripeTransferId
                          ? "Paid status without transfer reference"
                          : "Auto payout overdue after release time";

                    return (
                      <tr key={`audit-${item.payoutId}`} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 text-gray-200">
                          <div className="font-medium">{item.eventTitle}</div>
                          <div className="text-xs text-gray-500">Event #{item.eventId}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <div>{item.organizerName}</div>
                          <div className="text-xs text-gray-500">{item.organizerEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-gray-200 border border-zinc-700">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-200 font-semibold">
                          {formatCurrency(item.netPayout, item.currency)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{formatDate(item.releaseAt)}</td>
                        <td className="px-6 py-4 text-xs text-gray-300 font-mono">
                          {item.stripeTransferId || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-amber-300">{issue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Payouts List */}
        <div className="bg-zinc-900/85 rounded-2xl overflow-hidden shadow-[0_20px_45px_rgba(0,0,0,0.4)] ring-1 ring-white/5">
          <div className="overflow-x-auto">
            {payouts.length === 0 ? (
              <div className="text-center py-20">
                <FaMoneyBillWave className="text-gray-600 text-5xl mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No pending payouts</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-gray-300 font-medium">
                      Organizer
                    </th>
                    <th className="text-left px-6 py-4 text-gray-300 font-medium">
                      Amount
                    </th>
                    <th className="text-left px-6 py-4 text-gray-300 font-medium">
                      Description
                    </th>
                    <th className="text-left px-6 py-4 text-gray-300 font-medium">
                      Bank Details
                    </th>
                    <th className="text-left px-6 py-4 text-gray-300 font-medium">
                      Created
                    </th>
                    <th className="text-right px-6 py-4 text-gray-300 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {payouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">
                          {payout.organizer?.name || "Unknown"}
                        </div>
                        <div className="text-gray-400 text-sm">
                          ID: {payout.organizer?.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-green-400 font-semibold text-lg">
                          {formatCurrency(payout.amount, payout.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300 max-w-xs">
                          {payout.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-400 text-sm max-w-xs">
                          {payout.bankDetails || "Not provided"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-400 text-sm">
                          {formatDate(payout.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {selectedPayout === payout.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Admin notes..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                              />
                              <button
                                onClick={() => handleMarkAsSent(payout.id)}
                                disabled={processing === payout.id}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                                title="Confirm sent"
                              >
                                <FaCheckCircle />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPayout(null);
                                  setAdminNotes("");
                                }}
                                className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
                                title="Cancel"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setSelectedPayout(payout.id)}
                                disabled={processing === payout.id}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {processing === payout.id ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <FaCheckCircle />
                                )}
                                Mark as Sent
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Are you sure you want to cancel this payout?",
                                    )
                                  ) {
                                    const reason = prompt(
                                      "Reason for cancellation:",
                                    );
                                    if (reason) {
                                      handleCancelPayout(payout.id, reason);
                                    }
                                  }
                                }}
                                disabled={processing === payout.id}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                <FaTimes />
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Manual Payout Modal */}
      {showCreateModal && (
        <CreateManualPayoutModal
          onClose={() => {
            setShowCreateModal(false);
            setPrefillPayout(null);
          }}
          initialData={prefillPayout}
          onSuccess={() => {
            setShowCreateModal(false);
            setPrefillPayout(null);
            loadPendingPayouts();
            loadEventPayoutPreview();
          }}
        />
      )}
    </div>
  );
}
