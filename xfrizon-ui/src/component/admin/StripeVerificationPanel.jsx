import React, { useState } from "react";
import { toast } from "react-toastify";
import { FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaShieldAlt } from "react-icons/fa";
import api from "../../api/axios";

/**
 * Component for admins to view Stripe verification info for an organizer
 * This allows fraud prevention by reviewing Stripe's KYC data
 */
const StripeVerificationPanel = ({ organizerId, organizerName }) => {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVerification = async () => {
    if (!organizerId) {
      toast.error("Organizer ID is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/admin/stripe/organizer/${organizerId}/verification`);
      setVerification(response.data.data);
      toast.success("Stripe verification info loaded");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to load verification info";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusColor = (status) => {
    if (!status) return "text-gray-400";
    if (status === "verified") return "text-green-400";
    if (status === "pending") return "text-yellow-400";
    return "text-red-400";
  };

  const getVerificationStatusIcon = (status) => {
    if (!status) return <FaExclamationCircle />;
    if (status === "verified") return <FaCheckCircle />;
    if (status === "pending") return <FaExclamationCircle />;
    return <FaTimesCircle />;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaShieldAlt className="text-blue-400 text-xl" />
        <h2 className="text-xl font-semibold text-white">Stripe KYC Verification</h2>
        <span className="ml-auto text-xs text-gray-500">Powered by Stripe</span>
      </div>

      {!verification ? (
        <button
          onClick={fetchVerification}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white py-2 rounded-lg transition-colors"
        >
          {loading ? "Loading..." : "View Stripe Verification Info"}
        </button>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-700">
            <div>
              <p className="text-xs text-gray-500 uppercase">Organizer</p>
              <p className="text-white font-semibold">{verification.organizerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Stripe Account</p>
              <p className="text-gray-300 font-mono text-sm">{verification.stripeAccountId}</p>
            </div>
          </div>

          {/* Verification Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-800 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-lg ${getVerificationStatusColor(verification.verificationStatus)}`}>
                  {getVerificationStatusIcon(verification.verificationStatus)}
                </span>
                <span className="text-xs text-gray-500">Verification</span>
              </div>
              <p className="text-white font-semibold capitalize">
                {verification.verificationStatus || "Pending"}
              </p>
            </div>

            <div className="bg-zinc-800 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={verification.chargesEnabled ? "text-green-400" : "text-red-400"}>
                  {verification.chargesEnabled ? <FaCheckCircle /> : <FaTimesCircle />}
                </span>
                <span className="text-xs text-gray-500">Charges</span>
              </div>
              <p className="text-white font-semibold">{verification.chargesEnabled ? "Enabled" : "Disabled"}</p>
            </div>

            <div className="bg-zinc-800 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={verification.payoutsEnabled ? "text-green-400" : "text-red-400"}>
                  {verification.payoutsEnabled ? <FaCheckCircle /> : <FaTimesCircle />}
                </span>
                <span className="text-xs text-gray-500">Payouts</span>
              </div>
              <p className="text-white font-semibold">{verification.payoutsEnabled ? "Enabled" : "Disabled"}</p>
            </div>
          </div>

          {/* Representative Info */}
          {(verification.firstName || verification.lastName) && (
            <div className="bg-zinc-800 rounded p-4">
              <p className="text-xs text-gray-500 uppercase mb-3 font-semibold">Representative</p>
              <div className="grid grid-cols-2 gap-4">
                {verification.firstName && (
                  <div>
                    <p className="text-xs text-gray-500">First Name</p>
                    <p className="text-white">{verification.firstName}</p>
                  </div>
                )}
                {verification.lastName && (
                  <div>
                    <p className="text-xs text-gray-500">Last Name</p>
                    <p className="text-white">{verification.lastName}</p>
                  </div>
                )}
                {verification.dateOfBirth && (
                  <div>
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    <p className="text-white">{verification.dateOfBirth}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Business Info */}
          {(verification.businessName || verification.businessType) && (
            <div className="bg-zinc-800 rounded p-4">
              <p className="text-xs text-gray-500 uppercase mb-3 font-semibold">Business Info</p>
              <div className="grid grid-cols-2 gap-4">
                {verification.businessType && (
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-white capitalize">{verification.businessType}</p>
                  </div>
                )}
                {verification.businessName && (
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-white">{verification.businessName}</p>
                  </div>
                )}
                {verification.taxId && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Tax ID</p>
                    <p className="text-white font-mono">
                      {verification.taxId}
                      {verification.taxIdType && <span className="text-gray-500 ml-2">({verification.taxIdType})</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address Info */}
          {(verification.addressLine1 || verification.city) && (
            <div className="bg-zinc-800 rounded p-4">
              <p className="text-xs text-gray-500 uppercase mb-3 font-semibold">Address</p>
              <p className="text-white">
                {[
                  verification.addressLine1,
                  verification.addressLine2,
                  verification.city,
                  verification.state,
                  verification.postalCode,
                  verification.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}

          {/* Required Documents */}
          {verification.requiredDocuments && verification.requiredDocuments.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4">
              <p className="text-xs text-yellow-400 uppercase font-semibold mb-2">Required Documents</p>
              <ul className="text-sm text-yellow-300 space-y-1">
                {verification.requiredDocuments.map((doc, i) => (
                  <li key={i}>• {doc}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-700 text-xs text-gray-500">
            <span>Stripe data is live and updated automatically</span>
            <button
              onClick={fetchVerification}
              className="text-blue-400 hover:text-blue-300"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded p-3 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default StripeVerificationPanel;
