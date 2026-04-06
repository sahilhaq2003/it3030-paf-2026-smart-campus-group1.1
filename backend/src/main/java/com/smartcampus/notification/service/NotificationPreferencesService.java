package com.smartcampus.notification.service;

import com.smartcampus.notification.dto.NotificationPreferencesDTO;

public interface NotificationPreferencesService {

    boolean isInAppEnabled(Long userId);

    NotificationPreferencesDTO getPreferences(Long userId);

    NotificationPreferencesDTO updatePreferences(Long userId, NotificationPreferencesDTO dto);
}

