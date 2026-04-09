import axiosInstance from "./axiosInstance";

/** GET /users — ADMIN only; optional `role` query: USER | ADMIN | TECHNICIAN */
export function fetchUsers(params = {}) {
  const role = params.role;
  return axiosInstance
    .get("/users", { params: role ? { role } : {} })
    .then((r) => r.data);
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

/** PATCH /users/:id/role — ADMIN only (@RequestBody { role: "USER"|"ADMIN"|"TECHNICIAN" }) */
export function updateUserRole(id, role) {
  return axiosInstance
    .patch(`/users/${id}/role`, { role }, { headers: { "Content-Type": "application/json" } })
    .then((r) => r.data);
}

/** PATCH /users/:id/enable — ADMIN only (toggles enabled flag) */
export function toggleUserEnabled(id) {
  return axiosInstance.patch(`/users/${id}/enable`).then((r) => r.data);
}

/** DELETE /users/:id — ADMIN / MANAGER (removes account; blocked if user has tickets as reporter) */
export function deleteUser(id) {
  return axiosInstance.delete(`/users/${id}`);
}
