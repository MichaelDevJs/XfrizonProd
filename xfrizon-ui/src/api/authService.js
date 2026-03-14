import api from "./axios";

const authService = {
  register: async (firstName, lastName, email, password) => {
    try {
      const referralCode = (
        localStorage.getItem("xfrizon_referral") || ""
      ).trim();
      const response = await api.post("/auth/register", {
        firstName,
        lastName,
        email,
        password,
        confirmPassword: password,
        referralCode: referralCode || undefined,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  registerOrganizer: async (firstName, lastName, email, password) => {
    try {
      const referralCode = (
        localStorage.getItem("xfrizon_referral") || ""
      ).trim();
      const response = await api.post("/auth/register-organizer", {
        firstName,
        lastName,
        email,
        password,
        confirmPassword: password,
        referralCode: referralCode || undefined,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/user");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  updateUser: async (userData) => {
    try {
      const response = await api.put("/auth/user", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  validateToken: async () => {
    try {
      const response = await api.get("/auth/validate-token");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
  },
};

export default authService;
