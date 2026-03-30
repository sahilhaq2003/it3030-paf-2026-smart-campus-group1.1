package com.smartcampus.notification.service;

import com.smartcampus.notification.model.Notification;
import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.model.ReferenceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Persists and queries notifications for a recipient. Used by REST controllers and
 * {@code ApplicationListener} components for tickets/bookings.
 */
public interface NotificationService {

    Notification createNotification(
            Long recipientUserId,
            NotificationType type,
            String title,
            String message,
            Long referenceId,
            ReferenceType referenceType);

    Page<Notification> getNotificationsForUser(Long recipientUserId, Pageable pageable);

    void markAsRead(Long notificationId, Long recipientUserId);

    void markAllAsRead(Long recipientUserId);

    void deleteNotification(Long notificationId, Long recipientUserId);
}
