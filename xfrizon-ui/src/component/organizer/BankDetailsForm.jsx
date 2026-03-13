import React, { useState, useEffect } from "react";
import {
  FaUniversity,
  FaSave,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import organizerApi from "../../api/organizerApi";

const BankDetailsForm = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    bankName: "",
    accountHolderName: "",
    iban: "",
    bicSwift: "",
    bankCountry: "",
    accountNumber: "",
    bankBranch: "",
    prefersManualPayout: false,
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const response = await organizerApi.getBankDetails();
      if (response.success && response.data) {
        setFormData({
          bankName: response.data.bankName || "",
          accountHolderName: response.data.accountHolderName || "",
          iban: response.data.iban || "",
          bicSwift: response.data.bicSwift || "",
          bankCountry: response.data.bankCountry || "",
          accountNumber: response.data.accountNumber || "",
          bankBranch: response.data.bankBranch || "",
          prefersManualPayout: response.data.prefersManualPayout || false,
        });
      }
    } catch (err) {
      console.error("Error fetching bank details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bankName || !formData.accountHolderName) {
      setMessage({
        type: "error",
        text: "Bank name and account holder name are required",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      const response = await organizerApi.saveBankDetails(formData);
      if (response.success) {
        setMessage({
          type: "success",
          text: "Bank details saved successfully! Admin will verify them before processing payouts.",
        });
      } else {
        setMessage({
          type: "error",
          text: response.message || "Failed to save bank details",
        });
      }
    } catch (err) {
      console.error("Error saving bank details:", err);
      setMessage({
        type: "error",
        text: err.message || "Failed to save bank details",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-4 text-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 overflow-hidden">
      {message && (
        <div
          className={`p-3 flex items-center gap-2 text-sm ${
            message.type === "success"
              ? "bg-green-500/10 border-b border-green-500/30 text-green-400"
              : "bg-red-500/10 border-b border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <FaCheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <FaExclamationTriangle className="w-4 h-4 shrink-0" />
          )}
          <p className="text-xs">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="max-h-80 overflow-y-auto hide-scrollbar p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-gray-200 focus:border-xf-accent focus:outline-none"
                placeholder="e.g., First Bank Nigeria"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-gray-200 focus:border-xf-accent focus:outline-none"
                placeholder="Full name as per bank account"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                IBAN (if applicable)
              </label>
              <input
                type="text"
                name="iban"
                value={formData.iban}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-gray-200 focus:border-xf-accent focus:outline-none"
                placeholder="e.g., GB29 NWBK 6016 1331 9268 19"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                BIC/SWIFT Code
              </label>
              <input
                type="text"
                name="bicSwift"
                value={formData.bicSwift}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-gray-200 focus:border-xf-accent focus:outline-none"
                placeholder="e.g., DEUTDEFF"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-gray-200 focus:border-xf-accent focus:outline-none"
                placeholder="e.g., 0123456789"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Bank Country
              </label>
              <input
                type="text"
                name="bankCountry"
                value={formData.bankCountry}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-gray-200 focus:border-xf-accent focus:outline-none"
                placeholder="e.g., Nigeria"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">
                Bank Branch
              </label>
              <input
                type="text"
                name="bankBranch"
                value={formData.bankBranch}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-gray-200 focus:border-xf-accent focus:outline-none"
                placeholder="e.g., Victoria Island, Lagos"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg mt-3">
            <input
              type="checkbox"
              id="prefersManualPayout"
              name="prefersManualPayout"
              checked={formData.prefersManualPayout}
              onChange={handleChange}
              className="w-4 h-4 text-xf-accent bg-zinc-700 border-zinc-600 rounded focus:ring-xf-accent"
            />
            <label
              htmlFor="prefersManualPayout"
              className="text-xs text-gray-300"
            >
              I prefer manual payout (admin-processed) instead of automatic
              Stripe
            </label>
          </div>
        </div>

        <div className="border-t border-zinc-800 p-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-xf-accent hover:brightness-110 text-white rounded-lg font-light text-sm flex items-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Details"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BankDetailsForm;
