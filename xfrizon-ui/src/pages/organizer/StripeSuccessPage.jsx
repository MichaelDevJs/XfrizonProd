import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getStripeConnectStatus } from "../../api/payoutApi";
import { toast } from "react-toastify";
import { FaCheckCircle } from "react-icons/fa";

export default function StripeSuccessPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleSuccessAndRedirect = async () => {
      try {
        // Refresh status immediately upon return from Stripe
        if (user?.id) {
          console.log(
            "Refreshing Stripe status after onboarding completion...",
          );
          const status = await getStripeConnectStatus(user.id);
          console.log("Updated status:", status);

          if (status?.payoutsEnabled) {
            toast.success("✓ Your account is ready! Payouts are enabled.");
          } else if (status?.chargesEnabled) {
            toast.info(
              "Account is being finalized. Payouts will be enabled shortly.",
            );
          }
        }
      } catch (error) {
        console.error("Error refreshing status after onboarding:", error);
      }

      // Auto redirect after 3 seconds
      const timer = setTimeout(() => {
        navigate("/organizer/finance");
      }, 3000);

      return () => clearTimeout(timer);
    };

    handleSuccessAndRedirect();
  }, [navigate, user?.id]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Stripe Account Connected!
        </h1>

        <p className="text-gray-400 mb-6">
          Your payout account has been successfully set up. You can now start
          receiving automatic transfers from ticket sales.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/organizer/finance")}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            Go to Finance
          </button>

          <button
            onClick={() => navigate("/organizer/dashboard")}
            className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
