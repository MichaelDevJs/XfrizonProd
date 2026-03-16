import api from "./axios";

const pickArray = (payload, fallback = []) => {
  const direct = payload?.data ?? payload;
  if (Array.isArray(direct)) return direct;

  const candidate =
    direct?.items ??
    direct?.content ??
    direct?.records ??
    direct?.partners ??
    direct?.rows;

  return Array.isArray(candidate) ? candidate : fallback;
};

const partnersApi = {
  getAll: async (category) => {
    const params = category ? `?category=${category}` : "";
    const res = await api.get(`/partners${params}`);
    return pickArray(res.data, []);
  },

  getById: async (id) => {
    const res = await api.get(`/partners/${id}`);
    return res.data.data;
  },

  search: async (q) => {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const res = await api.get(`/partners/search${params}`);
    return res.data.data;
  },

  register: async (data) => {
    const res = await api.post("/partners/register", data);
    return res.data;
  },

  getMine: async () => {
    const res = await api.get("/partners/me");
    return res.data.data;
  },

  updateMine: async (data) => {
    const res = await api.put("/partners/me", data);
    return res.data.data;
  },

  verifyScan: async (token, partnerKey) => {
    const res = await api.get(`/partners/verify/${token}`, {
      headers: {
        "X-Partner-Key": partnerKey,
      },
    });
    return res.data;
  },

  // Admin
  create: async (data) => {
    const res = await api.post("/admin/partners", data);
    return res.data.data;
  },

  getAllAdmin: async () => {
    const res = await api.get("/admin/partners");
    return pickArray(res.data, []);
  },

  update: async (id, data) => {
    const res = await api.put(`/admin/partners/${id}`, data);
    return res.data.data;
  },

  toggle: async (id, active) => {
    const res = await api.patch(
      `/admin/partners/${id}/toggle?active=${active}`,
    );
    return res.data;
  },

  createOffer: async (data) => {
    const res = await api.post("/admin/partners/offers", data);
    return res.data.data;
  },

  toggleOffer: async (offerId, active) => {
    const res = await api.patch(
      `/admin/partners/offers/${offerId}/toggle?active=${active}`,
    );
    return res.data;
  },

  rotateKey: async (partnerId) => {
    const res = await api.post(`/admin/partners/${partnerId}/rotate-key`);
    return res.data.data;
  },

  seedDefaults: async () => {
    const res = await api.post("/admin/partners/seed-defaults");
    return res.data;
  },
};

export default partnersApi;
