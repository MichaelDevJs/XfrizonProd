import React, { useState, useEffect } from "react";
import {
  FaUniversity,
  FaCheckCircle,
  FaSpinner,
  FaClock,
} from "react-icons/fa";
import api from "../../api/axios";

const AdminManualPayouts = () => {
  const [loading, setLoading] = useState(true);
  const [organizers, setOrganizers] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [activeTab, setActiveTab] = useState("organizers");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "organizers") {
        const response = await api.get("/admin/manual-payouts/organizers");
        if (response.data.success) {
          setOrganizers(response.data.data);
        }
      } else {
        const response = await api.get("/admin/manual-payouts/pending");
        if (response.data.success) {
          setPendingPayouts(response.data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyBankDetails = async (organizerId, verified) => {
    try {
      const response = await api.put(
        `/admin/manual-payouts/organizers/${organizerId}/verify-bank`,
        null,
        { params: { verified } },
      );
      if (response.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error("Error verifying bank details:", err);
      alert("Failed to verify bank details");
    }
  };

  const markPayoutAsSent = async (payoutId) => {
    const notes = prompt("Enter admin notes (optional):");
    try {
      const response = await api.put(
        `/admin/manual-payouts/${payoutId}/mark-sent`,
        null,
        { params: { adminNotes: notes || "" } },
      );
      if (response.data.success) {
        alert("Payout marked as sent");
        fetchData();
      }
    } catch (err) {
      console.error("Error marking payout:", err);
      alert("Failed to mark payout as sent");
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₦0.00";
    return `₦${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-light text-gray-200 mb-2">
          Manual Payout Management
        </h1>
        <p className="text-gray-500 font-light">
          Manage organizers' bank details and process manual payouts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("organizers")}
          className={`px-4 py-2 font-light transition-all ${
            activeTab === "organizers"
              ? "text-xf-accent border-b-2 border-xf-accent"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Organizers with Manual Payout
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-light transition-all ${
            activeTab === "pending"
              ? "text-xf-accent border-b-2 border-xf-accent"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Pending Payouts
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <FaSpinner className="w-8 h-8 text-xf-accent animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === "organizers" && (
            <div className="space-y-4">
              {organizers.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                  <FaUniversity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 font-light">
                    No organizers with manual payout preference
                  </p>
                </div>
              ) : (
                organizers.map((org) => (
                  <div
                    key={org.organizerId}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl text-gray-200 font-medium">
                          {org.organizerName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: {org.organizerId}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {org.bankDetailsVerified ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-2">
                            <FaCheckCircle />
                            Verified
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm flex items-center gap-2">
                            <FaClock />
                            Pending Verification
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                        <p className="text-gray-300">{org.bankName || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Account Holder
                        </p>
                        <p className="text-gray-300">
                          {org.accountHolderName || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">IBAN</p>
                        <p className="text-gray-300 font-mono text-sm">
                          {org.iban || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">BIC/SWIFT</p>
                        <p className="text-gray-300">{org.bicSwift || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Account Number
                        </p>
                        <p className="text-gray-300 font-mono text-sm">
                          {org.accountNumber || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Country</p>
                        <p className="text-gray-300">
                          {org.bankCountry || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {!org.bankDetailsVerified && (
                        <button
                          onClick={() =>
                            verifyBankDetails(org.organizerId, true)
                          }
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-all"
                        >
                          Verify Bank Details
                        </button>
                      )}
                      {org.bankDetailsVerified && (
                        <button
                          onClick={() =>
                            verifyBankDetails(org.organizerId, false)
                          }
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-all"
                        >
                          Unverify
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "pending" && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {pendingPayouts.length === 0 ? (
                <div className="p-12 text-center">
                  <FaClock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 font-light">No pending payouts</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-gray-400 font-light">
                        Organizer
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-light">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-light">
                        Bank Details
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-light">
                        Created
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-light">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayouts.map((payout) => (
                      <tr
                        key={payout.id}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50"
                      >
                        <td className="py-3 px-4">
                          <p className="text-gray-200">
                            {payout.organizerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payout.organizerEmail}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-gray-200 font-medium">
                          {formatCurrency(payout.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-300 text-xs">
                            {payout.bankName}
                          </p>
                          <p className="text-gray-500 text-xs font-mono">
                            {payout.iban || payout.accountNumber}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => markPayoutAsSent(payout.id)}
                            className="px-3 py-1 bg-xf-accent hover:brightness-110 text-white rounded text-xs transition-all"
                          >
                            Mark as Sent
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminManualPayouts;
