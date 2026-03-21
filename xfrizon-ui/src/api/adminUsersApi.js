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

  assignRole: async ({ userId, role }) => {
    const endpoints = [
      {
        method: "put",
        url: `/admin/users/${userId}/role`,
        body: { role },
      },
      {
        method: "patch",
        url: `/admin/users/${userId}/role`,
        body: { role },
      },
      {
        method: "put",
        url: "/admin/users/assign-role",
        body: { userId, role },
      },
      {
        method: "patch",
        url: "/admin/users/assign-role",
        body: { userId, role },
      },
      {
        method: "patch",
        url: `/admin/users/${userId}`,
        body: { role },
      },
    ];

    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const response = await api[endpoint.method](
          endpoint.url,
          endpoint.body,
        );
        return response.data;
      } catch (error) {
        lastError = error;
        if (
          error?.response?.status === 404 ||
          error?.response?.status === 405
        ) {
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error("Failed to assign role");
  },
};

export default adminUsersApi;
