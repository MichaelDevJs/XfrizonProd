import api from "./axios";

const blogApi = {
  // Get all blogs
  getAllBlogs: async (filters = {}) => {
    try {
      const response = await api.get("/blogs", { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Get single blog by ID
  getBlogById: async (id) => {
    try {
      const response = await api.get(`/blogs/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Create new blog
  createBlog: async (blogData) => {
    try {
      const response = await api.post("/blogs", blogData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Update blog
  updateBlog: async (id, blogData) => {
    try {
      const response = await api.put(`/blogs/${id}`, blogData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Delete blog (soft delete)
  deleteBlog: async (id) => {
    try {
      const response = await api.delete(`/blogs/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Publish blog (change status)
  publishBlog: async (id) => {
    try {
      const response = await api.patch(`/blogs/${id}/publish`, {});
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Save as draft
  saveDraft: async (id, blogData) => {
    try {
      const response = await api.patch(`/blogs/${id}/draft`, blogData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },
};

export default blogApi;
