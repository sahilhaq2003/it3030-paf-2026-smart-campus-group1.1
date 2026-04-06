package com.smartcampus.integration;

import com.smartcampus.maintenance.MaintenanceApplication;
import com.smartcampus.auth.service.JwtService;
import com.smartcampus.notification.repository.NotificationRepository;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Role-based access checks for Member 4 coursework (USER must not list all users; notifications
 * allowed for authenticated users).
 */
@SpringBootTest(classes = MaintenanceApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Member4SecurityIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired TicketRepository ticketRepository;
    @Autowired NotificationRepository notificationRepository;

    private User plainUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        ticketRepository.deleteAll();
        userRepository.deleteAll();

        plainUser =
                userRepository.save(
                        User.builder()
                                .email("member4-user@test.local")
                                .name("Member4 User")
                                .roles(Set.of(Role.USER))
                                .build());
        adminUser =
                userRepository.save(
                        User.builder()
                                .email("member4-admin@test.local")
                                .name("Member4 Admin")
                                .roles(Set.of(Role.ADMIN))
                                .build());
    }

    @Test
    void getUsers_whenRoleUser_returns403() throws Exception {
        String token = jwtService.generateToken(plainUser);
        mockMvc.perform(get("/api/users").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUsers_whenRoleAdmin_returns200() throws Exception {
        String token = jwtService.generateToken(adminUser);
        mockMvc.perform(get("/api/users").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void getNotifications_whenRoleUser_returns200() throws Exception {
        String token = jwtService.generateToken(plainUser);
        mockMvc.perform(
                        get("/api/notifications").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }
}
