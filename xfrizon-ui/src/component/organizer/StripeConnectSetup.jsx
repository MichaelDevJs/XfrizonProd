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
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="animate-spin text-red-500 text-3xl" />
          <span className="ml-3 text-gray-400">Loading payout settings...</span>
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 px-6 py-4 border-b border-zinc-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaShieldAlt className="text-red-500" />
              Payout Account
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Manage how you receive payments from ticket sales
            </p>
          </div>
          <button
            onClick={handleRefreshStatus}
            disabled={loading}
            className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-gray-300 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            title="Click to check latest status from Stripe"
          >
            <FaSpinner className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Banner - Fully Connected */}
        {isFullyConnected && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-full">
                <FaCheckCircle className="text-green-400 text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-green-400 mb-2">
                  ✓ Payout Account Active
                </h3>
                <p className="text-gray-300 mb-3">
                  Your Stripe account is fully set up and ready to receive
                  automatic payouts from ticket sales.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-zinc-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Payout Schedule</p>
                    <p className="text-lg font-semibold text-white mt-1">
                      {status?.payoutCadence || "WEEKLY"}
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Account ID</p>
                    <p className="text-sm font-mono text-gray-300 mt-1 truncate">
                      {status.stripeAccountId?.substring(0, 20)}...
                    </p>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-sm text-green-300">
                    <strong>✓ All set!</strong> Your payouts will be automatically transferred to your bank account on your selected schedule. You'll receive email notifications from Stripe when payouts are processed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Banner - Pending */}
        {isPending && !isFullyConnected && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/40 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-full">
                <FaClock className="text-yellow-400 text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-yellow-400 mb-2">
                  ⏳ Setup In Progress
                </h3>
                <p className="text-gray-300 mb-3">
                  {status?.chargesEnabled
                    ? "Your account is being verified. Stripe is finalizing your payout settings. This usually takes a few minutes to a few hours."
                    : "Complete your Stripe account setup to start receiving automatic payouts from ticket sales."}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleStartOnboarding}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    <FaExternalLinkAlt />
                    Continue Setup on Stripe
                  </button>
                  {status?.chargesEnabled && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-xs text-blue-300">
                        <strong>Almost there!</strong> Stripe is verifying your information. Click "Refresh" above to check for updates.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Banner - Not Started */}
        {notStarted && (
          <div className="bg-gradient-to-r from-zinc-800 to-zinc-850 border-2 border-zinc-700 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-zinc-800 rounded-full">
                <FaExclamationCircle className="text-gray-400 text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Setup Your Payout Method
                </h3>
                <p className="text-gray-400 mb-4">
                  Choose how you want to receive earnings from ticket sales. You
                  need to set up at least one method before you can publish
                  events.
                </p>

                {/* Location Warning */}
                {(!organizer?.location || organizer.location.trim() === "") && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <FaExclamationCircle className="text-amber-500 text-lg mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-amber-200 font-medium mb-1">
                          Location Required
                        </p>
                        <p className="text-xs text-amber-300/80">
                          Please set your location (city and country) in your{" "}
                          <a
                            href="/organizer/profile/edit"
                            className="underline hover:text-amber-200"
                          >
                            profile settings
                          </a>{" "}
                          before setting up Stripe Connect. This ensures your payment account is configured for your country.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Option Cards */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Stripe Connect Option */}
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-red-500 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white">
                          Stripe Connect
                        </h4>
                        <p className="text-xs text-green-400 mt-1">
                          ✓ Recommended
                        </p>
                      </div>
                      <FaShieldAlt className="text-red-500 text-xl" />
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      Automatic transfers to your bank account on your chosen
                      schedule (weekly/monthly). Secure, fast, and reliable.
                    </p>
                    <button
                      onClick={handleStartOnboarding}
                      disabled={optingForManual}
                      className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      Connect Stripe Account
                    </button>
                  </div>

                  {/* Manual Payout Option */}
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white">
                          Manual Payouts
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          Admin processed
                        </p>
                      </div>
                      <FaMoneyBillWave className="text-blue-400 text-xl" />
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      Request payouts manually. An admin will process transfers
                      to your bank account upon request. Takes 3-5 business
                      days.
                    </p>
                    <button
                      onClick={handleOptForManualPayouts}
                      disabled={optingForManual}
                      className="w-full px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {optingForManual ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Choose Manual"
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    <strong>Note:</strong> You can change your payout method
                    later. Stripe Connect is recommended for faster, automatic
                    payouts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payout Schedule Settings - Only show when fully connected */}
        {isFullyConnected && (
          <div className="border-t border-zinc-800 pt-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <FaEdit className="text-red-500" />
              Payout Schedule
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleUpdateCadence("WEEKLY")}
                disabled={updatingCadence || status?.payoutCadence === "WEEKLY"}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  status?.payoutCadence === "WEEKLY"
                    ? "border-red-500 bg-red-500/10 text-red-400"
                    : "border-zinc-700 bg-zinc-800 text-gray-300 hover:border-zinc-600"
                } ${updatingCadence ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="font-medium">Weekly</div>
                <div className="text-xs text-gray-400 mt-1">Every 7 days</div>
              </button>
              <button
                onClick={() => handleUpdateCadence("MONTHLY")}
                disabled={
                  updatingCadence || status?.payoutCadence === "MONTHLY"
                }
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  status?.payoutCadence === "MONTHLY"
                    ? "border-red-500 bg-red-500/10 text-red-400"
                    : "border-zinc-700 bg-zinc-800 text-gray-300 hover:border-zinc-600"
                } ${updatingCadence ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="font-medium">Monthly</div>
                <div className="text-xs text-gray-400 mt-1">Once per month</div>
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-3">
              Stripe will automatically transfer your earnings to your bank
              account on this schedule.
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="border-t border-zinc-800 pt-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            How It Works
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-red-500 shrink-0">•</span>
              <span>
                Platform deducts 10% service fee from each ticket sale
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 shrink-0">•</span>
              <span>
                Remaining amount (90%) is transferred to your account
                automatically
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 shrink-0">•</span>
              <span>Stripe handles all payment processing and security</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 shrink-0">•</span>
              <span>
                You can change your payout schedule anytime after setup
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 shrink-0">•</span>
              <span>
                Only 2-3 minutes to complete Stripe Connect onboarding
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
