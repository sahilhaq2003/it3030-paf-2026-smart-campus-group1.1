package com.smartcampus.notification.service;

import com.smartcampus.notification.dto.NotificationPreferencesDTO;
import com.smartcampus.notification.model.NotificationPreferences;
import com.smartcampus.notification.repository.NotificationPreferencesRepository;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class NotificationPreferencesServiceImpl implements NotificationPreferencesService {

    private final NotificationPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public boolean isInAppEnabled(Long userId) {
        return getOrCreate(userId).isInAppEnabled();
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPreferencesDTO getPreferences(Long userId) {
        NotificationPreferences p = getOrCreate(userId);
        return new NotificationPreferencesDTO(p.isInAppEnabled(), p.isEmailEnabled());
    }

    @Override
    @Transactional
    public NotificationPreferencesDTO updatePreferences(
            Long userId, NotificationPreferencesDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preferences body required");
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "User not found"));

        NotificationPreferences p =
                preferencesRepository
                        .findByUser_Id(userId)
                        .orElseGet(
                                () ->
                                        NotificationPreferences.builder()
                                                .user(user)
                                                .build());

        p.setInAppEnabled(dto.inAppEnabled());
        p.setEmailEnabled(dto.emailEnabled());

        NotificationPreferences saved = preferencesRepository.save(p);
        return new NotificationPreferencesDTO(saved.isInAppEnabled(), saved.isEmailEnabled());
    }

    private NotificationPreferences getOrCreate(Long userId) {
        return preferencesRepository
                .findByUser_Id(userId)
                .orElseGet(
                        () -> {
                            User user =
                                    userRepository
                                            .findById(userId)
                                            .orElseThrow(
                                                    () ->
                                                            new ResponseStatusException(
                                                                    HttpStatus.NOT_FOUND,
                                                                    "User not found"));

                            return preferencesRepository.save(
                                    NotificationPreferences.builder()
                                            .user(user)
                                            .inAppEnabled(true)
                                            .emailEnabled(true)
                                            .build());
                        });
    }
}

