package com.smartcampus.notification.service;

import com.smartcampus.notification.model.Notification;
import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.model.ReferenceType;
import com.smartcampus.notification.repository.NotificationRepository;
import com.smartcampus.notification.sse.NotificationSseService;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationSseService notificationSseService;
    private final NotificationPreferencesService notificationPreferencesService;

    @Override
    @Transactional
    public Notification createNotification(
            Long recipientUserId,
            NotificationType type,
            String title,
            String message,
            Long referenceId,
            ReferenceType referenceType) {
        boolean inAppEnabled = notificationPreferencesService.isInAppEnabled(recipientUserId);
        User recipient =
                userRepository
                        .findById(recipientUserId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Notification notification =
                Notification.builder()
                        .recipient(recipient)
                        .type(type)
                        .title(title)
                        .message(message)
                        .referenceId(referenceId)
                        .referenceType(referenceType)
                        .isRead(!inAppEnabled)
                        .build();
        Notification saved = notificationRepository.save(notification);

        // Push real-time update to any SSE subscribers.
        if (inAppEnabled) {
            notificationSseService.broadcast(
                    recipientUserId,
                    com.smartcampus.notification.dto.NotificationResponseDTO.builder()
                            .id(saved.getId())
                            .type(saved.getType())
                            .title(saved.getTitle())
                            .message(saved.getMessage())
                            .referenceId(saved.getReferenceId())
                            .referenceType(saved.getReferenceType())
                            .read(saved.isRead())
                            .createdAt(saved.getCreatedAt())
                            .build());
        }

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> getNotificationsForUser(Long recipientUserId, Pageable pageable) {
        boolean inAppEnabled = notificationPreferencesService.isInAppEnabled(recipientUserId);
        if (!inAppEnabled) {
            return Page.empty(pageable);
        }
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientUserId, pageable);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long recipientUserId) {
        Notification n =
                notificationRepository
                        .findByIdAndRecipient_Id(notificationId, recipientUserId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.isRead()) {
            n.setRead(true);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead(Long recipientUserId) {
        notificationRepository.markAllUnreadAsReadForRecipient(recipientUserId);
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId, Long recipientUserId) {
        long removed = notificationRepository.deleteByIdAndRecipient_Id(notificationId, recipientUserId);
        if (removed == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        }
    }
}
