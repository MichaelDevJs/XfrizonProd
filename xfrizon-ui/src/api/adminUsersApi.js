import api from "./axios";

const pickArray = (payload, fallback = []) => {
  const direct = payload?.data ?? payload;
  if (Array.isArray(direct)) return direct;

  const candidate =
    direct?.items ??
    direct?.content ??
    direct?.records ??
    direct?.users ??
    direct?.rows;

  return Array.isArray(candidate) ? candidate : fallback;
};

const adminUsersApi = {
  getAll: async () => {
    const endpoints = [
      "/admin/users",
      "/admin/users/management",
      "/admin/users/list",
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const res = await api.get(endpoint);
        return pickArray(res.data, []);
      } catch (error) {
        lastError = error;
        if (error?.response?.status === 404) {
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error("Failed to load users");
  },
};

export default adminUsersApi;
