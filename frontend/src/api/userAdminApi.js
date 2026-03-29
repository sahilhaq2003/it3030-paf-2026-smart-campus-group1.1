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
 * @param {{ email: string; name: string; password: string; technicianCategory: string }} body
 */
export function createTechnician(body) {
  return axiosInstance
    .post("/users/technicians", body, {
      headers: { "Content-Type": "application/json" },
    })
    .then((r) => r.data);
}

/**
 * PATCH /users/technicians/:id — ADMIN only
 * @param {number} id
 * @param {{ name?: string; email?: string; password?: string; technicianCategory?: string }} body — include only fields to change
 */
export function updateTechnician(id, body) {
  return axiosInstance.patch(`/users/technicians/${id}`, body).then((r) => r.data);
}

/** DELETE /users/technicians/:id — ADMIN only */
export function deleteTechnician(id) {
  return axiosInstance.delete(`/users/technicians/${id}`);
}
