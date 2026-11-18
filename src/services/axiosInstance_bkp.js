import { api1, api2 } from "../baseUrl"
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: api1,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // 👈 allow cookies
});

// Flag to avoid multiple refresh requests in parallel
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Attach interceptor for requests
axiosInstance.interceptors.request.use(
  (config) => {
    
    const token = localStorage.getItem("a_v_t");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Attach interceptor for responses
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 👇 just call refresh, cookie is sent automatically
        const response = await axios.post(
          `${api1}/public/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.accessToken;

        localStorage.setItem("a_v_t", newAccessToken);
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = "Bearer " + newAccessToken;

        return axiosInstance(originalRequest);
      } catch (err) {
        localStorage.removeItem("a_v_t");
        localStorage.removeItem("user");
        window.location.href = "/signin";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;
