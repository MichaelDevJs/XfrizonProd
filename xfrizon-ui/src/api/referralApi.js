import api from "./axios";

export const getReferralAnalytics = async ({ fromDate, toDate, limit = 10 } = {}) => {
  const params = { limit };
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const response = await api.get("/admin/referrals/analytics", { params });
  if (response?.data?.success === false) {
    throw new Error(response?.data?.message || "Failed to load referral analytics");
  }

  return response.data;
};
