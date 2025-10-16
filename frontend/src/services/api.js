import axios from "axios";

// CORRECT API URL - Fixed the typo
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://luct-reporting-system-1-9jwp.onrender.com";

console.log(`🌐 Using API Base URL: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - UPDATED to handle new response format
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received: ${response.status}`, response.data);
    
    // Handle the new response format {success: true, data: [...]}
    if (response.data && typeof response.data === 'object' && response.data.success !== undefined) {
      // If the response has the new format, extract the data
      if (response.data.courses !== undefined) {
        response.data = response.data.courses;
      } else if (response.data.classes !== undefined) {
        response.data = response.data.classes;
      } else if (response.data.lecturers !== undefined) {
        response.data = response.data.lecturers;
      } else if (response.data.users !== undefined) {
        response.data = response.data.users;
      } else if (response.data.reports !== undefined) {
        response.data = response.data.reports;
      } else if (response.data.complaints !== undefined) {
        response.data = response.data.complaints;
      } else if (response.data.data !== undefined) {
        response.data = response.data.data;
      }
      // If no specific data field, keep the original response but maintain compatibility
    }
    
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
    
    return Promise.reject(error);
  }
);

export default api;