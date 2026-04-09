import axios from "axios";
import { getMemoryToken } from "./authTokenMemory";
import { notifyUnauthorizedResponse } from "./unauthorizedSession";

/**
 * Do not set a default Content-Type: application/json — it sticks to multipart POSTs and can
 * break FormData (wrong boundary / wrong consumes on the server) and confuse Spring Security.
 * Axios sets application/json automatically when the body is a plain object.
 */
const axiosInstance = axios.create({
  baseURL: "http://localhost:8081/api",
  timeout: 15000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getMemoryToken();
  const url = String(config.url ?? "");
  const isPublicAuthCall =
    url.includes("/auth/login") ||
    url.includes("/auth/google") ||
    url.includes("/auth/register/lecturer");
  if (token && !isPublicAuthCall) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (isPublicAuthCall) {
    delete config.headers.Authorization;
    delete config.headers.authorization;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  } else if (
    config.data != null &&
    typeof config.data === "object" &&
    !(config.data instanceof ArrayBuffer) &&
    !(config.data instanceof Blob)
  ) {
    // Required for Spring @RequestBody JSON after we removed the default instance Content-Type.
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }
    const url = String(error.config?.url ?? "");
    const isAuthAttempt =
      url.includes("/auth/login") || url.includes("/auth/google");
    if (!isAuthAttempt) {
      notifyUnauthorizedResponse();
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;