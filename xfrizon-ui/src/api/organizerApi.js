import api from "./axios";

const organizerApi = {
  // Stripe Connect Onboarding
  createStripeOnboarding: async () => {
    try {
      const response = await api.post("/organizers/stripe/onboarding");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Bank Details for Manual Payout
  saveBankDetails: async (bankDetails) => {
    try {
      const response = await api.post("/organizers/bank-details", bankDetails);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  getBankDetails: async () => {
    try {
      const response = await api.get("/organizers/bank-details");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  getStripeConnectStatus: async () => {
    try {
      const response = await api.get("/organizers/stripe/status");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  updatePayoutCadence: async (cadence) => {
    try {
      const response = await api.put("/organizers/stripe/payout-cadence", {
        cadence,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Payout Report
  getPayoutReport: async (fromDate, toDate) => {
    try {
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const response = await api.get("/organizers/stripe/payouts/report", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Events
  createEvent: async (eventData) => {
    try {
      const response = await api.post("/events", eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  updateEvent: async (eventId, eventData) => {
    try {
      const response = await api.put(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  getOrganizerEvents: async () => {
    try {
      const response = await api.get("/events/organizer/my-events");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  deleteEvent: async (eventId) => {
    try {
      const response = await api.delete(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },
};

export default organizerApi;
