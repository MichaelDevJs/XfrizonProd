import api from "./axios";

const normalizePendingPayoutsPage = (payload) => {
  const source = payload?.data ?? payload ?? {};

  if (Array.isArray(source)) {
    return {
      content: source,
      totalElements: source.length,
      pageNumber: 0,
      pageSize: source.length,
    };
  }

  const content =
    source?.content ??
    source?.items ??
    source?.records ??
    source?.rows ??
    source?.payouts ??
    source?.data;

  return {
    ...source,
    content: Array.isArray(content) ? content : [],
  };
};

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
  try {
    const response = await api.get("/admin/payouts/pending", {
      params: { page, size },
    });
    if (response?.data?.success === false) {
      throw new Error(response?.data?.message || "Failed to load payouts");
    }
    return normalizePendingPayoutsPage(response.data);
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 404 && status !== 500) {
      throw error;
    }

    // Backward-compatible fallback for environments still on legacy manual payout routes.
    const legacyResponse = await api.get("/admin/manual-payouts/pending");
    if (legacyResponse?.data?.success === false) {
      throw new Error(
        legacyResponse?.data?.message || "Failed to load payouts",
      );
    }
    return normalizePendingPayoutsPage(legacyResponse.data);
  }
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

export const getEventPayoutPreview = async (status) => {
  const response = await api.get("/admin/payouts/events/preview", {
    params: status ? { status } : {},
  });
  if (response?.data?.success === false) {
    throw new Error(response?.data?.message || "Failed to load event payout preview");
  }
  return response.data;
};

export const holdEventPayout = async (payoutId, reason = "") => {
  const response = await api.post(`/admin/payouts/events/${payoutId}/hold`, null, {
    params: reason ? { reason } : {},
  });
  return response.data;
};

export const releaseEventPayout = async (payoutId) => {
  const response = await api.post(`/admin/payouts/events/${payoutId}/release`);
  return response.data;
};

export const payEventPayoutNow = async (payoutId) => {
  const response = await api.post(`/admin/payouts/events/${payoutId}/pay-now`);
  return response.data;
};

export const completeManualEventPayout = async (payoutId) => {
  const response = await api.post(
    `/admin/payouts/events/${payoutId}/manual-complete`,
  );
  return response.data;
};

export const retryFailedEventPayout = async (payoutId) => {
  const response = await api.post(`/admin/payouts/events/${payoutId}/retry`);
  return response.data;
};

export const retryAllFailedEventPayouts = async () => {
  const response = await api.post("/admin/payouts/events/retry-failed");
  return response.data;
};
