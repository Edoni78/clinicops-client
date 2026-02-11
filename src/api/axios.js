import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Include credentials for CORS if needed
  withCredentials: false,
});

// Add authorization token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Ensure token doesn't already have "Bearer " prefix
      const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401/403 errors - token expired or invalid
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Optionally redirect to login or clear token
      // localStorage.removeItem("accessToken");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
