import axiosInstance from "./axiosInstance";

/** GET /users — ADMIN only */
export function fetchUsers() {
  return axiosInstance.get("/users").then((r) => r.data);
}
