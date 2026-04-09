package com.smartcampus.notification.dto;

import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.model.ReferenceType;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record NotificationResponseDTO(
        Long id,
        NotificationType type,
        String title,
        String message,
        Long referenceId,
        ReferenceType referenceType,
        boolean read,
        LocalDateTime createdAt) {}
