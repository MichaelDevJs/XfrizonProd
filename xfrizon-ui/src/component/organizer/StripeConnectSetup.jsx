import React, { useState, useEffect } from "react";
import {
  getStripeConnectStatus,
  getStripeOnboardingLink,
  updatePayoutCadence,
  optForManualPayouts,
} from "../../api/payoutApi";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaMoneyBillWave,
  FaExternalLinkAlt,
  FaEdit,
  FaClock,
  FaShieldAlt,
} from "react-icons/fa";

export default function StripeConnectSetup({ organizerId, organizer }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [onboardingUrl, setOnboardingUrl] = useState(null);
  const [updatingCadence, setUpdatingCadence] = useState(false);
  const [optingForManual, setOptingForManual] = useState(false);

  useEffect(() => {
    console.log("StripeConnectSetup - Organizer data received:", organizer);
    console.log("StripeConnectSetup - Has location:", !!organizer?.location);
    console.log("StripeConnectSetup - Location value:", organizer?.location);
    console.log("StripeConnectSetup - Location is empty?", !organizer?.location || organizer?.location?.trim() === "");
  }, [organizer]);

  useEffect(() => {
    if (organizerId) {
      loadConnectStatus();
    }
  }, [organizerId]);

  const loadConnectStatus = async () => {
    try {
      setLoading(true);
      const response = await getStripeConnectStatus(organizerId);
      setStatus(response);
      console.log("Stripe Connect Status:", response);
    } catch (error) {
      console.error("Error loading Stripe Connect status:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to load payout account status";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    console.log("Manually refreshing Stripe status...");
    await loadConnectStatus();
    if (status?.payoutsEnabled) {
      toast.success("✓ Your Stripe account is fully active!");
    } else if (status?.chargesEnabled) {
      toast.info(
        "⏳ Account is being finalized. Payouts will be enabled shortly.",
      );
    } else {
      toast.info("Status refreshed");
    }
  };

  const handleStartOnboarding = async () => {
    // Check if organizer has set their location
    if (!organizer?.location || organizer.location.trim() === "") {
      toast.error(
        "Please set your location in your profile before setting up Stripe Connect. This is required for payment processing.",
        { autoClose: 5000 }
      );
      return;
    }

    try {
      setLoading(true);
      const response = await getStripeOnboardingLink(organizerId);

      if (response.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = response.onboardingUrl;
      } else {
        toast.error(response.message || "Failed to generate onboarding link");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error starting onboarding:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to start Stripe onboarding";
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const handleUpdateCadence = async (newCadence) => {
    try {
      setUpdatingCadence(true);
      const response = await updatePayoutCadence(organizerId, newCadence);
      setStatus(response);
      toast.success(`✓ Payout schedule updated to ${newCadence.toLowerCase()}`);
    } catch (error) {
      console.error("Error updating payout cadence:", error);
      toast.error("Failed to update payout schedule");
    } finally {
      setUpdatingCadence(false);
    }
  };

  const handleOptForManualPayouts = async () => {
    if (
      !window.confirm(
        "Are you sure you want to opt for manual payouts?\n\nWith this option, an admin will process your payouts manually instead of automatic Stripe transfers. You can still connect Stripe later if you change your mind.",
      )
    ) {
      return;
    }

    try {
      setOptingForManual(true);
      await optForManualPayouts(organizerId);
      toast.success(
        "✓ Successfully opted for manual payouts. You can now publish events!",
      );
      // Reload status to reflect the change
      await loadConnectStatus();
    } catch (error) {
      console.error("Error opting for manual payouts:", error);
      toast.error(
        error.response?.data?.message || "Failed to opt for manual payouts",
      );
    } finally {
      setOptingForManual(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-red-500 text-xl" />
          <span className="ml-2 text-sm text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  const isFullyConnected =
    status?.status === "completed" && status?.payoutsEnabled;
  const isPending = status?.status === "pending" && status?.stripeAccountId;
  const notStarted =
    status?.status === "not_started" || !status?.stripeAccountId;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="max-h-80 overflow-y-auto hide-scrollbar p-4 space-y-3">
        {/* Status Banner - Fully Connected */}
        {isFullyConnected && (
          <div className="bg-green-500/10 border border-green-500/40 rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <FaCheckCircle className="text-green-400 text-base shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-400">
                  ✓ Payout Account Active
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Stripe account ready for automatic payouts.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-900/50 rounded p-2">
                <p className="text-xs text-gray-400">Schedule</p>
                <p className="text-sm font-medium text-white">
                  {status?.payoutCadence || "WEEKLY"}
                </p>
              </div>
              <div className="bg-zinc-900/50 rounded p-2">
                <p className="text-xs text-gray-400">Account ID</p>
                <p className="text-xs font-mono text-gray-300 truncate">
                  {status.stripeAccountId?.substring(0, 15)}...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Banner - Pending */}
        {isPending && !isFullyConnected && (
          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <FaClock className="text-yellow-400 text-base shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-400 mb-1">
                  ⏳ Setup In Progress
                </h3>
                <p className="text-xs text-gray-300 mb-2">
                  {status?.chargesEnabled
                    ? "Stripe is finalizing your payout settings. Usually takes a few minutes to hours."
                    : "Complete your Stripe account setup to start receiving payouts."}
                </p>
                <button
                  onClick={handleStartOnboarding}
                  className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg transition-colors font-medium flex items-center gap-1.5"
                >
                  <FaExternalLinkAlt className="w-3 h-3" />
                  Continue Setup
                </button>
                {status?.chargesEnabled && (
                  <p className="text-xs text-blue-300 mt-2">
                    <strong>Almost there!</strong> Click "Refresh Status" below to check for updates.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Banner - Not Started */}
        {notStarted && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              Choose how you receive earnings. Required before publishing events.
            </p>

            {/* Location Warning */}
            {(!organizer?.location || organizer.location.trim() === "") && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                <div className="flex items-start gap-2">
                  <FaExclamationCircle className="text-amber-500 text-sm mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-200">
                    Set your location in{" "}
                    <a
                      href="/organizer/profile/edit"
                      className="underline hover:text-amber-100"
                    >
                      profile settings
                    </a>{" "}
                    before connecting Stripe.
                  </p>
                </div>
              </div>
            )}

            {/* Option Cards */}
            <div className="space-y-2">
              {/* Stripe Connect Option */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-white">
                      Stripe Connect
                    </h4>
                    <p className="text-xs text-green-400">✓ Recommended</p>
                  </div>
                  <FaShieldAlt className="text-red-500 text-base" />
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  Automatic transfers on weekly/monthly schedule.
                </p>
                <button
                  onClick={handleStartOnboarding}
                  disabled={optingForManual}
                  className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  Connect Stripe
                </button>
              </div>

              {/* Manual Payout Option */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-white">
                      Manual Payouts
                    </h4>
                    <p className="text-xs text-gray-400">Admin processed</p>
                  </div>
                  <FaMoneyBillWave className="text-blue-400 text-base" />
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  Admin processes transfers (3-5 business days).
                </p>
                <button
                  onClick={handleOptForManualPayouts}
                  disabled={optingForManual}
                  className="w-full px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg transition-colors font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {optingForManual ? (
                    <>
                      <FaSpinner className="animate-spin text-xs" />
                      Processing...
                    </>
                  ) : (
                    "Choose Manual"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payout Schedule Settings - Only show when fully connected */}
        {isFullyConnected && (
          <div className="border-t border-zinc-800 pt-3 mt-3">
            <p className="text-xs text-gray-400 mb-2">Payout Schedule</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdateCadence("WEEKLY")}
                disabled={updatingCadence || status?.payoutCadence === "WEEKLY"}
                className={`px-2 py-2 rounded-lg border transition-all text-xs ${
                  status?.payoutCadence === "WEEKLY"
                    ? "border-red-500 bg-red-500/10 text-red-400"
                    : "border-zinc-700 bg-zinc-800 text-gray-300 hover:border-zinc-600"
                } ${updatingCadence ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="font-medium">Weekly</div>
              </button>
              <button
                onClick={() => handleUpdateCadence("MONTHLY")}
                disabled={
                  updatingCadence || status?.payoutCadence === "MONTHLY"
                }
                className={`px-2 py-2 rounded-lg border transition-all text-xs ${
                  status?.payoutCadence === "MONTHLY"
                    ? "border-red-500 bg-red-500/10 text-red-400"
                    : "border-zinc-700 bg-zinc-800 text-gray-300 hover:border-zinc-600"
                } ${updatingCadence ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="font-medium">Monthly</div>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with Refresh */}
      <div className="border-t border-zinc-800 p-3 flex justify-end">
        <button
          onClick={handleRefreshStatus}
          disabled={loading}
          className="px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-gray-300 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <FaSpinner className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh Status
        </button>
      </div>
    </div>
  );
}
