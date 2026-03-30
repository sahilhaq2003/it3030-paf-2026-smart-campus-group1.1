package com.smartcampus.maintenance.controller;

import com.smartcampus.auth.service.JwtService;
import com.smartcampus.notification.model.Notification;
import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.model.ReferenceType;
import com.smartcampus.notification.repository.NotificationRepository;
import com.smartcampus.maintenance.MaintenanceApplication;
import com.smartcampus.maintenance.repository.TicketRepository;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = MaintenanceApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;

    @Autowired private JwtService jwtService;

    @Autowired private UserRepository userRepository;

    @Autowired private NotificationRepository notificationRepository;

    @Autowired private TicketRepository ticketRepository;

    private User user;

    private String bearer() {
        return "Bearer " + jwtService.generateToken(user);
    }

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        ticketRepository.deleteAll();
        userRepository.deleteAll();

        user =
                userRepository.save(
                        User.builder()
                                .email("notif-user@test.local")
                                .name("Notif User")
                                .roles(Set.of(Role.USER))
                                .build());
    }

    @Test
    void shouldListNotificationsForUser() throws Exception {
        notificationRepository.save(
                Notification.builder()
                        .recipient(user)
                        .type(NotificationType.NEW_COMMENT)
                        .title("New comment")
                        .message("Hello")
                        .referenceId(123L)
                        .referenceType(ReferenceType.TICKET)
                        .isRead(false)
                        .build());

        notificationRepository.save(
                Notification.builder()
                        .recipient(user)
                        .type(NotificationType.TICKET_STATUS_CHANGED)
                        .title("Status changed")
                        .message("OPEN -> IN_PROGRESS")
                        .referenceId(456L)
                        .referenceType(ReferenceType.TICKET)
                        .isRead(true)
                        .build());

        mockMvc.perform(
                        get("/api/notifications")
                                .param("page", "0")
                                .param("size", "10")
                                .param("sort", "createdAt,desc")
                                .header(HttpHeaders.AUTHORIZATION, bearer())
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].type", hasItems("NEW_COMMENT", "TICKET_STATUS_CHANGED")));
    }

    @Test
    void shouldMarkAllNotificationsRead() throws Exception {
        Notification n1 =
                notificationRepository.save(
                        Notification.builder()
                                .recipient(user)
                                .type(NotificationType.GENERAL)
                                .title("A")
                                .message("A")
                                .referenceId(null)
                                .referenceType(null)
                                .isRead(false)
                                .build());

        notificationRepository.save(
                Notification.builder()
                        .recipient(user)
                        .type(NotificationType.GENERAL)
                        .title("B")
                        .message("B")
                        .referenceId(null)
                        .referenceType(null)
                        .isRead(false)
                        .build());

        mockMvc.perform(
                        patch("/api/notifications/read-all")
                                .header(HttpHeaders.AUTHORIZATION, bearer())
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        // Re-fetch entity state
        Notification after =
                notificationRepository.findById(n1.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(after.isRead()).isTrue();
    }

    @Test
    void shouldMarkSingleNotificationRead() throws Exception {
        Notification n =
                notificationRepository.save(
                        Notification.builder()
                                .recipient(user)
                                .type(NotificationType.GENERAL)
                                .title("T")
                                .message("M")
                                .referenceId(null)
                                .referenceType(null)
                                .isRead(false)
                                .build());

        mockMvc.perform(
                        patch("/api/notifications/" + n.getId() + "/read")
                                .header(HttpHeaders.AUTHORIZATION, bearer())
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        Notification after =
                notificationRepository.findById(n.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(after.isRead()).isTrue();
    }

    @Test
    void shouldDeleteNotification() throws Exception {
        Notification n =
                notificationRepository.save(
                        Notification.builder()
                                .recipient(user)
                                .type(NotificationType.GENERAL)
                                .title("Del")
                                .message("Del")
                                .referenceId(null)
                                .referenceType(null)
                                .isRead(false)
                                .build());

        mockMvc.perform(
                        delete("/api/notifications/" + n.getId())
                                .header(HttpHeaders.AUTHORIZATION, bearer())
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        org.assertj.core.api.Assertions.assertThat(notificationRepository.findById(n.getId())).isEmpty();
    }
}

