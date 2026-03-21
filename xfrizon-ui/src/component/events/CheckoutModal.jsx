import React, { useState } from "react";
import { FaTimes, FaLock } from "react-icons/fa";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { toast } from "react-toastify";
import api from "../../api/axios";

const STRIPE_PUBLIC_KEY =
  (import.meta.env.VITE_STRIPE_PUBLIC_KEY || "").trim();
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

// Currency symbol mapping
const CURRENCY_SYMBOLS = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  KES: "KSh",
  ZAR: "R",
  GHS: "GH₵",
  CAD: "C$",
  INR: "₹",
  UGX: "UGX",
  AUD: "A$",
  JPY: "¥",
  CHF: "CHF",
  SEK: "kr",
  NZD: "NZ$",
};

function CheckoutForm({
  clientSecret,
  ticket,
  quantity,
  total,
  currency,
  onSuccess,
  onError,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [elementError, setElementError] = useState(null);

  const getCurrencySymbol = () => {
    return CURRENCY_SYMBOLS[currency] || currency;
  };

  // Handle element errors
  const handleElementChange = (event) => {
    if (event.error) {
      console.error("❌ Payment Element error:");
      console.error("Error code:", event.error.code);
      console.error("Error message:", event.error.message);
      setElementError(event.error.message);
    } else {
      setElementError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error("Stripe or elements not loaded");
      onError(
        "Payment system not ready. Please refresh the page and try again.",
      );
      return;
    }

    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) {
      onError(
        "Payment form failed to load. Please refresh the page. If this persists, Stripe key configuration is likely mismatched.",
      );
      return;
    }

    // Check for element errors before submission
    if (elementError) {
      console.error("Cannot submit form due to element error:", elementError);
      onError(elementError);
      return;
    }

    setProcessing(true);

    try {
      console.log(
        "Starting confirmPayment with clientSecret:",
        clientSecret?.substring(0, 20) + "...",
      );

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        console.error("❌ Stripe confirmPayment failed:");
        console.error("Error code:", result.error.code);
        console.error("Error type:", result.error.type);
        console.error("Error message:", result.error.message);
        console.error(
          "Full error object:",
          JSON.stringify(result.error, null, 2),
        );

        // Provide more helpful error messages
        let userMessage = result.error.message;
        if (result.error.code === "invalid_payment_element") {
          userMessage =
            "Payment method is not available. Please contact support if the issue persists.";
        }

        onError(userMessage);
      } else if (result.paymentIntent) {
        console.log("✅ Stripe confirmPayment succeeded:");
        console.log("PaymentIntent ID:", result.paymentIntent.id);
        console.log("PaymentIntent status:", result.paymentIntent.status);
        console.log(
          "Amount:",
          result.paymentIntent.amount,
          result.paymentIntent.currency,
        );
        onSuccess(result.paymentIntent.id);
      }
    } catch (error) {
      console.error("❌ Exception during confirmPayment:", error);
      onError(error.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <PaymentElement
          options={{ layout: "tabs" }}
          onChange={handleElementChange}
        />
        {elementError && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{elementError}</p>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={!stripe || !elements || processing || !!elementError}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <FaLock size={16} />
        {processing
          ? "Processing..."
          : `Pay ${getCurrencySymbol()}${total.toLocaleString()}`}
      </button>
    </form>
  );
}

export default function CheckoutModal({
  event,
  ticket,
  quantity,
  selectedTickets,
  subtotal,
  serviceFee,
  totalPrice,
  onComplete,
  onClose,
}) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);

  const SERVICE_FEE_RATE = 0.1; // 10%
  const roundCurrency = (amount) =>
    Math.round((Number(amount) + 1e-9) * 100) / 100;

  // Support both old (ticket/quantity) and new (selectedTickets/totalPrice) prop formats
  const computedSubtotal =
    typeof subtotal === "number"
      ? subtotal
      : ticket && quantity
        ? roundCurrency(ticket.price * quantity)
        : 0;
  const computedServiceFee =
    typeof serviceFee === "number"
      ? serviceFee
      : computedSubtotal > 0
        ? roundCurrency(computedSubtotal * SERVICE_FEE_RATE)
        : 0;
  const computedTotal = roundCurrency(computedSubtotal + computedServiceFee);

  const total =
    typeof totalPrice === "number" && totalPrice > 0
      ? totalPrice
      : computedTotal;
  const ticketItems =
    selectedTickets || (ticket && quantity ? { [ticket.id]: quantity } : {});

  // Create payment intent on mount
  React.useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);

      if (!STRIPE_PUBLIC_KEY) {
        throw new Error(
          "Stripe is not configured. Missing VITE_STRIPE_PUBLIC_KEY.",
        );
      }

      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (!isLocalhost && STRIPE_PUBLIC_KEY.startsWith("pk_test_")) {
        throw new Error(
          "Stripe publishable key is set to test mode in production. Set VITE_STRIPE_PUBLIC_KEY to your pk_live key and redeploy.",
        );
      }

      const userToken = localStorage.getItem("userToken");
      if (!userToken) {
        throw new Error("Session expired. Please log in to continue checkout.");
      }

      // Validate inputs
      if (!event || !event.id) {
        throw new Error("Event information missing");
      }
      if (total <= 0) {
        throw new Error("Invalid amount");
      }

      // Build ticket tiers info from selected tickets
      const ticketTiersInfo = Object.entries(ticketItems)
        .filter(([, qty]) => qty > 0)
        .map(([tierId, qty]) => ({
          ticketTierId: parseInt(tierId),
          quantity: parseInt(qty),
        }));

      if (ticketTiersInfo.length === 0) {
        throw new Error("Please select at least one ticket");
      }

      const response = await api.post(
        "/payments/create-intent",
        {
          eventId: event.id,
          amount: Math.round(total * 100), // Convert to cents
          currency: event.currency,
          organizerId: event?.organizerId || event?.organizer?.id,
          useStripeConnect: true,
          referralCode:
            (localStorage.getItem("xfrizon_referral") || "").trim() ||
            undefined,
          ticketTiers: ticketTiersInfo,
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      console.log("Payment intent response:", response.data);

      // Access clientSecret from ApiResponse wrapper
      // Backend returns snake_case keys: client_secret, payment_intent_id
      const paymentResponse = response.data?.data;
      const clientSecret = paymentResponse?.client_secret;

      if (clientSecret) {
        setClientSecret(clientSecret);
      } else {
        console.error(
          "Response structure:",
          JSON.stringify(response.data, null, 2),
        );
        throw new Error(
          `No client secret in response. Full response: ${JSON.stringify(response.data)}`,
        );
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);

      // Extract detailed error message from backend
      let errorMessage = "Failed to initialize payment. Please try again.";

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          errorMessage;
      } else if (error.response?.status === 500) {
        // Extract from ApiResponse wrapper
        const backendMessage =
          error.response.data?.message || error.response.data?.error;

        // Check for specific Stripe capability issues
        if (
          backendMessage?.includes("capability") ||
          backendMessage?.includes("card_payments")
        ) {
          errorMessage =
            "⚠️ Organizer payment account is not fully set up. Please complete Stripe onboarding in Finance settings.";
        } else {
          errorMessage =
            backendMessage ||
            "Server error. Please check your account setup and try again.";
        }

        console.error("Backend error details:", error.response.data);
      }

      toast.error(errorMessage);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId) => {
    toast.success("Payment successful!");
    onComplete(paymentIntentId);
  };

  const handlePaymentError = (errorMessage) => {
    toast.error(errorMessage || "Payment failed");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-800 rounded-lg max-w-md w-full border border-zinc-700 max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-700 shrink-0">
          <h2 className="text-2xl font-bold text-white">Checkout</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Order summary */}
          <div className="mb-6 bg-zinc-900 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Order Summary</h3>

            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>{event.title}</span>
              </div>

              {ticket && quantity ? (
                <>
                  <div className="flex justify-between">
                    <span>{ticket.name || "Ticket"}</span>
                    <span className="text-white">
                      {CURRENCY_SYMBOLS[event?.currency] ||
                        CURRENCY_SYMBOLS.NGN}
                      {ticket.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Quantity</span>
                    <span className="text-white">{quantity}</span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-400">
                  {Object.entries(ticketItems)
                    .filter(([, qty]) => qty > 0)
                    .map(([tierId, qty]) => (
                      <div key={tierId} className="flex justify-between py-1">
                        <span>Ticket Tier {tierId}</span>
                        <span className="text-white">{qty} x ticket</span>
                      </div>
                    ))}
                </div>
              )}

              <div className="border-t border-zinc-700 pt-2 mt-2 space-y-2">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span className="text-white">
                    {CURRENCY_SYMBOLS[event?.currency] || CURRENCY_SYMBOLS.NGN}
                    {computedSubtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Service fee (10%)</span>
                  <span className="text-white">
                    {CURRENCY_SYMBOLS[event?.currency] || CURRENCY_SYMBOLS.NGN}
                    {computedServiceFee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-white">
                  <span>Total</span>
                  <span className="text-red-500">
                    {CURRENCY_SYMBOLS[event?.currency] || CURRENCY_SYMBOLS.NGN}
                    {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment form */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Initializing payment...</div>
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                clientSecret={clientSecret}
                ticket={ticket}
                quantity={quantity}
                total={total}
                currency={event?.currency}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          ) : !stripePromise ? (
            <div className="text-center py-8 text-red-500">
              Stripe is not configured. Please contact support.
            </div>
          ) : (
            <div className="text-center py-8 text-red-500">
              Failed to load payment form
            </div>
          )}

          {/* Security note */}
          <p className="text-xs text-gray-400 mt-4 text-center flex items-center justify-center gap-1">
            <FaLock size={12} />
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
