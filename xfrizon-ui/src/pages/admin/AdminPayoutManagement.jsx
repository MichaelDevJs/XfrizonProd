import React, { useState, useEffect } from "react";
import {
  getPendingPayouts,
  getEventPayoutPreview,
  holdEventPayout,
  releaseEventPayout,
  payEventPayoutNow,
  markPayoutAsSent,
  cancelPayout,
} from "../../api/payoutApi";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaTimes,
  FaSpinner,
  FaMoneyBillWave,
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

  if (loading) {
    return (
      <div className="bg-black min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-red-500 text-4xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Payout Management
            </h1>
            <p className="text-gray-400">
              Manage manual payouts for organizers
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <FaMoneyBillWave />
            Create Manual Payout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Pending Payouts</div>
            <div className="text-3xl font-bold text-white">
              {payouts.length}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">
              Total Pending Amount
            </div>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(
                payouts.reduce((sum, p) => sum + (p.amount || 0), 0),
                payouts.length > 0 ? payouts[0].currency : "USD",
              )}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Oldest Pending</div>
            <div className="text-lg font-semibold text-white">
              {payouts.length > 0
                ? formatDate(payouts[payouts.length - 1].createdAt)
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Payouts List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-white text-lg font-semibold">
                Event Payout Preview
              </h2>
              <p className="text-gray-400 text-sm">
                Automatic release is scheduled for next day after event ends.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {previewLoading && (
                <FaSpinner className="animate-spin text-red-500" />
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-b border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-3">
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
          </div>

          <div className="overflow-x-auto">
            {eventPayoutPreview.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                No event payout preview data available
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-zinc-800">
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
                <tbody className="divide-y divide-zinc-800">
                  {eventPayoutPreview.map((item) => {
                    const isProcessingPay =
                      processing === `pay-${item.payoutId}`;
                    const isProcessingHold =
                      processing === `hold-${item.payoutId}`;
                    const isProcessingRelease =
                      processing === `release-${item.payoutId}`;
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

        {/* Payouts List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {payouts.length === 0 ? (
              <div className="text-center py-20">
                <FaMoneyBillWave className="text-gray-600 text-5xl mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No pending payouts</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-zinc-800">
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
                <tbody className="divide-y divide-zinc-800">
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
