import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (window.location.hostname.includes("vercel.app") ||
  window.location.hostname.includes("netlify.app")
    ? "https://luct-reporting-system-1-9jwp.onrender.com"
    : "http://localhost:10000");

console.log(`🌐 Using API Base URL: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message;
    console.error("❌ API Error:", message);
    return Promise.reject(error);
  }
);

export default api;
