package com.smartcampus.maintenance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.auth.service.JwtService;
import com.smartcampus.notification.dto.NotificationPreferencesDTO;
import com.smartcampus.notification.model.Notification;
import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.model.ReferenceType;
import com.smartcampus.notification.repository.NotificationPreferencesRepository;
import com.smartcampus.notification.repository.NotificationRepository;
import com.smartcampus.maintenance.MaintenanceApplication;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = MaintenanceApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationPreferencesControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;

    @Autowired private ObjectMapper objectMapper;

    @Autowired private JwtService jwtService;

    @Autowired private UserRepository userRepository;

    @Autowired private NotificationRepository notificationRepository;

    @Autowired private NotificationPreferencesRepository preferencesRepository;

    private User user;

    private String bearer() {
        return "Bearer " + jwtService.generateToken(user);
    }

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        preferencesRepository.deleteAll();
        userRepository.deleteAll();

        user =
                userRepository.save(
                        User.builder()
                                .email("prefs-user@test.local")
                                .name("Prefs User")
                                .roles(Set.of(Role.USER))
                                .build());
    }

    @Test
    void patch_disableInApp_thenNotificationsListEmpty() throws Exception {
        NotificationPreferencesDTO disabled = new NotificationPreferencesDTO(false, false);

        mockMvc.perform(
                        patch("/api/notification-preferences")
                                .header(HttpHeaders.AUTHORIZATION, bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(disabled)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inAppEnabled").value(false))
                .andExpect(jsonPath("$.emailEnabled").value(false));

        notificationRepository.save(
                Notification.builder()
                        .recipient(user)
                        .type(NotificationType.GENERAL)
                        .title("T")
                        .message("M")
                        .referenceId(null)
                        .referenceType(ReferenceType.TICKET)
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build());

        mockMvc.perform(
                        get("/api/notifications")
                                .param("page", "0")
                                .param("size", "10")
                                .param("sort", "createdAt,desc")
                                .header(HttpHeaders.AUTHORIZATION, bearer())
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        assertThat(preferencesRepository.findByUser_Id(user.getId()).orElseThrow().isInAppEnabled())
                .isFalse();
    }
}

