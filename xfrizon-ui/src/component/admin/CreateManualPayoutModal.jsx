import React, { useEffect, useState } from "react";
import { createManualPayout } from "../../api/payoutApi";
import { toast } from "react-toastify";
import { FaTimes, FaSpinner } from "react-icons/fa";

export default function CreateManualPayoutModal({
  onClose,
  onSuccess,
  initialData,
}) {
  const [formData, setFormData] = useState({
    organizerId: "",
    amount: "",
    currency: "USD",
    description: "",
    bankDetails: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialData) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      organizerId:
        initialData.organizerId !== undefined &&
        initialData.organizerId !== null
          ? String(initialData.organizerId)
          : prev.organizerId,
      amount:
        initialData.amount !== undefined && initialData.amount !== null
          ? String(initialData.amount)
          : prev.amount,
      currency: initialData.currency || prev.currency,
      description:
        initialData.description ||
        `Manual payout for organizer revenue (${initialData.currency || "USD"})`,
    }));
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.organizerId || !formData.amount || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const parsedAmount = parseFloat(formData.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    if (!formData.currency || formData.currency.trim().length !== 3) {
      toast.error("Please select a valid currency");
      return;
    }

    const normalizedCurrency = formData.currency.trim().toUpperCase();

    const normalizedDescription = formData.description.trim();
    if (!normalizedDescription) {
      toast.error("Description is required");
      return;
    }

    const parsedOrganizerId = parseInt(formData.organizerId, 10);
    if (Number.isNaN(parsedOrganizerId) || parsedOrganizerId <= 0) {
      toast.error("Please enter a valid organizer ID");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    try {
      setLoading(true);
      await createManualPayout({
        organizerId: parsedOrganizerId,
        amount: parsedAmount,
        currency: normalizedCurrency,
        description: normalizedDescription,
        bankDetails: formData.bankDetails?.trim() || null,
      });

      toast.success("Manual payout created successfully");
      setFormData({
        organizerId: "",
        amount: "",
        currency: "USD",
        description: "",
        bankDetails: "",
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating manual payout:", error);
      if (error.message && !error.response) {
        toast.error(error.message);
        return;
      }
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (error.response?.status === 400
          ? "Invalid payout details. Confirm organizer ID belongs to an active ORGANIZER user."
          : null) ||
        (error.response?.status === 403
          ? "You are not authorized to create manual payouts. Please use an admin account."
          : null) ||
        (error.response?.status === 401
          ? "Your admin session expired. Please log in again."
          : "Failed to create payout");
      toast.error(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-white">
            Create Manual Payout
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Organizer ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Organizer ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="organizerId"
              value={formData.organizerId}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              placeholder="Enter organizer ID"
            />
            <p className="text-gray-500 text-xs mt-1">
              The ID of the organizer receiving the payout
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              step="0.01"
              min="0.01"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500 resize-none"
              placeholder="e.g., Manual transfer for event ticket sales - December 2025"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          {/* Bank Details */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bank Details (Optional)
            </label>
            <textarea
              name="bankDetails"
              value={formData.bankDetails}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500 resize-none"
              placeholder="Bank name, account number, account name, or mobile money details"
            />
            <p className="text-gray-500 text-xs mt-1">
              Optional payment destination details for reference
            </p>
          </div>

          {/* Info Notice */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> This will create a pending payout that you
              must process manually. After sending the payment, mark it as
              "Sent" in the payout management dashboard.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Payout"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
