import api from "./axios";

/**
 * Stripe Connect Onboarding APIs
 */
export const createStripeConnectAccount = async (organizerId) => {
  const response = await api.post(
    `/organizers/${organizerId}/stripe/onboarding`,
  );
  return response.data;
};

export const getStripeOnboardingLink = async (organizerId) => {
  const response = await api.get(
    `/organizers/${organizerId}/stripe/onboarding-link`,
  );
  return response.data;
};

export const getStripeConnectStatus = async (organizerId) => {
  const response = await api.get(`/organizers/${organizerId}/stripe/status`);
  return response.data;
};

export const updatePayoutCadence = async (organizerId, cadence) => {
  const response = await api.put(
    `/organizers/${organizerId}/stripe/payout-cadence`,
    {
      payoutCadence: cadence,
    },
  );
  return response.data;
};

/**
 * Opt for manual payouts (admin-processed transfers)
 */
export const optForManualPayouts = async (organizerId) => {
  const response = await api.post(
    `/organizers/${organizerId}/payout/manual-opt-in`,
  );
  return response.data;
};

/**
 * Manual Payout APIs (Admin)
 */
export const createManualPayout = async (payoutData) => {
  const payload = {
    ...payoutData,
    currency: payoutData?.currency || "USD",
  };
  const response = await api.post("/admin/payouts/manual", payload);
  if (response?.data?.success === false) {
    throw new Error(response?.data?.message || "Failed to create payout");
  }
  return response.data;
};

export const getPendingPayouts = async (page = 0, size = 20) => {
  const response = await api.get("/admin/payouts/pending", {
    params: { page, size },
  });
  if (response?.data?.success === false) {
    throw new Error(response?.data?.message || "Failed to load payouts");
  }
  return response.data;
};

export const getOrganizerPayoutPreview = async ({
  cadence = "WEEKLY",
  from,
  to,
} = {}) => {
  const params = { cadence };
  if (from) {
    params.from = from;
  }
  if (to) {
    params.to = to;
  }

  const response = await api.get("/admin/payouts/preview", { params });
  if (response?.data?.success === false) {
    throw new Error(response?.data?.message || "Failed to load payout preview");
  }
  return response.data;
};

export const markPayoutAsSent = async (payoutId, adminNotes = "") => {
  const response = await api.put(`/admin/payouts/${payoutId}/sent`, null, {
    params: { adminNotes },
  });
  return response.data;
};

export const cancelPayout = async (payoutId, reason = "") => {
  const response = await api.delete(`/admin/payouts/${payoutId}`, {
    params: { reason },
  });
  return response.data;
};

export const getOrganizerPayouts = async (organizerId, page = 0, size = 20) => {
  const response = await api.get(`/admin/payouts/organizer/${organizerId}`, {
    params: { page, size },
  });
  return response.data;
};
