import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import EventDetailsView from "../../component/events/EventDetailsView";
import TicketSelectionModal from "../../component/events/TicketSelectionModal";
import CheckoutModal from "../../component/events/CheckoutModal";

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedTicketsToPurchase, setSelectedTicketsToPurchase] = useState(
    {},
  );
  const [subtotal, setSubtotal] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);

  const SERVICE_FEE_RATE = 0.1; // 10% service fee per ticket
  const roundCurrency = (amount) =>
    Math.round((Number(amount) + 1e-9) * 100) / 100;

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/public/details/${eventId}`);
      const eventData = response.data?.data || response.data;

      // Ensure ticketTiers exists
      if (!eventData.ticketTiers) {
        eventData.ticketTiers = [];
      }

      setEvent(eventData);

      if (eventData.organizer) {
        setOrganizer(eventData.organizer);
      }

      const organizerId =
        eventData.organizer?.id ||
        eventData.organizer?.organizerId ||
        eventData.organizer?.userId ||
        eventData.organizerId ||
        eventData.createdBy ||
        eventData.userId;

      if (organizerId) {
        try {
          const organizerRes = await api.get(`/organizers/${organizerId}`);
          const fullOrganizer = organizerRes.data?.data || organizerRes.data;
          if (fullOrganizer) {
            setOrganizer(fullOrganizer);
          }
        } catch (organizerError) {
          console.warn(
            "Could not load full organizer profile:",
            organizerError,
          );
        }
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to load event details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTickets = (selectedTickets) => {
    const userToken = localStorage.getItem("userToken");

    if (!isAuthenticated) {
      toast.warning("Please log in to purchase tickets");
      navigate("/auth/login", {
        replace: true,
        state: { from: location },
      });
      return;
    }

    if (!userToken) {
      toast.warning("Your session has expired. Please log in again.");
      navigate("/auth/login", {
        replace: true,
        state: { from: location },
      });
      return;
    }

    if (!event || !event.ticketTiers || event.ticketTiers.length === 0) {
      toast.error("Event details not loaded. Please refresh.");
      return;
    }

    // Calculate subtotal from selected tickets
    let calculatedSubtotal = 0;
    Object.entries(selectedTickets).forEach(([tierId, quantity]) => {
      if (quantity > 0) {
        const tier = event.ticketTiers.find(
          (t) => parseInt(t.id) === parseInt(tierId),
        );
        if (tier) {
          calculatedSubtotal += tier.price * quantity;
        }
      }
    });

    calculatedSubtotal = roundCurrency(calculatedSubtotal);
    const calculatedServiceFee = roundCurrency(
      calculatedSubtotal * SERVICE_FEE_RATE,
    );
    const calculatedTotal = roundCurrency(
      calculatedSubtotal + calculatedServiceFee,
    );

    if (calculatedSubtotal === 0) {
      toast.error("Please select at least one ticket");
      return;
    }

    setSelectedTicketsToPurchase(selectedTickets);
    setSubtotal(calculatedSubtotal);
    setServiceFee(calculatedServiceFee);
    setTotalPrice(calculatedTotal);
    setShowCheckoutModal(true);
  };

  const handleCheckoutComplete = async (paymentIntentId) => {
    try {
      const userToken = localStorage.getItem("userToken");

      // Prevent duplicate requests
      if (processingPayment) {
        console.log("Payment already processing, ignoring duplicate request");
        return;
      }

      if (!userToken) {
        throw new Error("Session expired. Please log in again.");
      }

      if (!paymentIntentId) {
        throw new Error("Missing payment intent reference");
      }

      const eventIdNumber = Number(eventId);
      if (!Number.isFinite(eventIdNumber)) {
        throw new Error("Invalid eventId");
      }

      setProcessingPayment(true);
      console.log(
        "💳 Payment complete, confirming payment status...",
        paymentIntentId,
      );

      // Step 1: Confirm payment status with backend
      try {
        const confirmResponse = await api.post(
          `/payments/${paymentIntentId}/confirm`,
        );
        console.log("✅ Backend payment confirmation SUCCESS:");
        console.log("Response status:", confirmResponse.status);
        console.log(
          "Response data:",
          JSON.stringify(confirmResponse.data, null, 2),
        );
      } catch (confirmError) {
        console.error("❌ Backend payment confirmation FAILED:");
        console.error("Status:", confirmError?.response?.status);
        console.error("Status text:", confirmError?.response?.statusText);
        console.error(
          "Error data:",
          JSON.stringify(confirmError?.response?.data, null, 2),
        );
        console.error("Error message:", confirmError?.message);
        throw confirmError;
      }

      // Step 2: Validate event and tickets
      if (!event || !event.ticketTiers) {
        throw new Error("Event data not available");
      }

      // Step 3: Record all selected tickets in database
      const ticketPromises = Object.entries(selectedTicketsToPurchase).map(
        async ([tierId, quantity]) => {
          if (quantity > 0) {
            const tier = event.ticketTiers.find(
              (t) => parseInt(t.id) === parseInt(tierId),
            );
            if (!tier) {
              console.warn(`Ticket tier ${tierId} not found in event`);
              return;
            }

            const ticketTierIdNumber = Number(tier.id);
            if (!Number.isFinite(ticketTierIdNumber)) {
              throw new Error(`Invalid ticketTierId for tier ${tierId}`);
            }

            const currency = tier.currency || event.currency;
            if (!currency) {
              throw new Error("Missing currency for ticket purchase");
            }

            const tierSubtotal = roundCurrency(
              Number(tier.price) * Number(quantity),
            );
            const tierServiceFee = roundCurrency(
              tierSubtotal * SERVICE_FEE_RATE,
            );
            const tierTotal = roundCurrency(tierSubtotal + tierServiceFee);

            const payload = {
              eventId: eventIdNumber,
              ticketTierId: ticketTierIdNumber,
              quantity: Number(quantity),
              paymentIntentId,
              totalPrice: tierTotal,
              currency,
            };

            try {
              const ticketResponse = await api.post("/user-tickets", payload);
              console.log("✅ Ticket recorded successfully:", {
                tierId: payload.ticketTierId,
                quantity: payload.quantity,
                response: ticketResponse.data,
              });
            } catch (postError) {
              console.error("❌ Failed to record user ticket:");
              console.error("Payload sent:", JSON.stringify(payload, null, 2));
              console.error("HTTP status:", postError?.response?.status);
              console.error(
                "Error data:",
                JSON.stringify(postError?.response?.data, null, 2),
              );
              console.error("Error message:", postError?.message);
              throw postError;
            }
          }
        },
      );

      await Promise.all(ticketPromises);

      toast.success("Ticket purchased successfully!");
      setShowCheckoutModal(false);
      setSelectedTicketsToPurchase({});
      setTotalPrice(0);

      // Redirect to payment success page with payment intent ID
      navigate(`/payment-success?payment_intent=${paymentIntentId}`);
    } catch (error) {
      console.error("Error recording ticket purchase:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Ticket purchased but failed to record. Contact support.",
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-gray-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-gray-400">Event not found</div>
      </div>
    );
  }

  return (
    <>
      <EventDetailsView
        event={event}
        organizer={organizer}
        onBuyTickets={handleBuyTickets}
      />

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <CheckoutModal
          event={event}
          selectedTickets={selectedTicketsToPurchase}
          subtotal={subtotal}
          serviceFee={serviceFee}
          totalPrice={totalPrice}
          onClose={() => setShowCheckoutModal(false)}
          onComplete={handleCheckoutComplete}
        />
      )}
    </>
  );
}
