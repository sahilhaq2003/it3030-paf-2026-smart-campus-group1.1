import axios from "axios";
import { AUTH_TOKEN_STORAGE_KEY } from "../constants/authStorage";

/**
 * Do not set a default Content-Type: application/json — it sticks to multipart POSTs and can
 * break FormData (wrong boundary / wrong consumes on the server) and confuse Spring Security.
 * Axios sets application/json automatically when the body is a plain object.
 */
const axiosInstance = axios.create({
  baseURL: "http://localhost:8081/api",
});

axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  }
  return config;
});

export default axiosInstance;