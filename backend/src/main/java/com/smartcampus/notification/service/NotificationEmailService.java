package com.smartcampus.notification.service;

import com.smartcampus.notification.model.Notification;
import com.smartcampus.user.model.User;

/**
 * Sends system emails for notifications when the user's notification preferences allow it.
 *
 * Note: all SMTP credentials must be provided via environment/.env variables.
 */
public interface NotificationEmailService {

    void sendNotificationEmail(User recipient, Notification notification);
}

