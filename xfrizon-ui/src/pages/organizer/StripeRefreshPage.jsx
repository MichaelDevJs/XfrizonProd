import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStripeOnboardingLink } from "../../api/payoutApi";
import { FaExclamationCircle, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

export default function StripeRefreshPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || !user.id) {
        toast.error("Please log in again");
        navigate("/organizer/login");
        return;
      }

      const response = await getStripeOnboardingLink(user.id);

      if (response.onboardingUrl) {
        window.location.href = response.onboardingUrl;
      } else {
        toast.error("Failed to generate onboarding link");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error retrying onboarding:", error);
      toast.error("Failed to restart onboarding");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
            <FaExclamationCircle className="text-yellow-500 text-3xl" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Setup Incomplete</h1>

        <p className="text-gray-400 mb-6">
          Your Stripe account setup wasn't completed. You can try again or
          return to your dashboard.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={loading}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Loading...
              </>
            ) : (
              "Try Again"
            )}
          </button>

          <button
            onClick={() => navigate("/organizer/dashboard")}
            className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <p className="text-gray-500 text-xs mt-6">
          You can complete this setup later from your settings page.
        </p>
      </div>
    </div>
  );
}
