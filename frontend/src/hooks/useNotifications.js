import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import {
  deleteNotification as deleteNotificationReq,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationsApi";
import { getMemoryToken } from "../api/authTokenMemory";

const REFETCH_MS = 30_000;

/**
 * @typedef {Object} NotificationDto
 * @property {number} id
 * @property {string} type
 * @property {string} title
 * @property {string} message
 * @property {number|null} [referenceId]
 * @property {string|null} [referenceType]
 * @property {boolean} read
 * @property {string} createdAt
 */

/**
 * @typedef {Object} NotificationsPage
 * @property {NotificationDto[]} content
 * @property {number} totalElements
 * @property {number} totalPages
 * @property {number} number
 */

export function useNotifications(enabled = true) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications({ page: 0, size: 100 }),
    enabled,
    refetchInterval: enabled ? REFETCH_MS : false,
  });

  const unreadCount =
    listQuery.data?.content?.filter((n) => !n.read).length ?? 0;

  useEffect(() => {
    if (!enabled) return;
    const token = getMemoryToken();
    if (!token) return;

    const baseUrl = axiosInstance.defaults.baseURL || "http://localhost:8081/api";
    const streamUrl = `${baseUrl}/notifications/stream?access_token=${encodeURIComponent(token)}`;

    const es = new EventSource(streamUrl);
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

    es.addEventListener("notification", invalidate);

    return () => {
      es.close();
    };
  }, [enabled, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteNotificationReq(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    notifications: listQuery.data?.content ?? [],
    unreadCount,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.error,
    refetch: listQuery.refetch,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    deleteNotification: deleteMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
