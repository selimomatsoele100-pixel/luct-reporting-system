import axios from "axios";

// ======================================================
// 🌍 BASE API URL CONFIGURATION
// ======================================================

// Automatically choose API URL depending on environment
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (window.location.hostname.includes("vercel.app") ||
  window.location.hostname.includes("netlify.app")
    ? "https://luct-reporting-system-1-9jwp.onrender.com"
    : "http://localhost:1000");

console.log(`🌐 Using API Base URL: ${API_BASE_URL}`);

// ======================================================
// ⚙️ AXIOS INSTANCE
// ======================================================
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10s timeout for stability
});

// ======================================================
// 🚨 ERROR INTERCEPTOR
// ======================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message;

    console.error("❌ API Error:", message);
    if (error.response) {
      console.warn("🔍 Response Details:", error.response);
    }

    return Promise.reject(error);
  }
);

export default api;
