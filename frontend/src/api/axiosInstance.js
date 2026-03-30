import axios from "axios";
import { AUTH_TOKEN_STORAGE_KEY } from "../constants/authStorage";
import { notifyUnauthorizedResponse } from "./unauthorizedSession";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8081/api",
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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