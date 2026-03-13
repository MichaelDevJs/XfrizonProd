import api from "./axios";

export const getAdminDashboardSummary = async () => {
  const response = await api.get("/admin/dashboard/summary");
  if (response?.data?.success === false) {
    throw new Error(
      response?.data?.message || "Failed to load admin dashboard summary",
    );
  }

  return response.data;
};
