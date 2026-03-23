import axiosInstance from "./axiosInstance";

/** GET /users — ADMIN only */
export function fetchUsers() {
  return axiosInstance.get("/users").then((r) => r.data);
}

/** GET /users/technicians — ADMIN only */
export function fetchTechnicians() {
  return axiosInstance.get("/users/technicians").then((r) => r.data);
}

/**
 * POST /users/technicians — ADMIN only
 * @param {{ email: string; name: string; password: string }} body
 */
export function createTechnician(body) {
  return axiosInstance
    .post("/users/technicians", body, {
      headers: { "Content-Type": "application/json" },
    })
    .then((r) => r.data);
}
