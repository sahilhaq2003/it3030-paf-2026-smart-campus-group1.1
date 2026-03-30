package com.smartcampus.notification.controller;

import com.smartcampus.auth.model.UserPrincipal;
import com.smartcampus.auth.service.JwtService;
import com.smartcampus.notification.dto.NotificationResponseDTO;
import com.smartcampus.notification.model.Notification;
import com.smartcampus.notification.service.NotificationService;
import com.smartcampus.notification.sse.NotificationSseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.http.MediaType;
import java.io.IOException;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationSseService notificationSseService;
    private final JwtService jwtService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Page<NotificationResponseDTO> list(Pageable pageable, Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return notificationService.getNotificationsForUser(userId, pageable).map(this::toDto);
    }

    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markRead(@PathVariable Long id, Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.noContent().build();
    }

    private NotificationResponseDTO toDto(Notification n) {
        return NotificationResponseDTO.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    /**
     * SSE stream for real-time notification updates.
     *
     * Event format: {@code event: notification} with JSON payload matching {@link NotificationResponseDTO}.
     *
     * Because {@code EventSource} cannot send custom headers, the client provides the JWT as
     * {@code access_token} query param.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam("access_token") String accessToken) {
        Long userId = extractUserId(accessToken);
        SseEmitter emitter = notificationSseService.subscribe(userId);
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            // Ignore: client likely disconnected before we could send the initial event.
        }
        return emitter;
    }

    private Long extractUserId(String token) {
        try {
            Claims claims = jwtService.parseToken(token);
            Object userIdRaw = claims.get(JwtService.CLAIM_USER_ID);
            Long userId = toLong(userIdRaw);
            if (userId != null) return userId;
            return toLong(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid token");
        }
    }

    private static Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
