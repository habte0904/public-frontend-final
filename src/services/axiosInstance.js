import { api1 } from "../baseUrl"
import axios from "axios";

// ── In-memory token store (Finding 1 fix) ─────────────────────────────────
// The access token is NEVER written to localStorage/sessionStorage.
// It lives only in this module-level variable and is lost on page reload,
// at which point auth-context.jsx performs a silent refresh via the httpOnly
// rt cookie to obtain a fresh token without user interaction.
let _accessToken = null;

/** Called by auth-context.jsx after login or silent refresh. */
export const setMemoryToken = (token) => { _accessToken = token; };

/** Called by auth-context.jsx on sign-out. */
export const clearMemoryToken = () => { _accessToken = null; };

// ──────────────────────────────────────────────────────────────────────────

const axiosInstance = axios.create({
  baseURL: api1,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send the httpOnly rt cookie on every request
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

// Attach access token from memory (never from localStorage)
axiosInstance.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers["Authorization"] = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401: attempt silent refresh via httpOnly rt cookie, retry original request
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        // Cookie (rt) is sent automatically — no token in request body needed
        const response = await axios.post(
          `${api1}/public/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.accessToken;
        setMemoryToken(newAccessToken);  // store in memory, NOT localStorage
        axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + newAccessToken;
        processQueue(null, newAccessToken);

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearMemoryToken();
        window.location.href = "/signin";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;

