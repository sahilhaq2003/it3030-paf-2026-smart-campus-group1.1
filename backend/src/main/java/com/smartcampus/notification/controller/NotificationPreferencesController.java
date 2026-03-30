package com.smartcampus.notification.controller;

import com.smartcampus.auth.model.UserPrincipal;
import com.smartcampus.notification.dto.NotificationPreferencesDTO;
import com.smartcampus.notification.service.NotificationPreferencesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferencesController {

    private final NotificationPreferencesService preferencesService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public NotificationPreferencesDTO get(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return preferencesService.getPreferences(userId);
    }

    @PatchMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public NotificationPreferencesDTO patch(
            @RequestBody NotificationPreferencesDTO dto, Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return preferencesService.updatePreferences(userId, dto);
    }
}

