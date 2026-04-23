import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT + handle FormData content-type
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("graphite_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set the correct multipart boundary for FormData
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("graphite_token");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
