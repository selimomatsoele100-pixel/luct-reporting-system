import axios from "axios";

// Base API URL - uses .env variable or defaults to localhost
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:1000";

console.log(`🌐 Using API Base URL: ${API_BASE_URL}`);

// Create an axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically log errors and responses (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
