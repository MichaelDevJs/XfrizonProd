import api from "./axios";

const pointsApi = {
  getWallet: async () => {
    const res = await api.get("/points/wallet");
    return res.data.data;
  },

  getLedger: async (page = 0, size = 20) => {
    const res = await api.get(`/points/ledger?page=${page}&size=${size}`);
    return res.data.data;
  },

  redeem: async (offerId) => {
    const res = await api.post("/points/redeem", { offerId });
    return res.data.data;
  },

  getMyRedemptions: async (page = 0, size = 10) => {
    const res = await api.get(`/points/redemptions?page=${page}&size=${size}`);
    return res.data.data;
  },
};

export default pointsApi;
