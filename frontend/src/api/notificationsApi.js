import axiosInstance from "./axiosInstance";

/**
 * @param {{ page?: number; size?: number; sort?: string }} [params]
 */
export function fetchNotifications(params = {}) {
  const page = params.page ?? 0;
  const size = params.size ?? 50;
  const sort = params.sort ?? "createdAt,desc";
  return axiosInstance
    .get("/notifications", { params: { page, size, sort } })
    .then((r) => r.data);
}

export function markNotificationRead(id) {
  return axiosInstance.patch(`/notifications/${id}/read`).then(() => undefined);
}

export function markAllNotificationsRead() {
  return axiosInstance.patch("/notifications/read-all").then(() => undefined);
}

export function deleteNotification(id) {
  return axiosInstance.delete(`/notifications/${id}`).then(() => undefined);
}
