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
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-gray-400">Loading bank details...</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaUniversity className="w-6 h-6 text-xf-accent" />
        <h2 className="text-2xl font-light text-gray-200">
          Bank Details for Manual Payout
        </h2>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500 text-green-400"
              : "bg-red-500/10 border border-red-500 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <FaCheckCircle className="w-5 h-5" />
          ) : (
            <FaExclamationTriangle className="w-5 h-5" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-200 focus:border-xf-accent focus:outline-none"
              placeholder="e.g., First Bank Nigeria"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Account Holder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="accountHolderName"
              value={formData.accountHolderName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-200 focus:border-xf-accent focus:outline-none"
              placeholder="Full name as per bank account"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              IBAN (if applicable)
            </label>
            <input
              type="text"
              name="iban"
              value={formData.iban}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-200 focus:border-xf-accent focus:outline-none"
              placeholder="e.g., GB29 NWBK 6016 1331 9268 19"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              BIC/SWIFT Code
            </label>
            <input
              type="text"
              name="bicSwift"
              value={formData.bicSwift}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-200 focus:border-xf-accent focus:outline-none"
              placeholder="e.g., DEUTDEFF"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Account Number
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-200 focus:border-xf-accent focus:outline-none"
              placeholder="e.g., 0123456789"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Bank Country
            </label>
            <input
              type="text"
              name="bankCountry"
              value={formData.bankCountry}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-200 focus:border-xf-accent focus:outline-none"
              placeholder="e.g., Nigeria"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">
              Bank Branch
            </label>
            <input
              type="text"
              name="bankBranch"
              value={formData.bankBranch}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-200 focus:border-xf-accent focus:outline-none"
              placeholder="e.g., Victoria Island, Lagos"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
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
            className="text-sm text-gray-300"
          >
            I prefer manual payout (admin-processed bank transfer) instead of
            automatic Stripe payments
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-xf-accent hover:brightness-110 text-white rounded-lg font-light flex items-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave className="w-4 h-4" />
            {saving ? "Saving..." : "Save Bank Details"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BankDetailsForm;
